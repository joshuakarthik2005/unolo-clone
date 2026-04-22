import { Router } from "express";
import { createSite, getSites } from "../controllers/site.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getSites);
router.post("/", authorizeRole("ADMIN"), createSite);

export default router;
