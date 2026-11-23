import { Server } from "socket.io";
import { socketAuth } from "./auth/socketAuth.js";

const MAX_TIMER_MS = 2 ** 31 - 1;

export function createSocketServer(httpServer, config) {
  const io = new Server(httpServer, {
    cors: { origin: config.frontendOrigin },
  });

  io.use(socketAuth(config.jwtSecret));

  io.on("connection", (socket) => {
    const { userId, role, exp } = socket.data.user;

    // Without refresh tokens, an expired token means no access: drop the connection.
    const msLeft = Math.min(Math.max(exp * 1000 - Date.now(), 0), MAX_TIMER_MS);
    const timer = setTimeout(() => socket.disconnect(true), msLeft);
    socket.on("disconnect", () => clearTimeout(timer));

    socket.on("whoami", (ack) => {
      if (typeof ack === "function") {
        ack({ userId, role });
      }
    });
  });

  return io;
}
