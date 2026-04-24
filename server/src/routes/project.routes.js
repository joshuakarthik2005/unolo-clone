import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";
import { getProjects, createProject, deleteProject } from "../controllers/project.controller.js";

const router = express.Router();

router.use(authenticateToken);

// Employees, Managers, Admins can view projects
router.get("/", getProjects);

// Only managers/admins can create/delete
router.use(authorizeRole("ADMIN", "MANAGER"));
router.post("/", createProject);
router.delete("/:id", deleteProject);

export default router;