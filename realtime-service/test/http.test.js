import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { SECRET, USER_ID, makeToken, nowSeconds } from "./helpers.js";

let server;
let baseUrl;

beforeAll(async () => {
  const app = createApp({ config: { jwtSecret: SECRET }, redis: null });
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(
  () =>
    new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections?.();
    }),
);

const get = (path, headers = {}) => fetch(baseUrl + path, { headers });
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe("GET /health", () => {
  it("reports UP", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "UP", redis: "not configured" });
  });
});

describe("GET /whoami", () => {
  it("returns 401 in the agreed error shape when no token is sent", async () => {
    const res = await get("/whoami");
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(Object.keys(body).sort()).toEqual([
      "error",
      "message",
      "path",
      "status",
      "timestamp",
    ]);
    expect(body).toMatchObject({
      status: 401,
      error: "UNAUTHORIZED",
      message: "Authentication required",
      path: "/whoami",
    });
  });

  it("rejects a non-Bearer scheme", async () => {
    const res = await get("/whoami", { Authorization: "Basic abc" });
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe("Authentication required");
  });

  it("rejects a garbage token", async () => {
    const res = await get("/whoami", bearer("garbage"));
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe("Invalid token");
  });

  it("rejects an expired token", async () => {
    const res = await get(
      "/whoami",
      bearer(makeToken({ claims: { exp: nowSeconds() - 60 } })),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe("Token expired");
  });

  it("returns the user for a valid token", async () => {
    const res = await get(
      "/whoami",
      bearer(makeToken({ claims: { role: "INTERVIEWER" } })),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: USER_ID, role: "INTERVIEWER" });
  });
});

describe("GET /admin-ping", () => {
  it("returns 403 for a student", async () => {
    const res = await get("/admin-ping", bearer(makeToken()));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("FORBIDDEN");
  });

  it("returns 200 for an admin", async () => {
    const res = await get(
      "/admin-ping",
      bearer(makeToken({ claims: { role: "ADMIN" } })),
    );
    expect(res.status).toBe(200);
  });
});

it("returns 404 in the agreed shape for unknown paths", async () => {
  const res = await get("/nope");
  expect(res.status).toBe(404);
  expect((await res.json()).error).toBe("NOT_FOUND");
});
