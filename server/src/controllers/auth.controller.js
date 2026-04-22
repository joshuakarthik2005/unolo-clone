import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
  parseDuration,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/jwt.utils.js";

/**
 * POST /api/auth/register
 * Register a new organization with its admin account
 */
export const register = async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body;

    // Validation
    if (!companyName || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: companyName, name, email, password",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: companyName,
          adminId: user.id,
        },
      });

      // Link user to org
      await tx.user.update({
        where: { id: user.id },
        data: { orgId: organization.id },
      });

      return { user, organization };
    });

    // Generate tokens
    const userWithOrg = { ...result.user, orgId: result.organization.id };
    const accessToken = generateAccessToken(userWithOrg);
    const refreshTokenStr = generateRefreshToken();

    // Save refresh token
    const refreshExpiry = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + refreshExpiry),
      },
    });

    // Set cookies
    setAuthCookies(res, accessToken, refreshTokenStr);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshTokenStr = generateRefreshToken();

    // Save refresh token (delete old ones for this user first)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    const refreshExpiry = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiry),
      },
    });

    // Set cookies
    setAuthCookies(res, accessToken, refreshTokenStr);

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * POST /api/auth/refresh-token
 * Refresh the access token using the refresh token cookie
 */
export const refreshTokenHandler = async (req, res) => {
  try {
    const refreshTokenStr = req.cookies?.refreshToken;

    if (!refreshTokenStr) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided.",
      });
    }

    // Find refresh token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Check expiry
    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }

    // Rotate refresh token
    const newRefreshTokenStr = generateRefreshToken();
    const refreshExpiry = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || "7d");

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshTokenStr,
        expiresAt: new Date(Date.now() + refreshExpiry),
      },
    });

    // Generate new access token
    const accessToken = generateAccessToken(storedToken.user);

    // Set cookies
    setAuthCookies(res, accessToken, newRefreshTokenStr);

    res.json({
      success: true,
      message: "Token refreshed.",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed.",
    });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        profilePhoto: true,
        createdAt: true,
        orgId: true,
        orgMembership: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout and clear cookies
 */
export const logout = async (req, res) => {
  try {
    const refreshTokenStr = req.cookies?.refreshToken;
    if (refreshTokenStr) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenStr },
      });
    }
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out." });
  }
};
