import { Router } from "express";
import {
  inviteEmployee,
  addEmployee,
  getEmployees,
  getEmployeeProfile,
  updateEmployee,
  softDeleteEmployee,
} from "../controllers/employee.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/invite", authorizeRole("ADMIN", "MANAGER"), inviteEmployee);
router.post("/", authorizeRole("ADMIN", "MANAGER"), addEmployee);
router.get("/", authorizeRole("ADMIN", "MANAGER"), getEmployees);
router.get("/:id", authorizeRole("ADMIN", "MANAGER"), getEmployeeProfile);
router.put("/:id", authorizeRole("ADMIN", "MANAGER"), updateEmployee);
router.delete("/:id", authorizeRole("ADMIN", "MANAGER"), softDeleteEmployee);

export default router;
