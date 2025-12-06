import { NextRequest, NextResponse } from "next/server";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getPublishedPostsByMonthOrdered, savePost } from "@/lib/posts-unified";
import { requireAuth } from "@/lib/auth";
import type { Post, FileMetadata } from "@/lib/types";

// Cache configuration
const CACHE_TAG = "posts";
const REVALIDATE_SECONDS = 60; // Revalidate every 60 seconds

// Cached version of getPublishedPostsByMonthOrdered
async function getCachedPublishedPostsByMonth(month: number) {
  return unstable_cache(
    async () => {
      return await getPublishedPostsByMonthOrdered(month);
    },
    [`published-posts-month-${month}`],
    {
      tags: [CACHE_TAG, `${CACHE_TAG}-month-${month}`],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");

  // require month
  if (monthParam === null) {
    return NextResponse.json(
      { error: "Query param 'month' is required" },
      { status: 400 }
    );
  }

  const monthNum = Number(monthParam);
  if (Number.isNaN(monthNum)) {
    return NextResponse.json(
      { error: "Query param 'month' must be a number" },
      { status: 400 }
    );
  }

  try {
    console.log(`[api/posts] GET request for month ${monthNum}`);
    const posts = await getCachedPublishedPostsByMonth(monthNum);
    console.log(
      `[api/posts] Month ${monthNum}: Returning ${posts.length} published posts`
    );

    // Check if any post has dateTaken in metadata - if so, avoid caching
    const hasDateTaken = posts.some(
      (post) => post.metadata?.dateTaken !== undefined
    );

    // Add cache headers - no cache if posts have dateTaken to avoid stale capture dates
    return NextResponse.json(posts, {
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[api/posts] Error fetching posts for month ${monthNum}:`,
      errorMessage,
      err
    );
    return NextResponse.json(
      { error: "Server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const authError = await requireAuth();
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    console.log("Received POST request body:", JSON.stringify(body, null, 2));
    const {
      type,
      title,
      month,
      content,
      caption,
      createdBy,
      published,
      order,
      metadata,
      tags,
    } = body as {
      type: Post["type"];
      title: string;
      month: number;
      content: string;
      caption?: string;
      createdBy?: Post["createdBy"];
      published?: boolean;
      order?: number;
      metadata?: FileMetadata;
      tags?: string[];
    };

    // basic validation
    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'type' field" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Missing or empty 'title' field" },
        { status: 400 }
      );
    }

    if (month === undefined || month === null || !Number.isFinite(month)) {
      return NextResponse.json(
        { error: "Missing or invalid 'month' field" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Missing or empty 'content' field" },
        { status: 400 }
      );
    }
    if (!["text", "audio", "video", "photo", "stat"].includes(type as string)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (month < 0 || month > 12) {
      return NextResponse.json(
        { error: "Month must be a number between 0 and 12" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const isPublished = published === true;
    const normalizedOrder =
      typeof order === "number" && Number.isFinite(order) ? order : 0;

    const newPost: Post = {
      id: uuidv4(),
      type,
      title: title.trim(),
      month,
      content, // text OR /uploads/... path if media was uploaded separately
      caption: caption?.trim() || undefined, // optional caption for photos
      createdAt: now,
      updatedAt: now,
      createdBy, // optional
      published: isPublished,
      order: normalizedOrder,
      metadata: metadata || undefined, // optional file metadata (date taken, camera, location, etc.)
      tags: tags && tags.length > 0 ? tags : undefined,
    };

    const saved = await savePost(newPost);

    // Revalidate cache for this month
    revalidateTag(CACHE_TAG, {});
    revalidateTag(`${CACHE_TAG}-month-${month}`, {});
    // Also revalidate admin cache tags
    revalidateTag("posts-admin", {});
    revalidateTag(`posts-admin-month-${month}`, {});
    // Revalidate page paths
    revalidatePath(`/month/${month}`, "page");
    revalidatePath(`/admin/${month}`, "page");
    revalidatePath("/", "page");
    // Also revalidate admin/all page
    revalidatePath("/admin/all", "page");

    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
