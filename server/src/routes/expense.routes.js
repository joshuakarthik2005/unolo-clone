import { Router } from "express";
import {
  createExpense,
  getExpenses,
  updateExpenseStatus,
  getVehicleRates,
  updateVehicleRate
} from "../controllers/expense.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/", createExpense);
router.get("/", getExpenses);
router.put("/:id/status", authorizeRole("ADMIN", "MANAGER"), updateExpenseStatus);

// Vehicle Rates
router.get("/rates", getVehicleRates);
router.put("/rates", authorizeRole("ADMIN", "MANAGER"), updateVehicleRate);

export default router;
