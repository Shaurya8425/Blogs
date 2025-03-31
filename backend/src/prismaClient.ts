import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// Initialize Prisma Client factory function
export function createPrismaClient(databaseUrl: string) {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ["query", "error", "warn"],
  }).$extends(withAccelerate());
}

// Create a function to get the prisma client with the correct database URL
export function getPrismaClient(env: { DATABASE_URL: string }) {
  return createPrismaClient(env.DATABASE_URL);
}

// Export a default instance for compatibility
export default {
  user: {
    findUnique: () =>
      Promise.reject(new Error("Please use getPrismaClient with env")),
    update: () =>
      Promise.reject(new Error("Please use getPrismaClient with env")),
  },
  post: {
    findMany: () =>
      Promise.reject(new Error("Please use getPrismaClient with env")),
  },
};
