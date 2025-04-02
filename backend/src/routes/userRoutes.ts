import { Hono } from "hono";
import { createPrismaClient } from "../prismaClient";
import { Bindings, JWTPayload, verifyToken } from "../middleware/auth";
import { Prisma } from "@prisma/client/edge";
import bcrypt from "bcryptjs";

const router = new Hono<{
  Bindings: Bindings;
  Variables: { user: JWTPayload };
}>();

// Get user profile
router.get("/:userId", verifyToken, async (c) => {
  try {
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const user = await prisma.user.findUnique({
      where: { id: c.req.param("userId") },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Update user profile
router.put("/:userId", verifyToken, async (c) => {
  try {
    const userId = c.req.param("userId");
    const userFromToken = c.get("user");

    // Check if user is updating their own profile
    if (userFromToken?.userId !== userId) {
      return c.json({ message: "Not authorized to update this profile" }, 403);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const { name, currentPassword, newPassword } = await c.req.json();

    // If password change is requested
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        return c.json({ message: "Current password is incorrect" }, 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user with new password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return c.json(updatedUser);
    }

    // If only name is being updated
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return c.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return c.json({ message: "User not found" }, 404);
    }
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Get user's posts
router.get("/:userId/posts", verifyToken, async (c) => {
  try {
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const posts = await prisma.post.findMany({
      where: { authorId: c.req.param("userId") },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        upvotes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default router;
