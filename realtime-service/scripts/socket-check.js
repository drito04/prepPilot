import { io } from "socket.io-client";

const [url, token, mode] = process.argv.slice(2);
if (!url || !token) {
  console.error("Usage: node scripts/socket-check.js <url> <token> [polling]");
  process.exit(1);
}

const socket = io(url, {
  transports: mode === "polling" ? ["polling"] : ["websocket"],
  reconnection: false,
  auth: { token },
});

socket.on("connect", () => {
  console.log(
    "connected through",
    url,
    "using",
    socket.io.engine.transport.name,
  );
  socket.emit("whoami", (me) => {
    console.log("whoami ->", me);
    socket.close();
  });
});

socket.on("connect_error", (err) => {
  console.error("connect_error:", err.message);
  process.exit(1);
});
