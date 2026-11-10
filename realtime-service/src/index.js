const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "UP", service: "realtime-service" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" },
});

io.on("connection", (socket) => {
  console.log("client connected", socket.id);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`realtime-service on ${PORT}`));
