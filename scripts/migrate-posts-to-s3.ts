/**
 * Migration script to copy posts from data/posts.json to S3
 *
 * Usage:
 *   npm run migrate-posts [--dry-run]
 *
 * Or run directly with tsx:
 *   npx tsx scripts/migrate-posts-to-s3.ts [--dry-run]
 */

import { promises as fs } from "fs";
import path from "path";
import { Post } from "../lib/types";
import { savePost } from "../lib/posts-s3";

/**
 * Load environment variables from .env.local file
 */
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

        // Remove surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // Only set if not already set (don't override existing env vars)
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });

    // Verify critical env vars were loaded
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;

    if (hasAccessKey && hasSecretKey) {
      console.log("✅ Loaded environment variables from .env.local");
      console.log(
        `   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`
      );
      console.log(
        `   Secret Key: ${
          process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "MISSING"
        }\n`
      );
    } else {
      console.warn(
        `⚠️  Loaded .env.local but missing credentials: AccessKey=${hasAccessKey}, SecretKey=${hasSecretKey}\n`
      );
    }
  } catch (error) {
    console.warn(
      "⚠️  Could not load .env.local file. Using existing environment variables.\n"
    );
  }
}

const POSTS_FILE = path.join(process.cwd(), "data", "posts.json");

interface MigrationResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; title: string; error: string }>;
}

async function migratePosts(dryRun: boolean = false): Promise<void> {
  // Load environment variables first
  await loadEnvFile();

  console.log("🚀 Starting posts migration to S3...\n");

  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No posts will be uploaded\n");
  }

  // Verify AWS credentials are loaded
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Error: AWS credentials not found!");
    console.error(
      "   Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env.local"
    );
    process.exit(1);
  }

  // Read existing posts.json
  let posts: Post[];
  try {
    const fileContents = await fs.readFile(POSTS_FILE, "utf-8");
    posts = JSON.parse(fileContents.trim()) as Post[];
    console.log(`📖 Read ${posts.length} posts from ${POSTS_FILE}\n`);
  } catch (error) {
    console.error("❌ Error reading posts.json:", error);
    process.exit(1);
  }

  const result: MigrationResult = {
    total: posts.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Migrate each post
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const progress = `[${i + 1}/${posts.length}]`;

    try {
      if (dryRun) {
        // In dry-run, just validate the post structure
        if (!post.id || !post.title || !post.createdAt) {
          throw new Error("Missing required fields");
        }
        console.log(`${progress} ✅ Would migrate: ${post.title} (${post.id})`);
        result.success++;
      } else {
        // Actually upload to S3
        await savePost(post);
        console.log(`${progress} ✅ Migrated: ${post.title} (${post.id})`);
        result.success++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `${progress} ❌ Failed: ${post.title} (${post.id}) - ${errorMessage}`
      );
      result.failed++;
      result.errors.push({
        id: post.id,
        title: post.title,
        error: errorMessage,
      });
    }

    // Add small delay to avoid rate limiting
    if (!dryRun && i < posts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary");
  console.log("=".repeat(50));
  console.log(`Total posts:    ${result.total}`);
  console.log(`✅ Successful:   ${result.success}`);
  console.log(`❌ Failed:       ${result.failed}`);
  console.log(`⏭️  Skipped:      ${result.skipped}`);

  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.forEach((err) => {
      console.log(`  - ${err.title} (${err.id}): ${err.error}`);
    });
  }

  if (dryRun) {
    console.log(
      "\n⚠️  This was a dry run. Run without --dry-run to actually migrate."
    );
  } else {
    console.log("\n✨ Migration complete!");
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || args.includes("-d");

migratePosts(dryRun)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
