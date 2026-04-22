import { Router } from "express";
import {
  register,
  login,
  refreshTokenHandler,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshTokenHandler);
router.get("/me", authenticateToken, getMe);
router.post("/logout", authenticateToken, logout);

export default router;
