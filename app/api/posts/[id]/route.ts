import { NextRequest, NextResponse } from "next/server";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { getPostById, updatePost, deletePost } from "@/lib/posts-unified";
import { requireAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";

const CACHE_TAG = "posts";
const REVALIDATE_SECONDS = 60;

// Cached version of getPostById
async function getCachedPostById(id: string) {
  return unstable_cache(
    async () => {
      return await getPostById(id);
    },
    [`post-${id}`],
    {
      tags: [CACHE_TAG, `${CACHE_TAG}-${id}`],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getCachedPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if post has dateTaken in metadata - if so, avoid caching
    const hasDateTaken = post.metadata?.dateTaken !== undefined;

    return NextResponse.json(post, {
      status: 200,
      headers: {
        "Cache-Control": hasDateTaken
          ? "no-cache, no-store, must-revalidate"
          : `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${
              REVALIDATE_SECONDS * 2
            }`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authError = await requireAuth();
  if (authError) {
    return authError;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type,
      title,
      month,
      content,
      caption,
      published,
      order,
      tags,
      metadata,
    } = body as {
      type?: Post["type"];
      title?: string;
      month?: number;
      content?: string;
      caption?: string;
      published?: boolean;
      order?: number;
      tags?: string[];
      metadata?: Post["metadata"];
    };

    // Validate month if provided
    if (month !== undefined && (!Number.isFinite(month) || month < 0)) {
      return NextResponse.json(
        { error: "Month must be a non-negative number (0-12)" },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type && !["text", "audio", "video", "photo", "stat"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Validate title if provided
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    const updates: Partial<Post> = {};
    if (type !== undefined) updates.type = type;
    if (title !== undefined) updates.title = title.trim();
    if (month !== undefined) updates.month = month;
    if (content !== undefined) updates.content = content;
    if (caption !== undefined) updates.caption = caption?.trim() || undefined;
    if (published !== undefined) updates.published = published;
    if (order !== undefined) updates.order = Number.isFinite(order) ? order : 0;
    if (tags !== undefined) updates.tags = tags;
    if (metadata !== undefined) updates.metadata = metadata;

    const updatedPost = await updatePost(id, updates);

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Revalidate cache
    revalidateTag(CACHE_TAG, {});
    revalidateTag(`${CACHE_TAG}-${id}`, {});
    revalidatePath(`/admin/posts/${id}`, "page");
    if (updatedPost.month !== undefined) {
      revalidateTag(`${CACHE_TAG}-month-${updatedPost.month}`, {});
      // Also revalidate admin cache tags
      revalidateTag("posts-admin", {});
      revalidateTag(`posts-admin-month-${updatedPost.month}`, {});
      revalidatePath(`/admin/${updatedPost.month}`, "page");
      revalidatePath(`/month/${updatedPost.month}`, "page");
      revalidatePath("/", "page");
    }

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authError = await requireAuth();
  if (authError) {
    return authError;
  }

  try {
    const { id } = await params;
    // Fetch post first to get month for cache invalidation
    const postToDelete = await getPostById(id);

    if (!postToDelete) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Soft delete: set deleted flag to true
    const deleted = await deletePost(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    // Revalidate cache
    revalidateTag(CACHE_TAG, {});
    revalidateTag(`${CACHE_TAG}-${id}`, {});
    revalidatePath(`/admin/posts/${id}`, "page");
    if (postToDelete.month !== undefined) {
      revalidateTag(`${CACHE_TAG}-month-${postToDelete.month}`, {});
      // Also revalidate admin cache tags
      revalidateTag("posts-admin", {});
      revalidateTag(`posts-admin-month-${postToDelete.month}`, {});
      revalidatePath(`/admin/${postToDelete.month}`, "page");
      revalidatePath(`/month/${postToDelete.month}`, "page");
      revalidatePath("/", "page");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
