import { NextRequest, NextResponse } from "next/server";
import { getPostsByMonth, getAllPosts } from "@/lib/posts-unified";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Check authentication
  const authError = await requireAuth();
  if (authError) {
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");

    // If month is "all" or not provided, return all posts
    if (monthParam === null || monthParam === "all") {
      const allPosts = await getAllPosts();
      // Sort by month, then by order, then by createdAt
      const sortedPosts = allPosts.sort((a, b) => {
        if (a.month !== b.month) {
          return a.month - b.month;
        }
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      return NextResponse.json(sortedPosts, { status: 200 });
    }

    const monthNum = Number(monthParam);
    if (Number.isNaN(monthNum)) {
      return NextResponse.json(
        { error: "Query param 'month' must be a number or 'all'" },
        { status: 400 }
      );
    }

    // Get all posts for the month (published and unpublished)
    const posts = await getPostsByMonth(monthNum);
    // Sort by order, then by createdAt
    const sortedPosts = posts.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json(sortedPosts, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
