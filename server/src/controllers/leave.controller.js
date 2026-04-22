import prisma from "../lib/prisma.js";
import { getIO } from '../lib/socket.js';
import { sendLeaveEmail } from '../lib/email.js';

// Helper to seed leave types if missing
export const seedLeaveTypesIfMissing = async (orgId) => {
  const existing = await prisma.leaveType.findFirst({ where: { orgId } });
  if (!existing) {
    await prisma.leaveType.createMany({
      data: [
        { name: "Sick Leave", daysAnnually: 5, orgId },
        { name: "Casual Leave", daysAnnually: 10, orgId },
      ]
    });
  }
};

export const getLeaveBalances = async (req, res) => {
  try {
    await seedLeaveTypesIfMissing(req.user.orgId);

    const types = await prisma.leaveType.findMany({ where: { orgId: req.user.orgId } });
    
    // In a full app, we'd calculate taken leaves vs allowed per year based on approved requests.
    // Simplifying: we fetch approvals per type.
    const approved = await prisma.leaveRequest.findMany({
      where: { userId: req.user.id, status: "APPROVED" }
    });

    const balances = types.map(t => {
      const taken = approved.filter(a => a.leaveTypeId === t.id).reduce((sum, req) => {
        // approx days
        const diffTime = Math.abs(new Date(req.endDate) - new Date(req.startDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        return sum + diffDays;
      }, 0);

      return {
        id: t.id,
        name: t.name,
        total: t.daysAnnually,
        taken,
        remaining: t.daysAnnually - taken
      };
    });

    res.json({ success: true, data: balances });
  } catch (error) {
    console.error("Leave balances error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch balances." });
  }
};

export const getLeaveRequests = async (req, res) => {
  try {
    const query = { where: {} };

    // Standard employee sees their own requests
    if (req.user.role === "FIELD_EMPLOYEE") {
      query.where.userId = req.user.id;
    } else if (req.user.role === "MANAGER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone, let's just show all for simplicity
    }

    const requests = await prisma.leaveRequest.findMany({
      ...query,
      include: {
        leaveType: true,
        user: { select: { name: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch requests." });
  }
};

export const requestLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    
    if (!leaveTypeId || !startDate || !endDate || !reason) {
       return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: req.user.id,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });

    res.json({ success: true, data: leave, message: "Leave requested successfully." });
  } catch (error) {
    console.error("Request leave error:", error);
    res.status(500).json({ success: false, message: "Failed to submit request." });
  }
};

export const respondToLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approverId: req.user.id
      }
    });

    const leaveReq = await prisma.leaveRequest.findUnique({ where: { id }, include: { user: true }});
    
    // Notifications
    const io = getIO();
    io.to(`org_${leaveReq.user.orgId}`).emit('notification', {
        type: 'LEAVE_UPDATED',
        message: `Leave request has been ${status}`,
        leaveId: updated.id
    });
    
    sendLeaveEmail(leaveReq.user.email, status);

    res.json({ success: true, data: updated, message: `Leave ${status.toLowerCase()}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to respond." });
  }
};
