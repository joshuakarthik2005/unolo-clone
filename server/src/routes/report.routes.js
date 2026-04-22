import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { 
  getAttendanceSummary, 
  getTaskPerformance, 
  getEmployeeActivity, 
  getExpenseSummary 
} from '../controllers/report.controller.js';

const router = express.Router();

// Only ADMIN and MANAGER should access reports
router.use(protect);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/attendance-summary', getAttendanceSummary);
router.get('/task-performance', getTaskPerformance);
router.get('/employee-activity', getEmployeeActivity);
router.get('/expense-summary', getExpenseSummary);

export default router;
