import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

/**
 * Middleware that verifies the JWT token from the Authorization header.
 * Attaches req.userId on success, returns 401 on failure.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error(`🔐 Auth failed [${err.name}]: ${err.message}`);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
}
