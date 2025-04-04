-- Publish all existing posts
UPDATE "Post" SET "published" = true WHERE "published" = false;
