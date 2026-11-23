import { AuthError, verifyToken } from "./jwt.js";
import { sendError } from "../errors.js";

export function requireAuth(secret) {
  return (req, res, next) => {
    const header = req.get("authorization") ?? "";
    if (!header.startsWith("Bearer ")) {
      return sendError(req, res, 401, "Authentication required");
    }
    try {
      req.user = verifyToken(header.slice(7).trim(), secret);
      return next();
    } catch (err) {
      if (err instanceof AuthError) {
        return sendError(req, res, 401, err.message);
      }
      return next(err);
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : sendError(
          req,
          res,
          403,
          "You do not have permission to access this resource",
        );
}
