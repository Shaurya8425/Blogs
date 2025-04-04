import { Hono } from "hono";
import { Prisma, Post } from "@prisma/client/edge";
import { createPrismaClient } from "../prismaClient";
import * as jose from "jose";
import type { Context, Next } from "hono";
import { R2Service } from "../services/r2Service";

// Define the type for environment variables
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
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
    console.error("Error verifying token:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({ error: "Invalid token", details: error instanceof Error ? error.message : String(error) }, 401);
  }
}

// Get all posts (protected route)
blogRoutes.get("/", verifyToken, async (c) => {
  try {
    console.log("Starting to fetch all posts...");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL);
    console.log("Prisma client created, fetching posts...");
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`Successfully found ${posts.length} posts`);
    return c.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({ error: "Error fetching posts", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get a single post by ID (protected route)
blogRoutes.get("/:id", verifyToken, async (c) => {
  try {
    console.log("Starting to fetch post by ID...");
    const id = c.req.param("id");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL);
    console.log("Prisma client created, fetching post...");
    const post = await prisma.post.findFirst({
      where: { 
        id,
      },
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
      console.log(`Post with ID ${id} not found`);
      return c.json({ error: "Post not found" }, 404);
    }

    console.log(`Successfully found post with ID ${id}`);
    return c.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({ error: "Error fetching post", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Create a new post (protected route)
blogRoutes.post("/", verifyToken, async (c) => {
  try {
    console.log("Starting to create new post...");
    const formData = await c.req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image") as File | null;
    const user = c.get("user");

    console.log("Received form data:", {
      hasTitle: !!title,
      hasContent: !!content,
      hasImage: !!image,
      imageType: image?.type,
      imageSize: image?.size,
    });

    if (!title || !content) {
      console.log("Title and content are required");
      return c.json({ error: "Title and content are required" }, 400);
    }

    let imageUrl: string | null = null;
    if (image) {
      try {
        console.log("Initializing R2 service with config:", {
          accountId: c.env.R2_ACCOUNT_ID,
          bucketName: c.env.R2_BUCKET_NAME,
          hasAccessKey: !!c.env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!c.env.R2_SECRET_ACCESS_KEY,
        });

        const r2Service = new R2Service({
          accountId: c.env.R2_ACCOUNT_ID,
          accessKeyId: c.env.R2_ACCESS_KEY_ID,
          secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
          bucketName: c.env.R2_BUCKET_NAME,
        });

        console.log("Converting image to buffer...");
        const buffer = await image.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        console.log("Starting R2 upload...");
        imageUrl = await r2Service.uploadImage(uint8Array, fileName, image.type);
        console.log("R2 upload successful, URL:", imageUrl);
      } catch (uploadError) {
        console.error("Error during image upload:", uploadError);
        return c.json({ 
          error: "Failed to upload image",
          details: uploadError instanceof Error ? uploadError.message : "Unknown error"
        }, 500);
      }
    }

    console.log("Creating post in database...");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    const post = await prisma.post.create({
      data: {
        title,
        content,
        ...(imageUrl !== null ? { imageUrl } : {}),
        authorId: user.userId,
        published: true,
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

    console.log("Post created successfully:", post.id);
    return c.json(post);
  } catch (error) {
    console.error("Error in post creation:", error);
    return c.json({ 
      error: "Failed to create post",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Update a post (protected route with ownership check)
blogRoutes.put("/:id", verifyToken, async (c) => {
  try {
    console.log("Starting to update post...");
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image") as File | null;
    const published = formData.get("published") === "true";
    const user = c.get("user");

    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@"));
    console.log("Prisma client created, updating post...");

    // Check if post exists and belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, published: true },
    });

    if (!existingPost) {
      console.log(`Post with ID ${id} not found`);
      return c.json({ error: "Post not found" }, 404);
    }

    if (existingPost.authorId !== user.userId) {
      console.log("Unauthorized to update this post");
      return c.json({ error: "Unauthorized to update this post" }, 403);
    }

    let imageUrl: string | null | undefined = undefined;
    if (image) {
      try {
        console.log("Uploading image to R2...");
        console.log("Image type:", image.type);
        console.log("Image name:", image.name);
        console.log("Image size:", image.size);

        const r2Service = new R2Service({
          accountId: c.env.R2_ACCOUNT_ID,
          accessKeyId: c.env.R2_ACCESS_KEY_ID,
          secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
          bucketName: c.env.R2_BUCKET_NAME,
        });

        const buffer = await image.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        imageUrl = await r2Service.uploadImage(uint8Array, fileName, image.type);
        console.log("Image uploaded successfully. URL:", imageUrl);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return c.json({ error: "Failed to upload image" }, 500);
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        published: published !== undefined ? published : existingPost.published,
      } as Prisma.PostUncheckedUpdateInput,
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

    console.log("Post updated successfully");
    return c.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        console.log("Post not found");
        return c.json({ error: "Post not found" }, 404);
      }
    }
    return c.json({ error: "Error updating post", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Delete a post (protected route with ownership check)
blogRoutes.delete("/:id", verifyToken, async (c) => {
  try {
    console.log("Starting to delete post...");
    const id = c.req.param("id");
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@"));
    console.log("Prisma client created, deleting post...");

    // Check if post exists and belongs to the user
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      console.log(`Post with ID ${id} not found`);
      return c.json({ error: "Post not found" }, 404);
    }

    if (post.authorId !== user.userId) {
      console.log("Unauthorized to delete this post");
      return c.json({ error: "Unauthorized to delete this post" }, 403);
    }

    await prisma.post.delete({
      where: { id },
    });

    console.log("Post deleted successfully");
    return c.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        console.log("Post not found");
        return c.json({ error: "Post not found" }, 404);
      }
    }
    return c.json({ error: "Error deleting post", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Upvote a post (protected route)
blogRoutes.post("/:id/upvote", verifyToken, async (c) => {
  try {
    console.log("Starting to upvote post...");
    const id = c.req.param("id");
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@"));
    console.log("Prisma client created, upvoting post...");

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      console.log(`Post with ID ${id} not found`);
      return c.json({ error: "Post not found" }, 404);
    }

    // Create upvote
    const upvote = await prisma.upvote.create({
      data: {
        userId: user.userId,
        postId: id,
      },
    });

    console.log("Upvote created successfully");
    return c.json(upvote, 201);
  } catch (error) {
    console.error("Error upvoting post:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        console.log("Already upvoted");
        return c.json({ error: "Already upvoted" }, 400);
      }
    }
    return c.json({ error: "Error upvoting post", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Remove upvote (protected route)
blogRoutes.delete("/:id/upvote", verifyToken, async (c) => {
  try {
    console.log("Starting to remove upvote...");
    const id = c.req.param("id");
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@"));
    console.log("Prisma client created, removing upvote...");

    await prisma.upvote.delete({
      where: {
        userId_postId: {
          userId: user.userId,
          postId: id,
        },
      },
    });

    console.log("Upvote removed successfully");
    return c.json({ message: "Upvote removed successfully" });
  } catch (error) {
    console.error("Error removing upvote:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        console.log("Upvote not found");
        return c.json({ error: "Upvote not found" }, 404);
      }
    }
    return c.json({ error: "Error removing upvote", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Add reply to a post (protected route)
blogRoutes.post("/:id/replies", verifyToken, async (c) => {
  try {
    console.log("Starting to add reply to post...");
    const id = c.req.param("id");
    const { content } = await c.req.json();
    const user = c.get("user");

    if (!content?.trim()) {
      console.log("Reply content is required");
      return c.json({ error: "Reply content is required" }, 400);
    }

    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@"));
    console.log("Prisma client created, adding reply...");

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      console.log(`Post with ID ${id} not found`);
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

    console.log("Reply created successfully");
    return c.json(reply, 201);
  } catch (error) {
    console.error("Error adding reply to post:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({ error: "Error adding reply to post", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Delete reply (protected route with ownership check)
blogRoutes.delete("/:id/replies/:replyId", verifyToken, async (c) => {
  try {
    console.log("Starting to delete reply...");
    const { id, replyId } = c.req.param();
    const user = c.get("user");
    const prisma = createPrismaClient(c.env.DATABASE_URL);
    console.log("Database URL:", c.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@"));
    console.log("Prisma client created, deleting reply...");

    // Check if reply exists and belongs to the user
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      select: { userId: true },
    });

    if (!reply) {
      console.log(`Reply with ID ${replyId} not found`);
      return c.json({ error: "Reply not found" }, 404);
    }

    if (reply.userId !== user.userId) {
      console.log("Unauthorized to delete this reply");
      return c.json({ error: "Unauthorized to delete this reply" }, 403);
    }

    await prisma.reply.delete({
      where: { id: replyId },
    });

    console.log("Reply deleted successfully");
    return c.json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting reply:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({ error: "Error deleting reply", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default blogRoutes;
