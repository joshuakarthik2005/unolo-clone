import { Router } from "express";
import { punchIn, punchOut, getAttendanceLogs, getDailyStatus, applyRegularization, approveRegularization } from "../controllers/attendance.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/logs", getAttendanceLogs);
router.get("/daily-status", getDailyStatus);

router.post("/regularize", applyRegularization);
router.put("/regularize/:id/approve", authorizeRole("ADMIN", "MANAGER"), approveRegularization);

export default router;
