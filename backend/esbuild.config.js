const esbuild = require("esbuild");

esbuild.build({
   entryPoints: ["src/index.ts"],
   bundle: true,
   outfile: "dist/index.js",
   platform: "browser",
   format: "esm",
   target: "esnext",
   external: [
      "@prisma/client/edge",
      "@prisma/client",
      "bcryptjs"
   ],
   define: {
      "process.env.NODE_ENV": '"production"',
      "global": "globalThis",
   },
   logLevel: "info",
   minify: true,
   sourcemap: true,
   conditions: ["worker", "browser"],
}).catch(() => process.exit(1));
