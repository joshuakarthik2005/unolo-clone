import prisma from "../lib/prisma.js";
import { getIO } from '../lib/socket.js';
import { sendExpenseEmail } from '../lib/email.js';

// Haversine formula to compute distance in KM
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const createExpense = async (req, res) => {
  try {
    const { date, type, amount, claimedDistance, billUrl } = req.body;
    let actualDistance = null;

    // If type is FUEL, auto-calculate the actual distance from Location Logs for that date
    if (type === 'FUEL') {
      const logs = await prisma.locationLog.findMany({
        where: {
          userId: req.user.id,
          timestamp: {
            gte: new Date(`${date}T00:00:00.000Z`),
            lte: new Date(`${date}T23:59:59.999Z`),
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (logs.length > 1) {
        let totalDistance = 0;
        for (let i = 0; i < logs.length - 1; i++) {
          totalDistance += getHaversineDistance(
            logs[i].lat, logs[i].lng,
            logs[i + 1].lat, logs[i + 1].lng
          );
        }
        actualDistance = parseFloat(totalDistance.toFixed(2));
      } else {
        actualDistance = 0;
      }
    }

    const expense = await prisma.expenseClaim.create({
      data: {
        userId: req.user.id,
        orgId: req.user.orgId,
        date,
        type,
        amount: parseFloat(amount),
        claimedDistance: claimedDistance ? parseFloat(claimedDistance) : null,
        actualDistance,
        billUrl,
        status: "PENDING"
      }
    });

    res.status(201).json({ success: true, data: expense, message: "Expense claim submitted successfully." });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ success: false, message: "Failed to submit expense claim." });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { status, type, month } = req.query;
    
    let query = {
      where: { orgId: req.user.orgId },
      include: {
        user: { select: { id: true, name: true, employeeCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    };

    if (req.user.role === 'FIELD_EMPLOYEE') {
      query.where.userId = req.user.id;
    } else if (req.user.role === 'MANAGER') {
      // Find employees reporting to this manager
       const team = await prisma.user.findMany({ where: { managerId: req.user.id }, select: { id: true } });
       const teamIds = team.map(t => t.id);
       query.where.userId = { in: teamIds };
    }

    if (status) query.where.status = status;
    if (type) query.where.type = type;
    if (month) { // YYYY-MM
      query.where.date = { startsWith: month };
    }

    const expenses = await prisma.expenseClaim.findMany(query);
    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch expense claims." });
  }
};

export const updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerNote } = req.body;

    const expense = await prisma.expenseClaim.findFirst({
        where: { id, orgId: req.user.orgId }
    });

    if (!expense) return res.status(404).json({ success: false, message: "Expense claim not found."});

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status, managerNote }
    });

    const expenseRecord = await prisma.expenseClaim.findUnique({ where: { id }, include: { user: true }});

    const io = getIO();
    io.to(`org_${expenseRecord.orgId}`).emit('notification', {
        type: 'EXPENSE_UPDATED',
        message: `Your expense claim has been ${status}`,
        expenseId: updated.id
    });
    
    sendExpenseEmail(expenseRecord.user.email, status);

    res.json({ success: true, data: updated, message: `Claim ${status.toLowerCase()} successfully.` });
  } catch (error) {
    console.error("Update expense status error:", error);
    res.status(500).json({ success: false, message: "Failed to update expense claim." });
  }
};

export const getVehicleRates = async (req, res) => {
    try {
        const rates = await prisma.vehicleRate.findMany({ where: { orgId: req.user.orgId }});
        res.json({ success: true, data: rates });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch vehicle rates." });
    }
}

export const updateVehicleRate = async (req, res) => {
    try {
        const { vehicleType, perKmRate } = req.body;
        const rate = await prisma.vehicleRate.upsert({
            where: {
                orgId_vehicleType: {
                    orgId: req.user.orgId,
                    vehicleType
                }
            },
            update: { perKmRate: parseFloat(perKmRate) },
            create: {
                orgId: req.user.orgId,
                vehicleType,
                perKmRate: parseFloat(perKmRate)
            }
        });
        res.json({ success: true, data: rate });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update vehicle rate." });
    }
}
