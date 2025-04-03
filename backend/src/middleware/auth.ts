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
    // Skip token check for login and signup endpoints
    const path = new URL(c.req.url).pathname;
    if (path.endsWith('/login') || path.endsWith('/signup')) {
      await next();
      return;
    }

    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "No token provided" }, 401);
    }

    const token = authHeader.split(" ")[1];
    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return c.json({ error: "Server configuration error" }, 500);
    }

    const secretKey = new TextEncoder().encode(c.env.JWT_SECRET);
    try {
      const { payload } = await jose.jwtVerify(token, secretKey);
      c.set("user", payload as JWTPayload);
      await next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: "Authentication failed" }, 500);
  }
}

export async function rateLimiter(c: Context, next: Next) {
  // Simple rate limiter - you might want to implement a more sophisticated version
  await next();
}
