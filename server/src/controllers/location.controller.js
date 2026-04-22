import prisma from "../lib/prisma.js";
import { getIO } from "../lib/socket.js";

/**
 * POST /api/location/update
 * Receive GPS ping from mobile/client, save it, and broadcast to managers
 */
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, batteryLevel } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: "lat and lng are required." });
    }

    // Save to DB
    const logResult = await prisma.locationLog.create({
      data: {
        userId: req.user.id,
        lat,
        lng,
        accuracy: accuracy || null,
        batteryLevel: batteryLevel || null,
        timestamp: new Date(),
      },
    });

    // Broadcast to managers in the same organization
    const io = getIO();
    io.to(`org_${req.user.orgId}`).emit("locationUpdate", {
      userId: req.user.id,
      name: req.user.name,
      lat,
      lng,
      accuracy,
      batteryLevel,
      timestamp: logResult.timestamp,
    });

    res.json({ success: true, message: "Location updated." });
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({ success: false, message: "Failed to update location." });
  }
};

/**
 * GET /api/location/live
 * Return the most recent location log for all active field employees in the org
 */
export const getLiveLocations = async (req, res) => {
  try {
    // Determine the user pool (all for admin, subordinates for manager)
    const userQuery = {
      where: {
        orgId: req.user.orgId,
        role: "FIELD_EMPLOYEE",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    };

    if (req.user.role === "MANAGER") {
      userQuery.where.managerId = req.user.id;
    }

    const fieldEmployees = await prisma.user.findMany(userQuery);
    
    // For each employee, get their latest location
    // Currently Prisma doesn't have a great "distinct on" so we'll query maps iteratively or via a group by.
    // For a small number of employees, iterating is fine.
    const employeeIds = fieldEmployees.map(e => e.id);

    const latestLogs = await prisma.locationLog.findMany({
      where: {
        userId: { in: employeeIds },
      },
      orderBy: {
        timestamp: 'desc',
      },
      distinct: ['userId'], // get only the most recent per user
    });

    // Map logs to employee data
    const liveMap = latestLogs.map(log => {
      const emp = fieldEmployees.find(e => e.id === log.userId);
      return {
        ...emp,
        location: {
          lat: log.lat,
          lng: log.lng,
          accuracy: log.accuracy,
          batteryLevel: log.batteryLevel,
          timestamp: log.timestamp,
        }
      };
    });

    res.json({ success: true, data: { liveLocations: liveMap } });
  } catch (error) {
    console.error("Get live locations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch live locations." });
  }
};

/**
 * GET /api/location/history/:employeeId
 * Return full day path
 */
export const getLocationHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query; // optional 'YYYY-MM-DD'

    // Verify access
    const userQuery = { id: employeeId, orgId: req.user.orgId };
    if (req.user.role === "MANAGER") {
      userQuery.managerId = req.user.id;
    }

    const employee = await prisma.user.findFirst({ where: userQuery });
    if (!employee) {
       return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Filter by date
    let dateFilter = {};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      dateFilter = {
        timestamp: {
          gte: startDate,
          lte: endDate,
        }
      };
    }

    const logs = await prisma.locationLog.findMany({
      where: {
        userId: employeeId,
        ...dateFilter,
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json({ success: true, data: { history: logs } });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history." });
  }
};
