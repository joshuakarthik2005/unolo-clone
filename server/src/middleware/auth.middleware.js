import jwt from "jsonwebtoken";

/**
 * Middleware: Verify JWT access token from httpOnly cookie
 */
export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(403).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

/**
 * Middleware: Authorize by role(s)
 * @param  {...string} roles - Allowed roles (e.g., "ADMIN", "MANAGER")
 */
export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions.",
      });
    }

    next();
  };
};
