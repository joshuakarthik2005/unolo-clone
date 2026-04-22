import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

/**
 * Generate a random refresh token string
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Parse duration string (e.g. "7d", "15m", "1h") to milliseconds
 */
export const parseDuration = (duration) => {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000; // default 7 days
  return parseInt(match[1]) * units[match[2]];
};

/**
 * Set auth cookies on response
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh-token",
  });
};

/**
 * Clear auth cookies
 */
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });
};
