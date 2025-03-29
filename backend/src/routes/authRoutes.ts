import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client/edge";
import { createPrismaClient } from "../prismaClient";
import {
  Bindings,
  JWTPayload,
  generateToken,
  verifyToken,
  rateLimiter,
} from "../middleware/auth";

// Create a typed Hono instance
const authRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: JWTPayload };
}>();

// Test protected route to verify token
authRoutes.get("/me", verifyToken, async (c) => {
  const user = c.get("user");
  return c.json({
    message: "Protected route accessed successfully",
    user: {
      id: user.userId,
      email: user.email,
      name: user.name || null,
    },
  });
});

authRoutes.post("/signup", rateLimiter, async (c) => {
  try {
    const { username, password, name } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Validate JWT_SECRET is configured
    if (!c.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return c.json({ error: "Server configuration error" }, 500);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: username,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = await generateToken(
      { userId: user.id, email: user.email, name: user.name },
      c.env.JWT_SECRET
    );

    return c.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        token,
        message: "User created successfully",
      },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return c.json({ error: "Email already exists" }, 409);
      }
    }
    return c.json({ error: "Error creating user" }, 500);
  }
});

// Add rate limiting to login route
authRoutes.post("/login", rateLimiter, async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const user = await prisma.user.findUnique({
      where: {
        email: username,
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return c.json({ error: "Invalid password" }, 401);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = await generateToken(
      { userId: user.id, email: user.email, name: user.name },
      c.env.JWT_SECRET
    );

    return c.json({
      ...userWithoutPassword,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Error during login" }, 500);
  }
});

export default authRoutes;
