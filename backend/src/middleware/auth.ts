import { Context, Next } from "hono";
import * as jose from "jose";

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

export type JWTPayload = {
  userId: string;
  email: string;
  name?: string | null;
};

export async function generateToken(
  payload: JWTPayload,
  secret: string
): Promise<string> {
  const jwt = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(secret));
  return jwt;
}

export async function verifyToken(
  c: Context<{ Bindings: Bindings; Variables: { user: JWTPayload } }>,
  next: Next
) {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "No token provided" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const secretKey = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    c.set("user", payload as JWTPayload);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export async function rateLimiter(c: Context, next: Next) {
  // Simple rate limiter - you might want to implement a more sophisticated version
  await next();
}
