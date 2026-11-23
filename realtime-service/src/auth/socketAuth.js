import { AuthError, verifyToken } from "./jwt.js";

function extractToken(socket) {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth !== "") {
    return fromAuth;
  }
  const header = socket.handshake.headers?.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

export function socketAuth(secret) {
  return (socket, next) => {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      socket.data.user = verifyToken(token, secret);
      return next();
    } catch (err) {
      return next(
        new Error(err instanceof AuthError ? err.message : "Invalid token"),
      );
    }
  };
}
