import jwt from "jsonwebtoken";

export const SECRET = "realtime-test-secret-realtime-test-123456";
export const USER_ID = "3f2b8c1e-9d4a-4e6b-8f1a-2c7d5e9a0b34";

export const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Builds a token the way core does. `claims` overrides a claim, or removes it when set to undefined. */
export function makeToken({
  secret = SECRET,
  algorithm = "HS256",
  claims = {},
} = {}) {
  const payload = {
    sub: USER_ID,
    role: "STUDENT",
    iat: nowSeconds(),
    exp: nowSeconds() + 3600,
    ...claims,
  };
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) delete payload[key];
  }
  return jwt.sign(payload, secret, { algorithm });
}

const base64url = (obj) =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");

/** A token with alg "none" and no signature, the classic forgery attempt. */
export function unsignedToken(payload) {
  return `${base64url({ alg: "none", typ: "JWT" })}.${base64url(payload)}.`;
}
