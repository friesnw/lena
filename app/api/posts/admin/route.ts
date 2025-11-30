import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getPostsByMonth, getAllPosts } from "@/lib/posts-unified";
import { requireAuth } from "@/lib/auth";

// Cache configuration
const CACHE_TAG = "posts-admin";
const REVALIDATE_SECONDS = 30; // Shorter cache for admin (30 seconds)

// Cached version of getPostsByMonth
async function getCachedPostsByMonth(month: number) {
  return unstable_cache(
    async () => {
      return await getPostsByMonth(month);
    },
    [`admin-posts-month-${month}`],
    {
      tags: [CACHE_TAG, `${CACHE_TAG}-month-${month}`],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}

// Cached version of getAllPosts
async function getCachedAllPosts() {
  return unstable_cache(
    async () => {
      return await getAllPosts();
    },
    ["admin-posts-all"],
    {
      tags: [CACHE_TAG],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}

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
      const allPosts = await getCachedAllPosts();
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

      return NextResponse.json(sortedPosts, {
        status: 200,
        headers: {
          "Cache-Control": `private, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${
            REVALIDATE_SECONDS * 2
          }`,
        },
      });
    }

    const monthNum = Number(monthParam);
    if (Number.isNaN(monthNum)) {
      return NextResponse.json(
        { error: "Query param 'month' must be a number or 'all'" },
        { status: 400 }
      );
    }

    // Get all posts for the month (published and unpublished)
    const posts = await getCachedPostsByMonth(monthNum);
    // Sort by order, then by createdAt
    const sortedPosts = posts.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json(sortedPosts, {
      status: 200,
      headers: {
        "Cache-Control": `private, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${
          REVALIDATE_SECONDS * 2
        }`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
