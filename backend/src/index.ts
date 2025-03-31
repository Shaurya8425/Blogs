import { Hono } from "hono";
import { cors } from "hono/cors";
import blogRoutes from "./routes/blogRoutes";
import authRoutes from "./routes/authRoutes";

// Define the type for your environment variables
type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware
app.use(
  "/*",
  cors({
    origin: [
      // Local development URLs
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
      "http://localhost:5176",
      "http://127.0.0.1:5176",
      "http://localhost:5177",
      "http://127.0.0.1:5177",
      // Backend URL
      "https://backend.shaurya-y321.workers.dev",
      // Vercel deployment URLs
      "https://13-1-medium.vercel.app",
      "https://13-1-medium-git-main-shauryay321-gmailcoms-projects.vercel.app",
      "https://13-1-medium-o9sytor0t-shauryay321-gmailcoms-projects.vercel.app",
    ],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 86400,
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (c) => c.json({ status: "ok" }));

// Register routes
app.use("/api/v1/blog", async (c, next) => {
  /* 
  1. get the header
  2. verify the header
  if the header is correct, we can proceed
  otherwise, return 403 status code
  */
  await next();
});
app.route("/api/v1/blog", blogRoutes);
app.route("/api/v1", authRoutes);

export default app;
