/**
 * Unified interface for post storage
 * Routes to either file-based (lib/posts.ts) or S3-based (lib/posts-s3.ts) storage
 * based on NEXT_PUBLIC_USE_S3_POSTS environment variable
 */

import { Post } from "./types";

// Check feature flag at runtime (default to false for backward compatibility)
function shouldUseS3(): boolean {
  const useS3 =
    process.env.NEXT_PUBLIC_USE_S3_POSTS === "true" ||
    process.env.NEXT_PUBLIC_USE_S3_POSTS === "1";

  // Log which implementation is being used (only in server context, only once per request)
  if (
    typeof window === "undefined" &&
    !(globalThis as any)._loggedStorageType
  ) {
    console.log(
      `[posts-unified] NEXT_PUBLIC_USE_S3_POSTS=${
        process.env.NEXT_PUBLIC_USE_S3_POSTS
      }, Using ${useS3 ? "S3" : "file-based"} storage for posts`
    );
    (globalThis as any)._loggedStorageType = true;
  }

  return useS3;
}

// Dynamically import the appropriate implementation
async function getPostsImpl() {
  const useS3 = shouldUseS3();
  if (useS3) {
    return await import("./posts-s3");
  } else {
    return await import("./posts");
  }
}

// Re-export all functions with unified routing

export async function getAllPosts(): Promise<Post[]> {
  const impl = await getPostsImpl();
  return impl.getAllPosts();
}

export async function getPublishedPostsOrdered(): Promise<Post[]> {
  const impl = await getPostsImpl();
  return impl.getPublishedPostsOrdered();
}

export async function getPublishedPostsByMonthOrdered(
  month: number
): Promise<Post[]> {
  const impl = await getPostsImpl();
  return impl.getPublishedPostsByMonthOrdered(month);
}

export async function getPostById(id: string): Promise<Post | null> {
  const impl = await getPostsImpl();
  return impl.getPostById(id);
}

export async function getPostsByMonth(month: number): Promise<Post[]> {
  const impl = await getPostsImpl();
  return impl.getPostsByMonth(month);
}

export async function savePost(post: Post): Promise<Post> {
  const impl = await getPostsImpl();
  return impl.savePost(post);
}

export async function updatePost(
  id: string,
  updates: Partial<Post>
): Promise<Post | null> {
  const impl = await getPostsImpl();
  return impl.updatePost(id, updates);
}

export async function deletePost(id: string): Promise<boolean> {
  const impl = await getPostsImpl();
  return impl.deletePost(id);
}
