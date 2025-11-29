import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Post } from "./types";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "letters-for-lena-media";

// Lazy initialization of S3 client (so env vars can be loaded first)
let s3Client: S3Client | null = null;
let cachedAccessKey: string | undefined;

function getS3Client(): S3Client {
  const currentAccessKey = process.env.AWS_ACCESS_KEY_ID;

  // Recreate client if credentials changed or if not initialized
  if (!s3Client || cachedAccessKey !== currentAccessKey) {
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || "").trim();

    if (!accessKeyId || !secretAccessKey) {
      const errorMsg =
        "AWS credentials not configured. Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env.local";
      console.error(`[posts-s3] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(
      `[posts-s3] Creating S3 client with region: ${
        process.env.AWS_REGION || "us-east-2"
      }, bucket: ${BUCKET_NAME}`
    );

    s3Client = new S3Client({
      region: (process.env.AWS_REGION || "us-east-2").trim(),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      maxAttempts: 3,
    });

    cachedAccessKey = currentAccessKey;
  }

  return s3Client;
}

/**
 * Generate S3 key for a post based on its createdAt timestamp
 * Format: posts/YYYY/MM/post-{id}.json
 */
function getPostS3Key(post: Post): string {
  const date = new Date(post.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `posts/${year}/${month}/post-${post.id}.json`;
}

/**
 * Get a single post from S3 by ID
 */
async function getPostFromS3(id: string): Promise<Post | null> {
  try {
    // We need to search all posts to find the one with matching ID
    // List all posts in the posts/ prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "posts/",
    });

    const listResponse = await getS3Client().send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return null;
    }

    // Search through all post files to find the one with matching ID
    for (const object of listResponse.Contents) {
      if (!object.Key) continue;

      // Only check JSON files
      if (!object.Key.endsWith(".json")) continue;

      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const response = await getS3Client().send(getCommand);
        const bodyString = await response.Body?.transformToString();

        if (!bodyString) continue;

        const post = JSON.parse(bodyString) as Post;

        if (post.id === id) {
          return post;
        }
      } catch (err) {
        // Skip invalid JSON files
        console.warn(`Error reading post file ${object.Key}:`, err);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting post from S3:", error);
    return null;
  }
}

/**
 * List all posts from S3, optionally filtered
 */
async function listPostsFromS3(options?: {
  month?: number;
  published?: boolean;
  includeDeleted?: boolean;
}): Promise<Post[]> {
  try {
    console.log(`[posts-s3] Starting listPostsFromS3 with options:`, options);
    console.log(`[posts-s3] Bucket: ${BUCKET_NAME}, Prefix: posts/`);

    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "posts/",
    });

    console.log(`[posts-s3] Sending ListObjectsV2Command...`);

    // Add timeout to prevent infinite hanging
    const s3ClientInstance = getS3Client();
    const listResponsePromise = s3ClientInstance.send(listCommand);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("S3 request timeout after 30 seconds")),
        30000
      )
    );

    const listResponse = await Promise.race([
      listResponsePromise,
      timeoutPromise,
    ]);

    console.log(`[posts-s3] ListObjectsV2Command completed`);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("[posts-s3] No posts found in S3");
      return [];
    }

    console.log(
      `[posts-s3] Found ${listResponse.Contents.length} post files in S3, starting to read...`
    );

    const posts: Post[] = [];

    // Read all post files
    for (const object of listResponse.Contents) {
      if (!object.Key || !object.Key.endsWith(".json")) continue;

      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const response = await getS3Client().send(getCommand);
        const bodyString = await response.Body?.transformToString();

        if (!bodyString) continue;

        const post = JSON.parse(bodyString) as Post;
        posts.push(post);
      } catch (err) {
        // Skip invalid JSON files
        console.warn(`[posts-s3] Error reading post file ${object.Key}:`, err);
        continue;
      }
    }

    console.log(`[posts-s3] Successfully parsed ${posts.length} posts from S3`);

    // Apply filters
    let filtered = posts;

    // Filter out deleted posts by default (unless explicitly included)
    if (!options?.includeDeleted) {
      const beforeDeleted = filtered.length;
      filtered = filtered.filter((post) => !post.deleted);
      if (beforeDeleted !== filtered.length) {
        console.log(
          `[posts-s3] Filtered out ${
            beforeDeleted - filtered.length
          } deleted posts`
        );
      }
    }

    // Filter by month if specified
    if (options?.month !== undefined) {
      const beforeMonth = filtered.length;
      filtered = filtered.filter((post) => post.month === options.month);
      console.log(
        `[posts-s3] Filtered to month ${options.month}: ${filtered.length} posts (from ${beforeMonth})`
      );
    }

    // Filter by published status if specified
    if (options?.published !== undefined) {
      const beforePublished = filtered.length;
      filtered = filtered.filter(
        (post) => post.published === options.published
      );
      console.log(
        `[posts-s3] Filtered to published=${options.published}: ${filtered.length} posts (from ${beforePublished})`
      );
    }

    return filtered;
  } catch (error) {
    console.error("Error listing posts from S3:", error);
    return [];
  }
}

/**
 * Save a post to S3
 */
async function savePostToS3(post: Post): Promise<Post> {
  try {
    const key = getPostS3Key(post);
    const jsonString = JSON.stringify(post, null, 2);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: jsonString,
      ContentType: "application/json",
    });

    await getS3Client().send(command);
    return post;
  } catch (error) {
    console.error("Error saving post to S3:", error);
    throw new Error(
      `Failed to save post to S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Exported functions matching lib/posts.ts signatures

/**
 * Get all posts from S3 (excluding deleted)
 */
export async function getAllPosts(): Promise<Post[]> {
  return listPostsFromS3({ includeDeleted: false });
}

/**
 * Get only published posts, ordered by `order` ascending
 */
export async function getPublishedPostsOrdered(): Promise<Post[]> {
  const posts = await listPostsFromS3({ published: true });
  return posts.sort((a, b) => a.order - b.order);
}

/**
 * Get only published posts for a month, ordered by `order` ascending
 */
export async function getPublishedPostsByMonthOrdered(
  month: number
): Promise<Post[]> {
  const posts = await listPostsFromS3({
    month,
    published: true,
    includeDeleted: false,
  });
  return posts.sort((a, b) => a.order - b.order);
}

/**
 * Get a post by ID
 */
export async function getPostById(id: string): Promise<Post | null> {
  const post = await getPostFromS3(id);
  // Don't return deleted posts
  if (post && post.deleted) {
    return null;
  }
  return post;
}

/**
 * Get posts by month (all, including unpublished, excluding deleted)
 */
export async function getPostsByMonth(month: number): Promise<Post[]> {
  return listPostsFromS3({
    month,
    includeDeleted: false,
  });
}

/**
 * Save a post to S3
 */
export async function savePost(post: Post): Promise<Post> {
  return savePostToS3(post);
}

/**
 * Update a post in S3
 */
export async function updatePost(
  id: string,
  updates: Partial<Post>
): Promise<Post | null> {
  const existingPost = await getPostFromS3(id);

  if (!existingPost) {
    return null; // Post not found
  }

  // Merge updates with existing post
  const updatedPost: Post = {
    ...existingPost,
    ...updates,
    id: existingPost.id, // Ensure ID can't be changed
    updatedAt: new Date().toISOString(), // Always update timestamp
  };

  await savePostToS3(updatedPost);
  return updatedPost;
}

/**
 * Soft delete a post (sets deleted: true)
 */
export async function deletePost(id: string): Promise<boolean> {
  const existingPost = await getPostFromS3(id);

  if (!existingPost) {
    return false; // Post not found
  }

  // Soft delete by setting deleted flag
  await updatePost(id, { deleted: true });
  return true;
}
