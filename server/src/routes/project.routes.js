import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";
import { 
  getProjects, 
  getProjectById,
  createProject, 
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectVisibility
} from "../controllers/project.controller.js";

const router = express.Router();

router.use(authenticateToken);

// All authenticated users can view projects (access control is handled in the controller)
router.get("/", getProjects);
router.get("/:id", getProjectById);

// Only managers/admins can create projects
router.post("/", authorizeRole("ADMIN", "MANAGER"), createProject);

// Managing existing projects (updating details, members, visibility, deleting)
router.put("/:id", updateProject);
router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);
router.put("/:id/visibility", updateProjectVisibility);
router.delete("/:id", deleteProject);

export default router;