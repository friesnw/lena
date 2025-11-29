// Let me read and write files
import { promises as fs } from "fs";

// Help me build the file path correctly
import path from "path";

// My Post shape (just for TypeScript safety)
import { Post } from "./types";

// The full path to data/posts.json
const POSTS_FILE = path.join(
  process.cwd(), // current working directory
  "data",
  "posts.json"
);

// Helper function to read the posts.json file
async function readPostsFile(): Promise<Post[]> {
  try {
    // read the file as a text string, return the parsed JSON as an array of Post objects
    const fileContents = await fs.readFile(POSTS_FILE, "utf-8");
    const trimmed = fileContents.trim();

    try {
      // Try to parse directly first
      return JSON.parse(trimmed) as Post[];
    } catch (parseError) {
      // If parsing fails, try to fix common corruption (extra closing brackets)
      // Look for trailing closing brackets and remove them
      let fixed = trimmed;

      // Find the last valid closing bracket by counting brackets
      let openCount = 0;
      let lastValidBracket = -1;

      for (let i = 0; i < fixed.length; i++) {
        if (fixed[i] === "[") openCount++;
        if (fixed[i] === "]") {
          openCount--;
          if (openCount === 0 && fixed.trim().startsWith("[")) {
            lastValidBracket = i;
          }
        }
      }

      // If we found a valid bracket and there's content after it, remove the extra
      if (lastValidBracket >= 0 && lastValidBracket < fixed.length - 1) {
        const afterBracket = fixed.substring(lastValidBracket + 1).trim();
        // Only remove if it's just extra closing brackets and whitespace
        if (/^\]+\s*$/.test(afterBracket)) {
          fixed = fixed.substring(0, lastValidBracket + 1);
          try {
            const parsed = JSON.parse(fixed);
            if (Array.isArray(parsed)) {
              console.warn(
                "Fixed corrupted posts.json file (removed extra brackets)"
              );
              // Write the fixed version back
              await fs.writeFile(
                POSTS_FILE,
                JSON.stringify(parsed, null, 2),
                "utf-8"
              );
              return parsed as Post[];
            }
          } catch {
            // If fixed version still doesn't parse, fall through to error handling
          }
        }
      }

      // If we couldn't fix it, throw the original error
      throw parseError;
    }
  } catch (error) {
    // File doesn't exist or is empty - return empty array
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    // else if other errors (permissions, invalid JSON, etc.), log and return empty array
    console.error("Error reading posts file:", error);
    return [];
  }
}

// Helper function to write the posts.json file
async function writePostsFile(posts: Post[]): Promise<void> {
  try {
    // Ensure we have a valid array
    if (!Array.isArray(posts)) {
      throw new Error("Posts must be an array");
    }

    // Stringify the JSON
    const jsonString = JSON.stringify(posts, null, 2);

    // Write to a temporary file first, then rename (atomic write)
    // This prevents corruption if the process is interrupted
    const tempFile = POSTS_FILE + ".tmp";
    await fs.writeFile(tempFile, jsonString, "utf-8");

    // Validate the written file by reading it back
    const verify = await fs.readFile(tempFile, "utf-8");
    const parsed = JSON.parse(verify);
    if (!Array.isArray(parsed)) {
      await fs.unlink(tempFile).catch(() => {});
      throw new Error("Written file is not a valid JSON array");
    }

    // If validation passes, rename temp file to actual file (atomic on most systems)
    await fs.rename(tempFile, POSTS_FILE);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(POSTS_FILE + ".tmp").catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
    console.error("Error writing posts file:", error);
    throw error; // Re-throw so caller knows write failed
  }
}

// get all posts (excluding deleted)
export async function getAllPosts(): Promise<Post[]> {
  const posts = await readPostsFile();
  return posts.filter((post) => !post.deleted);
}

// get only published posts, ordered by `order` ascending
export async function getPublishedPostsOrdered(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts
    .filter((post) => post.published === true)
    .sort((a, b) => a.order - b.order);
}

// get only published posts for a month, ordered by `order` ascending
export async function getPublishedPostsByMonthOrdered(
  month: number
): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts
    .filter((post) => post.published === true && post.month === month)
    .sort((a, b) => a.order - b.order);
}

// get a post by id
export async function getPostById(id: string): Promise<Post | null> {
  const posts = await getAllPosts();
  const post = posts.find((p) => p.id === id);
  return post || null;
}

// get posts by month
export async function getPostsByMonth(month: number): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.month === month);
}

// save a post to the posts.json file
export async function savePost(post: Post): Promise<Post> {
  const posts = await getAllPosts();
  posts.push(post);
  await writePostsFile(posts);
  return post;
}

// update a post in the posts.json file
export async function updatePost(
  id: string,
  updates: Partial<Post>
): Promise<Post | null> {
  // Read all posts including deleted ones, so we can update deleted posts (e.g., to undelete)
  const posts = await readPostsFile();
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return null; // Post not found
  }

  // Merge updates with existing post
  const updatedPost: Post = {
    ...posts[index],
    ...updates,
    id: posts[index].id, // Ensure ID can't be changed
    updatedAt: new Date().toISOString(), // Always update timestamp
  };

  posts[index] = updatedPost;
  await writePostsFile(posts);
  return updatedPost;
}

export async function deletePost(id: string): Promise<boolean> {
  // Soft delete: set deleted flag to true
  return (await updatePost(id, { deleted: true })) !== null;
}
