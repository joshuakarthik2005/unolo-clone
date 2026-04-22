import prisma from "../lib/prisma.js";
import { getIO } from '../lib/socket.js';
import { sendTaskEmail } from '../lib/email.js';

// Haversine distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

export const getTasks = async (req, res) => {
  try {
    const query = {
      where: { orgId: req.user.orgId },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { scheduledDate: 'asc' }
    };

    if (req.user.role === 'FIELD_EMPLOYEE') {
      query.where.assignedToId = req.user.id;
    }

    const tasks = await prisma.task.findMany(query);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch tasks." });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { client: true, photos: true, forms: true, assignedTo: { select: { id: true, name: true }} }
    });

    if (!task || task.orgId !== req.user.orgId) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch task." });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, assignedToId, clientId, priority, scheduledDate, notes } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        orgId: req.user.orgId,
        assignedToId,
        assignedById: req.user.id,
        clientId,
        priority: priority || 'MEDIUM',
        scheduledDate: new Date(scheduledDate),
        notes,
        geoRadius: 100
      },
      include: { client: true, assignedTo: { select: { name: true }} }
    });

    res.json({ success: true, data: task, message: "Task assigned." });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ success: false, message: "Failed to create task." });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { status, title, priority, scheduledDate, notes } = req.body;
    
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        title,
        priority,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        notes
      }
    });

    res.json({ success: true, data: task, message: "Task updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update task." });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Task deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete task." });
  }
};

export const startTask = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { client: true }
    });

    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    if (task.assignedToId !== req.user.id) {
       return res.status(403).json({ success: false, message: "Task not assigned to you." });
    }

    // Geofencing Check
    if (lat !== undefined && lng !== undefined && task.client) {
      const dist = calculateDistance(lat, lng, task.client.lat, task.client.lng);
      if (dist > task.geoRadius) {
        return res.status(403).json({ 
          success: false, 
          message: `Outside client radius. You are ${Math.round(dist - task.geoRadius)}m away from the client.` 
        });
      }
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: "IN_PROGRESS",
        startTime: new Date()
      }
    });

    res.json({ success: true, data: updated, message: "Task started." });
  } catch (error) {
    console.error("Start task error:", error);
    res.status(500).json({ success: false, message: "Failed to start task." });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { photoUrls, formData } = req.body; // Arrays
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    // Mark as completed
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: "COMPLETED",
        endTime: new Date()
      }
    });

    // Attach photos
    if (photoUrls && photoUrls.length > 0) {
      await prisma.taskPhoto.createMany({
        data: photoUrls.map(url => ({ taskId: task.id, photoUrl: url }))
      });
    }

    // Attach form
    if (formData) {
      await prisma.taskForm.create({
        data: {
          taskId: task.id,
          formData // Assumes JSON object
        }
      });
    }

    res.json({ success: true, data: updated, message: "Task completed." });
  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({ success: false, message: "Failed to complete task." });
  }
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const where = { orgId: req.user.orgId };
    if (req.user.role === 'FIELD_EMPLOYEE') {
       where.assignedToId = req.user.id;
    }

    // Get counts
    const counts = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    const parsed = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      DELAYED: 0,
      CANCELLED: 0
    };

    let total = 0;
    counts.forEach(c => {
      parsed[c.status] = c._count;
      total += c._count;
    });

    res.json({ 
      success: true, 
      data: {
         counts: parsed,
         total,
         completionRate: total > 0 ? ((parsed.COMPLETED / total) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch analytics." });
  }
};
