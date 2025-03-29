# Medium Clone Backend

A Cloudflare Workers-based backend for the Medium clone application, using Prisma with edge runtime.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
# Set your Prisma Accelerate database URL
wrangler secret put DATABASE_URL
```

3. Generate Prisma client:

```bash
npx prisma generate
```

## Development

Run the development server:

```bash
npm run dev
```

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## API Endpoints

### Authentication

- `POST /api/v1/signup` - Create a new user
- `POST /api/v1/login` - Login user

### Blog Posts

- `GET /api/v1/blog` - Get all posts
- `GET /api/v1/blog/:id` - Get a single post
- `POST /api/v1/blog` - Create a new post
- `PUT /api/v1/blog/:id` - Update a post
- `DELETE /api/v1/blog/:id` - Delete a post

## Environment Variables

- `DATABASE_URL` - Prisma Accelerate database URL
