import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPublishedPostsByMonthOrdered, savePost } from "@/lib/posts-unified";
import { requireAuth } from "@/lib/auth";
import type { Post, FileMetadata } from "@/lib/types";

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
    const posts = await getPublishedPostsByMonthOrdered(monthNum);
    console.log(
      `[api/posts] Month ${monthNum}: Returning ${posts.length} published posts`
    );
    return NextResponse.json(posts, { status: 200 });
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
      tags?: string[]; // Add this
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
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
