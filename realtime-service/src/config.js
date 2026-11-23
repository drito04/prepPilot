export function loadConfig(env = process.env) {
  const jwtSecret = env.JWT_SECRET ?? "";
  if (Buffer.byteLength(jwtSecret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return {
    port: Number(env.PORT ?? 4000),
    jwtSecret,
    redisUrl: env.REDIS_URL ?? "redis://localhost:6379",
    frontendOrigin: env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  };
}
