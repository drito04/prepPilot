import { loadConfig } from "../src/config.js";
import { verifyToken } from "../src/auth/jwt.js";

const token = process.argv[2];
if (!token) {
  console.error("Usage: node --env-file=.env scripts/check-token.js <token>");
  process.exit(1);
}

try {
  console.log("VALID", verifyToken(token, loadConfig().jwtSecret));
} catch (err) {
  console.error("REJECTED:", err.message);
  process.exit(1);
}
