import { Router } from "express";
import { getLeaveBalances, getLeaveRequests, requestLeave, respondToLeave } from "../controllers/leave.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/balances", getLeaveBalances);
router.get("/requests", getLeaveRequests);

router.post("/request", requestLeave);
router.put("/request/:id/respond", authorizeRole("ADMIN", "MANAGER"), respondToLeave);

export default router;
