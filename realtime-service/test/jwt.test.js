import { describe, expect, it } from "vitest";
import { AuthError, verifyToken } from "../src/auth/jwt.js";
import {
  SECRET,
  USER_ID,
  makeToken,
  nowSeconds,
  unsignedToken,
} from "./helpers.js";

function expectRejected(token, message) {
  let error;
  try {
    verifyToken(token, SECRET);
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(AuthError);
  expect(error.message).toBe(message);
}

describe("verifyToken", () => {
  it("accepts a valid token and returns user id, role and expiry", () => {
    const principal = verifyToken(makeToken(), SECRET);
    expect(principal.userId).toBe(USER_ID);
    expect(principal.role).toBe("STUDENT");
    expect(principal.exp).toBeGreaterThan(nowSeconds());
  });

  it.each(["STUDENT", "INTERVIEWER", "ADMIN"])("accepts role %s", (role) => {
    expect(verifyToken(makeToken({ claims: { role } }), SECRET).role).toBe(
      role,
    );
  });

  it("rejects an expired token with its own message", () => {
    expectRejected(
      makeToken({ claims: { exp: nowSeconds() - 60 } }),
      "Token expired",
    );
  });

  it("rejects a token signed with another secret", () => {
    expectRejected(
      makeToken({ secret: "another-secret-another-secret-123456" }),
      "Invalid token",
    );
  });

  it("rejects a token with a tampered signature", () => {
    const [header, payload, signature] = makeToken().split(".");
    const flipped = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
    expectRejected(`${header}.${payload}.${flipped}`, "Invalid token");
  });

  it("rejects a correctly signed HS512 token because only HS256 is allowed", () => {
    expectRejected(makeToken({ algorithm: "HS512" }), "Invalid token");
  });

  it("rejects an unsigned alg=none token", () => {
    const forged = unsignedToken({
      sub: USER_ID,
      role: "ADMIN",
      exp: nowSeconds() + 3600,
    });
    expectRejected(forged, "Invalid token");
  });

  it("rejects a token without exp", () => {
    expectRejected(makeToken({ claims: { exp: undefined } }), "Invalid token");
  });

  it.each([
    ["a non-UUID subject", { sub: "admin" }],
    ["an unknown role", { role: "SUPERUSER" }],
    ["a role with a ROLE_ prefix", { role: "ROLE_ADMIN" }],
    ["a missing role", { role: undefined }],
  ])("rejects %s", (_name, claims) => {
    expectRejected(makeToken({ claims }), "Invalid token");
  });

  it("rejects garbage", () => {
    expectRejected("not-a-jwt", "Invalid token");
  });
});
