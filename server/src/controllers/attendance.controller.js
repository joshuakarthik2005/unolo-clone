import prisma from "../lib/prisma.js";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export const punchIn = async (req, res) => {
  try {
    const { lat, lng, selfieUrl } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already punched in
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (existingRecord) {
      return res.status(400).json({ success: false, message: "Already punched in for today." });
    }

    // Get User and Site data to validate geofence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { site: true, orgMembership: { include: { shifts: true } } }
    });

    // Validating Geofence
    if (user.site && lat !== undefined && lng !== undefined) {
      const dist = calculateDistance(lat, lng, user.site.lat, user.site.lng);
      if (dist > user.site.radius) {
        return res.status(403).json({ 
          success: false, 
          message: `Outside geofence. You are ${Math.round(dist - user.site.radius)}m away from assigned site.` 
        });
      }
    }

    // Determine status (PRESENT vs LATE)
    let status = "PRESENT";
    if (user.orgMembership && user.orgMembership.shifts && user.orgMembership.shifts.length > 0) {
      // Assuming user uses the first shift for simplicity
      const shiftStartTime = user.orgMembership.shifts[0].startTime; // e.g. "09:00"
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);
      
      const currentTimeInMins = currentHour * 60 + currentMinute;
      const shiftTimeInMins = shiftHour * 60 + shiftMinute;

      if (currentTimeInMins > shiftTimeInMins + 15) { // 15 min grace period
        status = "LATE";
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        userId,
        date: today,
        punchInTime: new Date(),
        punchInLat: lat || 0,
        punchInLng: lng || 0,
        status,
        selfieUrl: selfieUrl || null
      }
    });

    res.json({ success: true, data: record, message: `Punched in successfully as ${status}.` });

  } catch (error) {
    console.error("Punch In Error:", error);
    res.status(500).json({ success: false, message: "Punch in failed." });
  }
};

export const punchOut = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Find today's record
    const record = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "No punch-in record found for today." });
    }

    if (record.punchOutTime) {
      return res.status(400).json({ success: false, message: "Already punched out." });
    }

    // Calculate total hours
    const punchOutTime = new Date();
    const totalHours = (punchOutTime.getTime() - new Date(record.punchInTime).getTime()) / (1000 * 60 * 60);

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        punchOutTime,
        punchOutLat: lat || 0,
        punchOutLng: lng || 0,
        totalHours
      }
    });

    res.json({ success: true, data: updated, message: "Punched out successfully." });

  } catch (error) {
    console.error("Punch Out Error:", error);
    res.status(500).json({ success: false, message: "Punch out failed." });
  }
};

export const getDailyStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const record = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Daily status error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch." });
  }
};

export const getAttendanceLogs = async (req, res) => {
  try {
    const { employeeId, month } = req.query; // optional filters
    const query = { where: {} };

    // Standard employee only sees themselves. Managers/admins see requested employee
    if (req.user.role === "FIELD_EMPLOYEE") {
      query.where.userId = req.user.id;
    } else if (employeeId) {
      query.where.userId = employeeId;
      
      // If manager, verify this is their subordinate
      if (req.user.role === "MANAGER") {
        const emp = await prisma.user.findFirst({ where: { id: employeeId, managerId: req.user.id } });
        if (!emp) return res.status(403).json({ success: false, message: "Unauthorized." });
      }
    }

    if (month) {
      // YYYY-MM
      query.where.date = { startsWith: month };
    }

    const records = await prisma.attendanceRecord.findMany({
      ...query,
      orderBy: { date: 'desc' },
      include: { 
        regularization: true,
        user: { select: { name: true, employeeCode: true } }
      }
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Fetch Logs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch logs." });
  }
};

export const applyRegularization = async (req, res) => {
  try {
    const { attendanceId, correctedPunchIn, correctedPunchOut, reason } = req.body;
    
    const reqLog = await prisma.regularizationRequest.create({
      data: {
        userId: req.user.id,
        attendanceId,
        correctedPunchIn: new Date(correctedPunchIn),
        correctedPunchOut: correctedPunchOut ? new Date(correctedPunchOut) : null,
        reason
      }
    });

    res.json({ success: true, data: reqLog });
  } catch (error) {
    console.error("Req Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit request." });
  }
};

export const approveRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "APPROVED" or "REJECTED"

    const reg = await prisma.regularizationRequest.update({
      where: { id },
      data: { status, approverId: req.user.id }
    });

    if (status === "APPROVED") {
      // Apply the fix to the attendance log natively
      const hours = reg.correctedPunchOut 
         ? (new Date(reg.correctedPunchOut).getTime() - new Date(reg.correctedPunchIn).getTime()) / (1000*60*60)
         : null;

      await prisma.attendanceRecord.update({
        where: { id: reg.attendanceId },
        data: {
          punchInTime: reg.correctedPunchIn,
          punchOutTime: reg.correctedPunchOut,
          totalHours: hours
        }
      });
    }

    res.json({ success: true, data: reg });
  } catch(error) {
    console.error("Approve req error:", error);
    res.status(500).json({ success: false, message: "Failed to process approval." });
  }
};
