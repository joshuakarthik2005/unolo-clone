import { Router } from "express";
import { getClients, createClient, getClientById, updateClient, deleteClient } from "../controllers/client.controller.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getClients);
router.get("/:id", getClientById);
router.post("/", authorizeRole("ADMIN", "MANAGER"), createClient);
router.put("/:id", authorizeRole("ADMIN", "MANAGER"), updateClient);
router.delete("/:id", authorizeRole("ADMIN", "MANAGER"), deleteClient);

export default router;
