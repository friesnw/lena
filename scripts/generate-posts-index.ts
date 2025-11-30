/**
 * Script to generate posts/index.json from existing posts
 *
 * Usage:
 *   npx tsx scripts/generate-posts-index.ts
 *
 * This will:
 *   1. Read all posts from S3
 *   2. Generate an index with metadata only
 *   3. Upload it to S3 at posts/index.json
 */

import { promises as fs } from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Post } from "../lib/types";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "letters-for-lena-media";

// Load environment variables from .env.local
async function loadEnvFile(): Promise<void> {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const envFile = await fs.readFile(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const equalIndex = trimmed.indexOf("=");
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log("✅ Loaded environment variables from .env.local\n");
  } catch (error) {
    console.warn(
      "⚠️  Could not load .env.local file. Using existing environment variables.\n"
    );
  }
}

function getS3Client(): S3Client {
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || "").trim();

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials not configured. Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set"
    );
  }

  return new S3Client({
    region: (process.env.AWS_REGION || "us-east-2").trim(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generate S3 key for a post (same as in posts-s3.ts)
 */
function getPostS3Key(post: Post): string {
  const date = new Date(post.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `posts/${year}/${month}/post-${post.id}.json`;
}

/**
 * Extract metadata from a post (everything except full content)
 */
function extractPostMetadata(
  post: Post
): Omit<Post, "content"> & { s3Key: string } {
  const { content, ...metadata } = post;
  return {
    ...metadata,
    s3Key: getPostS3Key(post),
  };
}

/**
 * Read posts from S3
 */
async function readPostsFromS3(s3Client: S3Client): Promise<Post[]> {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "posts/",
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("📭 No posts found in S3");
      return [];
    }

    console.log(`📦 Found ${listResponse.Contents.length} post files in S3`);

    // Filter to only JSON files (exclude index.json)
    const postFiles = listResponse.Contents.filter(
      (obj) =>
        obj.Key && obj.Key.endsWith(".json") && obj.Key !== "posts/index.json"
    );

    console.log(`📥 Downloading ${postFiles.length} post files...`);

    // Download all posts in parallel
    const postPromises = postFiles.map(async (object) => {
      if (!object.Key) return null;

      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const response = await s3Client.send(getCommand);
        const bodyString = await response.Body?.transformToString();

        if (!bodyString) return null;

        return JSON.parse(bodyString) as Post;
      } catch (err) {
        console.warn(`⚠️  Error reading ${object.Key}:`, err);
        return null;
      }
    });

    const posts = (await Promise.all(postPromises)).filter(
      (post): post is Post => post !== null
    );

    console.log(`✅ Successfully downloaded ${posts.length} posts from S3`);
    return posts;
  } catch (error) {
    console.error("❌ Error reading posts from S3:", error);
    throw error;
  }
}

/**
 * Generate and upload index file
 */
async function generateAndUploadIndex(
  s3Client: S3Client,
  posts: Post[]
): Promise<void> {
  console.log(`\n📝 Generating index for ${posts.length} posts...`);

  // Extract metadata for each post
  const indexEntries = posts.map(extractPostMetadata);

  // Create index structure
  const index = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    totalPosts: posts.length,
    posts: indexEntries,
  };

  // Upload to S3
  const indexKey = "posts/index.json";
  const jsonString = JSON.stringify(index, null, 2);

  console.log(`\n📤 Uploading index to S3 (${indexKey})...`);
  console.log(`   Index size: ${(jsonString.length / 1024).toFixed(2)} KB`);

  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: indexKey,
    Body: jsonString,
    ContentType: "application/json",
  });

  await s3Client.send(putCommand);

  console.log(`\n✅ Successfully uploaded index to S3!`);
  console.log(`   Location: s3://${BUCKET_NAME}/${indexKey}`);
  console.log(`   Contains metadata for ${indexEntries.length} posts`);
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting posts index generation...\n");

  // Load environment variables
  await loadEnvFile();

  // Verify AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Error: AWS credentials not found!");
    console.error(
      "   Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env.local"
    );
    process.exit(1);
  }

  const s3Client = getS3Client();

  // Read posts from S3
  let posts: Post[];
  try {
    posts = await readPostsFromS3(s3Client);
  } catch (error) {
    console.error("\n❌ Error reading posts from S3:", error);
    console.error(
      "   Make sure your posts are migrated to S3 and AWS credentials are correct"
    );
    process.exit(1);
  }

  if (posts.length === 0) {
    console.error("❌ No posts found in S3!");
    console.error(
      "   Make sure your posts are migrated to S3 at posts/YYYY/MM/post-{id}.json"
    );
    process.exit(1);
  }

  // Generate and upload index
  await generateAndUploadIndex(s3Client, posts);

  console.log("\n✨ Index generation complete!");
}

// Run the script
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
