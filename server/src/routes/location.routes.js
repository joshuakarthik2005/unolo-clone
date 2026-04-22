import { Router } from "express";
import { updateLocation, getLiveLocations, getLocationHistory } from "../controllers/location.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

// Field employees hit this route
router.post("/update", updateLocation);

// Managers/Admins hit these routes
router.get("/live", authorizeRole("ADMIN", "MANAGER"), getLiveLocations);
router.get("/history/:employeeId", authorizeRole("ADMIN", "MANAGER"), getLocationHistory);

export default router;
