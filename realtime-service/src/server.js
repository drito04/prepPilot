import http from "node:http";
import Redis from "ioredis";
import { loadConfig } from "./config.js";
import { createApp } from "./app.js";
import { createSocketServer } from "./socket.js";

const config = loadConfig();

const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 2 });
redis.on("error", (err) => console.error("Redis error:", err.message));

const httpServer = http.createServer(createApp({ config, redis }));
const io = createSocketServer(httpServer, config);

httpServer.listen(config.port, () => {
  console.log(`realtime-service listening on port ${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 5000).unref();
  io.close(() => redis.quit().finally(() => process.exit(0)));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
