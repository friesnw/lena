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
    return JSON.parse(fileContents) as Post[];
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
    await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing posts file:", error);
    throw error; // Re-throw so caller knows write failed
  }
}

// get all posts
export async function getAllPosts(): Promise<Post[]> {
  return await readPostsFile();
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
  const posts = await getAllPosts();
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
  const posts = await getAllPosts();
  const initialLength = posts.length;
  const filteredPosts = posts.filter((p) => p.id !== id);

  // Check if post was actually removed
  if (filteredPosts.length === initialLength) {
    return false; // Post not found
  }

  await writePostsFile(filteredPosts);
  return true; // Successfully deleted
}
