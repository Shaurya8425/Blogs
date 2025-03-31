import { Hono } from "hono";
import { Prisma } from "@prisma/client/edge";
import { createPrismaClient } from "../prismaClient";
import * as jose from "jose";
import type { Context, Next } from "hono";

// Define the type for environment variables
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

// Define the type for JWT payload
type JWTPayload = {
  userId: string;
  email: string;
};

// Create a typed Hono instance with Variables
const blogRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: JWTPayload };
}>();

// Middleware to verify JWT token
async function verifyToken(
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

// Get all posts (public route)
blogRoutes.get("/", async (c) => {
  try {
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        upvotes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return c.json(posts);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error fetching posts" }, 500);
  }
});

// Get a single post by ID (public route)
blogRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        upvotes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json(post);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error fetching post" }, 500);
  }
});

// Create a new post (protected route)
blogRoutes.post("/", verifyToken, async (c) => {
  try {
    const { title, content } = await c.req.json();
    const user = c.get("user");

    if (!title || !content) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: user.userId, // Use the authenticated user's ID
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return c.json(post, 201);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return c.json({ error: "Author not found" }, 404);
      }
    }
    return c.json({ error: "Error creating post" }, 500);
  }
});

// Update a post (protected route with ownership check)
blogRoutes.put("/:id", verifyToken, async (c) => {
  try {
    const id = c.req.param("id");
    const { title, content, published } = await c.req.json();
    const user = c.get("user");

    if (!title || !content) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if the post belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (existingPost.authorId !== user.userId) {
      return c.json({ error: "Unauthorized to update this post" }, 403);
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        published: published ?? false,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return c.json(post);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return c.json({ error: "Post not found" }, 404);
      }
    }
    return c.json({ error: "Error updating post" }, 500);
  }
});

// Delete a post (protected route with ownership check)
blogRoutes.delete("/:id", verifyToken, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if the post belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (existingPost.authorId !== user.userId) {
      return c.json({ error: "Unauthorized to delete this post" }, 403);
    }

    await prisma.post.delete({
      where: { id },
    });

    return c.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return c.json({ error: "Post not found" }, 404);
      }
    }
    return c.json({ error: "Error deleting post" }, 500);
  }
});

// Upvote a post (protected route)
blogRoutes.post("/:id/upvote", verifyToken, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Create upvote
    const upvote = await prisma.upvote.create({
      data: {
        userId: user.userId,
        postId: id,
      },
    });

    return c.json(upvote, 201);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return c.json({ error: "Already upvoted" }, 400);
      }
    }
    return c.json({ error: "Error upvoting post" }, 500);
  }
});

// Remove upvote (protected route)
blogRoutes.delete("/:id/upvote", verifyToken, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    await prisma.upvote.delete({
      where: {
        userId_postId: {
          userId: user.userId,
          postId: id,
        },
      },
    });

    return c.json({ message: "Upvote removed successfully" });
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return c.json({ error: "Upvote not found" }, 404);
      }
    }
    return c.json({ error: "Error removing upvote" }, 500);
  }
});

// Add reply to a post (protected route)
blogRoutes.post("/:id/replies", verifyToken, async (c) => {
  try {
    const id = c.req.param("id");
    const { content } = await c.req.json();
    const user = c.get("user");

    if (!content?.trim()) {
      return c.json({ error: "Reply content is required" }, 400);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Create reply
    const reply = await prisma.reply.create({
      data: {
        content,
        userId: user.userId,
        postId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return c.json(reply, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error creating reply" }, 500);
  }
});

// Delete reply (protected route with ownership check)
blogRoutes.delete("/:id/replies/:replyId", verifyToken, async (c) => {
  try {
    const { id, replyId } = c.req.param();
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);

    // Check if reply exists and belongs to the user
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      select: { userId: true },
    });

    if (!reply) {
      return c.json({ error: "Reply not found" }, 404);
    }

    if (reply.userId !== user.userId) {
      return c.json({ error: "Unauthorized to delete this reply" }, 403);
    }

    await prisma.reply.delete({
      where: { id: replyId },
    });

    return c.json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error deleting reply" }, 500);
  }
});

export default blogRoutes;
