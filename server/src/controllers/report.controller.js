import prisma from "../lib/prisma.js";

// GET /api/reports/attendance-summary
// Returns today's snapshot and a 30-day trend for the Line Chart
export const getAttendanceSummary = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    
    // Get last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // YYYY-MM-DD format for strings
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const records = await prisma.attendanceRecord.findMany({
      where: {
        user: { orgId },
        date: { gte: dateStr } // lexicographical works for YYYY-MM-DD
      }
    });

    // Process trend
    const trendMap = {};
    // initialize last 30 days to 0
    for(let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        trendMap[ds] = { date: ds, PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, ON_LEAVE: 0 };
    }

    let todayActive = 0;
    const todayStr = today.toISOString().split('T')[0];

    records.forEach(r => {
        if(trendMap[r.date]) {
            if(trendMap[r.date][r.status] !== undefined) {
                trendMap[r.date][r.status]++;
            }
        }
        if(r.date === todayStr && (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'HALF_DAY')) {
            todayActive++;
        }
    });

    const trend = Object.values(trendMap);

    res.json({
      success: true,
      data: {
        trend,
        todayActive
      }
    });
  } catch (error) {
    console.error("Attendance Report error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance report" });
  }
};

// GET /api/reports/task-performance
export const getTaskPerformance = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    
    const tasks = await prisma.task.findMany({
      where: { orgId }
    });

    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let delayed = 0;
    let cancelled = 0;

    tasks.forEach(t => {
      if(t.status === 'COMPLETED') completed++;
      else if(t.status === 'PENDING') pending++;
      else if(t.status === 'IN_PROGRESS') inProgress++;
      else if(t.status === 'DELAYED') delayed++;
      else if(t.status === 'CANCELLED') cancelled++;
    });

    res.json({
      success: true,
      data: {
        total: tasks.length,
        completed,
        pending,
        inProgress,
        delayed,
        cancelled,
        chartData: [
            { name: 'Completed', value: completed },
            { name: 'Pending', value: pending },
            { name: 'In Progress', value: inProgress },
            { name: 'Delayed', value: delayed },
        ]
      }
    });
  } catch (error) {
    console.error("Task Report error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch task report" });
  }
};

// GET /api/reports/employee-activity
export const getEmployeeActivity = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    
    const employees = await prisma.user.findMany({
      where: { orgId, role: 'FIELD_EMPLOYEE' },
      include: {
        assignedTasks: true,
        expenseClaims: { where: { type: 'FUEL' }}
      }
    });

    const activity = employees.map(emp => {
      const completedTasks = emp.assignedTasks.filter(t => t.status === 'COMPLETED').length;
      const totalDistance = emp.expenseClaims.reduce((sum, exp) => sum + (exp.claimedDistance || 0), 0);
      
      return {
        id: emp.id,
        name: emp.name,
        tasksCompleted: completedTasks,
        totalTasks: emp.assignedTasks.length,
        distanceTraveled: totalDistance,
      };
    });

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error("Activity Report error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity report" });
  }
};

// GET /api/reports/expense-summary
export const getExpenseSummary = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    
    const expenses = await prisma.expenseClaim.groupBy({
      by: ['type'],
      where: { orgId, status: 'APPROVED' },
      _sum: { amount: true }
    });

    let totalAmount = 0;
    const chartData = expenses.map(e => {
        totalAmount += e._sum.amount || 0;
        return {
            name: e.type,
            value: e._sum.amount || 0
        };
    });

    res.json({
      success: true,
      data: {
        totalAmount,
        chartData
      }
    });
  } catch (error) {
    console.error("Expense Report error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch expense report" });
  }
};
