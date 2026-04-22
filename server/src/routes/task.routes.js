import { Router } from "express";
import { 
  getTasks, createTask, getTaskById, updateTask, deleteTask, 
  startTask, completeTask, getDashboardAnalytics 
} from "../controllers/task.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

// Analytics
router.get("/dashboard", getDashboardAnalytics);

// CRUD
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", authorizeRole("ADMIN", "MANAGER"), createTask);
router.put("/:id", authorizeRole("ADMIN", "MANAGER"), updateTask);
router.delete("/:id", authorizeRole("ADMIN", "MANAGER"), deleteTask);

// Status toggles
router.post("/:id/start", startTask);
router.post("/:id/complete", completeTask);

export default router;
