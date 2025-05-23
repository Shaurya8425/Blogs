import { Hono } from "hono";
import { cors } from "hono/cors";
import blogRoutes from "./routes/blogRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

// Define the type for your environment variables
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  CLOUDFLARE_ACCOUNT_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware
app.use("*", async (c, next) => {
  const allowedOrigins = [
    'https://blogs-pi-taupe.vercel.app',
    'https://blogs-shauryay321-gmailcoms-projects.vercel.app',
    'https://blogs-git-main-shauryay321-gmailcoms-projects.vercel.app',
    'http://localhost:5180', // Local development URL
    'http://127.0.0.1:5180',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  const origin = c.req.header('Origin');
  
  // Add CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  c.header('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS request
  if (c.req.method === 'OPTIONS') {
    const headers = new Headers();
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new Response(null, {
      status: 204,
      headers
    });
  }
  
  await next();
});

// Health check endpoint
app.get("/", (c) => c.json({ status: "ok" }));

// Register routes
app.route("/api/v1/blog", blogRoutes);
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/users", userRoutes);

export default app;
