import http from "node:http";
import { io as connect } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSocketServer } from "../src/socket.js";
import { SECRET, USER_ID, makeToken, nowSeconds } from "./helpers.js";

let io;
let url;
const sockets = [];

beforeAll(async () => {
  const httpServer = http.createServer();
  io = createSocketServer(httpServer, {
    jwtSecret: SECRET,
    frontendOrigin: "http://localhost:5173",
  });
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${httpServer.address().port}`;
});

afterAll(async () => {
  sockets.forEach((socket) => socket.close());
  await new Promise((resolve) => io.close(resolve));
});

/** Resolves with { socket } on success or { error } with the server's rejection message. */
function open(options = {}) {
  return new Promise((resolve) => {
    const socket = connect(url, {
      transports: ["websocket"],
      reconnection: false,
      ...options,
    });
    sockets.push(socket);
    socket.on("connect", () => resolve({ socket }));
    socket.on("connect_error", (err) => resolve({ error: err.message }));
  });
}

const whoami = (socket) =>
  new Promise((resolve) => socket.emit("whoami", resolve));

describe("Socket.IO handshake auth", () => {
  it("accepts a valid token in auth.token and answers whoami", async () => {
    const token = makeToken({ claims: { role: "INTERVIEWER" } });
    const { socket, error } = await open({ auth: { token } });
    expect(error).toBeUndefined();
    expect(await whoami(socket)).toEqual({
      userId: USER_ID,
      role: "INTERVIEWER",
    });
  });

  it("accepts a valid token in the Authorization header (non-browser clients)", async () => {
    const { socket, error } = await open({
      extraHeaders: { Authorization: `Bearer ${makeToken()}` },
    });
    expect(error).toBeUndefined();
    expect(await whoami(socket)).toEqual({ userId: USER_ID, role: "STUDENT" });
  });

  it("rejects a connection without a token", async () => {
    expect((await open()).error).toBe("Authentication required");
  });

  it("rejects a garbage token", async () => {
    expect((await open({ auth: { token: "garbage" } })).error).toBe(
      "Invalid token",
    );
  });

  it("rejects an expired token", async () => {
    const token = makeToken({ claims: { exp: nowSeconds() - 60 } });
    expect((await open({ auth: { token } })).error).toBe("Token expired");
  });

  it("rejects a token signed with another secret", async () => {
    const token = makeToken({ secret: "another-secret-another-secret-123456" });
    expect((await open({ auth: { token } })).error).toBe("Invalid token");
  });

  it("ignores a token sent in the query string", async () => {
    const { error } = await open({ query: { token: makeToken() } });
    expect(error).toBe("Authentication required");
  });

  it("disconnects the socket when its token expires", async () => {
    const token = makeToken({ claims: { exp: nowSeconds() + 2 } });
    const { socket } = await open({ auth: { token } });
    const reason = await new Promise((resolve) =>
      socket.on("disconnect", resolve),
    );
    expect(reason).toBe("io server disconnect");
  }, 10000);
});
