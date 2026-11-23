import express from "express";
import { requireAuth, requireRole } from "./auth/httpAuth.js";
import { sendError } from "./errors.js";

export function createApp({ config, redis }) {
  const app = express();
  app.disable("x-powered-by");

  // Used by Docker healthchecks. Redis is optional so tests can run without it.
  app.get("/health", async (req, res) => {
    let redisStatus = "not configured";
    if (redis) {
      try {
        await redis.ping();
        redisStatus = "up";
      } catch {
        redisStatus = "down";
      }
    }
    const ok = redisStatus !== "down";
    res
      .status(ok ? 200 : 503)
      .json({ status: ok ? "UP" : "DOWN", redis: redisStatus });
  });

  // Diagnostic routes: they prove the middleware works. Nginx does not route them (only /socket.io).
  const auth = requireAuth(config.jwtSecret);
  app.get("/whoami", auth, (req, res) =>
    res.json({ userId: req.user.userId, role: req.user.role }),
  );
  app.get("/admin-ping", auth, requireRole("ADMIN"), (req, res) =>
    res.json({ ok: true }),
  );

  app.use((req, res) => sendError(req, res, 404, "Not Found"));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    sendError(req, res, 500, "Unexpected server error");
  });

  return app;
}
