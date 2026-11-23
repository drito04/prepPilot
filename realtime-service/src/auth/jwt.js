import jwt from "jsonwebtoken";

const ROLES = new Set(["STUDENT", "INTERVIEWER", "ADMIN"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Verifies a token issued by the core service.
 * The secret is a plain string and is used as raw UTF-8 bytes, never base64-decoded,
 * exactly as docs/jwt-contract.md says.
 */
export function verifyToken(token, secret) {
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch (err) {
    throw new AuthError(
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    );
  }

  const valid =
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.sub === "string" &&
    UUID.test(payload.sub) &&
    ROLES.has(payload.role) &&
    typeof payload.exp === "number";

  if (!valid) {
    throw new AuthError("Invalid token");
  }
  return { userId: payload.sub, role: payload.role, exp: payload.exp };
}
