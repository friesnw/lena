import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Post } from "./types";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "letters-for-lena-media";
const INDEX_KEY = "posts/index.json";

// Index cache (in-memory)
interface IndexEntry {
  id: string;
  month: number;
  published: boolean;
  order: number;
  type: Post["type"];
  title: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  tags?: string[];
  s3Key: string;
  [key: string]: any; // Allow other metadata fields
}

interface PostsIndex {
  version: string;
  lastUpdated: string;
  totalPosts: number;
  posts: IndexEntry[];
}

let indexCache: PostsIndex | null = null;
let indexCacheTime: number = 0;
const INDEX_CACHE_TTL = 60000; // 60 seconds cache

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
 * Read the index file from S3 (with caching)
 */
async function getIndex(): Promise<PostsIndex | null> {
  const now = Date.now();

  // Return cached index if still valid
  if (indexCache && now - indexCacheTime < INDEX_CACHE_TTL) {
    return indexCache;
  }

  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: INDEX_KEY,
    });

    const response = await getS3Client().send(getCommand);
    const bodyString = await response.Body?.transformToString();

    if (!bodyString) {
      console.warn("[posts-s3] Index file is empty");
      return null;
    }

    const index = JSON.parse(bodyString) as PostsIndex;

    // Cache the index
    indexCache = index;
    indexCacheTime = now;

    return index;
  } catch (error) {
    // If index doesn't exist, that's okay - we'll fall back to listing
    if ((error as any).name === "NoSuchKey") {
      console.warn("[posts-s3] Index file not found, will use fallback method");
      return null;
    }
    console.error("[posts-s3] Error reading index:", error);
    return null;
  }
}

/**
 * Update the index file in S3
 */
async function updateIndex(updatedIndex: PostsIndex): Promise<void> {
  try {
    const jsonString = JSON.stringify(updatedIndex, null, 2);

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: INDEX_KEY,
      Body: jsonString,
      ContentType: "application/json",
    });

    await getS3Client().send(putCommand);

    // Update cache
    indexCache = updatedIndex;
    indexCacheTime = Date.now();
  } catch (error) {
    console.error("[posts-s3] Error updating index:", error);
    throw error;
  }
}

/**
 * Extract metadata from a post for the index
 */
function extractPostMetadata(post: Post): IndexEntry {
  const { content, ...metadata } = post;
  return {
    ...metadata,
    s3Key: getPostS3Key(post),
  } as IndexEntry;
}

/**
 * Get a single post from S3 by ID (using index for fast lookup)
 */
async function getPostFromS3(id: string): Promise<Post | null> {
  try {
    // Try to use index first
    const index = await getIndex();

    if (index) {
      const indexEntry = index.posts.find((p) => p.id === id);
      if (!indexEntry) {
        return null; // Post not found
      }

      // Download the specific post file
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: indexEntry.s3Key,
      });

      const response = await getS3Client().send(getCommand);
      const bodyString = await response.Body?.transformToString();

      if (!bodyString) {
        return null;
      }

      return JSON.parse(bodyString) as Post;
    }

    // Fallback: search all posts (slow, but works if index doesn't exist)
    console.warn(
      "[posts-s3] Index not available, using fallback method for getPostById"
    );
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "posts/",
    });

    const listResponse = await getS3Client().send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return null;
    }

    // Search through post files
    for (const object of listResponse.Contents) {
      if (
        !object.Key ||
        !object.Key.endsWith(".json") ||
        object.Key === INDEX_KEY
      ) {
        continue;
      }

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
        console.warn(`[posts-s3] Error reading post file ${object.Key}:`, err);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("[posts-s3] Error getting post from S3:", error);
    return null;
  }
}

/**
 * List posts from index (fast) or fallback to downloading all (slow)
 */
async function listPostsFromS3(options?: {
  month?: number;
  published?: boolean;
  includeDeleted?: boolean;
}): Promise<Post[]> {
  try {
    const index = await getIndex();

    if (index) {
      // Fast path: use index
      let entries = index.posts;

      // Apply filters
      if (!options?.includeDeleted) {
        entries = entries.filter((p) => !p.deleted);
      }

      if (options?.month !== undefined) {
        entries = entries.filter((p) => p.month === options.month);
      }

      if (options?.published !== undefined) {
        entries = entries.filter((p) => p.published === options.published);
      }

      // If we only need metadata, return entries as-is
      // But since we need full posts, download them in parallel
      const postPromises = entries.map(async (entry) => {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: entry.s3Key,
          });

          const response = await getS3Client().send(getCommand);
          const bodyString = await response.Body?.transformToString();

          if (!bodyString) return null;

          return JSON.parse(bodyString) as Post;
        } catch (err) {
          console.warn(`[posts-s3] Error reading post ${entry.s3Key}:`, err);
          return null;
        }
      });

      const posts = (await Promise.all(postPromises)).filter(
        (post): post is Post => post !== null
      );

      return posts;
    }

    // Fallback: download all posts (slow, but works if index doesn't exist)
    console.warn(
      "[posts-s3] Index not available, using fallback method (slow)"
    );
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "posts/",
    });

    const listResponse = await getS3Client().send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return [];
    }

    const postFiles = listResponse.Contents.filter(
      (obj) => obj.Key && obj.Key.endsWith(".json") && obj.Key !== INDEX_KEY
    );

    // Download all posts in parallel
    const postPromises = postFiles.map(async (object) => {
      if (!object.Key) return null;

      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const response = await getS3Client().send(getCommand);
        const bodyString = await response.Body?.transformToString();

        if (!bodyString) return null;

        return JSON.parse(bodyString) as Post;
      } catch (err) {
        console.warn(`[posts-s3] Error reading post file ${object.Key}:`, err);
        return null;
      }
    });

    const posts = (await Promise.all(postPromises)).filter(
      (post): post is Post => post !== null
    );

    // Apply filters
    let filtered = posts;

    if (!options?.includeDeleted) {
      filtered = filtered.filter((post) => !post.deleted);
    }

    if (options?.month !== undefined) {
      filtered = filtered.filter((post) => post.month === options.month);
    }

    if (options?.published !== undefined) {
      filtered = filtered.filter(
        (post) => post.published === options.published
      );
    }

    return filtered;
  } catch (error) {
    console.error("[posts-s3] Error listing posts from S3:", error);
    return [];
  }
}

/**
 * Save a post to S3 and update the index
 */
async function savePostToS3(post: Post): Promise<Post> {
  try {
    const key = getPostS3Key(post);
    const jsonString = JSON.stringify(post, null, 2);

    // Save the post file
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: jsonString,
      ContentType: "application/json",
    });

    await getS3Client().send(command);

    // Update the index
    const index = await getIndex();
    if (index) {
      // Check if post already exists in index
      const existingIndex = index.posts.findIndex((p) => p.id === post.id);
      const metadata = extractPostMetadata(post);

      if (existingIndex >= 0) {
        // Update existing entry
        index.posts[existingIndex] = metadata;
      } else {
        // Add new entry
        index.posts.push(metadata);
        index.totalPosts = index.posts.length;
      }

      index.lastUpdated = new Date().toISOString();
      await updateIndex(index);
    }

    return post;
  } catch (error) {
    console.error("[posts-s3] Error saving post to S3:", error);
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
