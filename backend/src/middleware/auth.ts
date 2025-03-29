import { Context, Next } from "hono";
import * as jose from "jose";
import { Prisma } from "@prisma/client";

// Define the type for environment variables
export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

// Define the type for JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  name?: string | null;
  iat: number;
  exp: number;
}

// Simple rate limiting implementation
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const signupAttempts = new Map<string, { count: number; timestamp: number }>();

export async function rateLimiter(c: Context, next: Next) {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 20; // Increased from 5 to 20 attempts

  // Determine which map to use based on the endpoint
  const attemptsMap = c.req.path.includes("/login")
    ? loginAttempts
    : signupAttempts;
  const attempts = attemptsMap.get(ip) || { count: 0, timestamp: now };

  // Reset if window has passed
  if (now - attempts.timestamp > windowMs) {
    attempts.count = 0;
    attempts.timestamp = now;
  }

  if (attempts.count >= maxAttempts) {
    return c.json(
      {
        error: "Too many attempts. Please try again later.",
        nextAttemptAt: new Date(attempts.timestamp + windowMs).toISOString(),
      },
      429
    );
  }

  attempts.count++;
  attemptsMap.set(ip, attempts);

  await next();
}

// Helper function to generate JWT
export async function generateToken(payload: any, secret: string) {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // converting secret to binary
  const secretKey = new TextEncoder().encode(secret);

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

// Middleware to verify JWT token
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
    // Cast the payload to our JWTPayload type
    const userPayload = payload as unknown as JWTPayload;
    c.set("user", userPayload);

    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

// Create a shared error handler
export function errorHandler(error: any) {
  console.error(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return { error: "Resource already exists", status: 409 };
      case "P2025":
        return { error: "Resource not found", status: 404 };
      case "P2003":
        return { error: "Related resource not found", status: 404 };
    }
  }
  return { error: "Internal server error", status: 500 };
}

// Blog post validation
export function validatePost(data: any) {
  const errors = [];
  if (!data.title?.trim()) errors.push("Title is required");
  if (!data.content?.trim()) errors.push("Content is required");
  if (data.title?.length > 100) errors.push("Title too long");
  return errors;
}

// Response types
export interface AuthResponse {
  id: string;
  email: string;
  name: string | null;
  token: string;
  message: string;
}

export interface PostResponse {
  id: string;
  title: string;
  content: string;
  published: boolean;
  author: {
    id: string;
    email: string;
    name: string | null;
  };
}
