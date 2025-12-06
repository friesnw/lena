"use client";

import {
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  Stack,
} from "@mui/material";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import PostDisplay from "./PostDisplay";
import PostCarousel from "./PostCarousel";
import { getMonthRangeText } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

interface AdminMonthPageProps {
  month: number;
  monthName: string;
}

// Helper utility function to check if a post has a carousel tag
function hasCarouselTag(post: Post): boolean {
  return (
    post.tags?.some(
      (tag) =>
        tag.toLowerCase().startsWith("carousel ") ||
        tag.toLowerCase() === "bonus funnies"
    ) ?? false
  );
}

// Helper function to get carousel number from tag
function getCarouselNumber(post: Post): number | null {
  const carouselTag = post.tags?.find(
    (tag) =>
      tag.toLowerCase().startsWith("carousel ") ||
      tag.toLowerCase() === "bonus funnies"
  );
  if (!carouselTag) return null;
  // Special case for "bonus funnies"
  if (carouselTag.toLowerCase() === "bonus funnies") {
    return 9;
  }
  const match = carouselTag.match(/carousel (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

export default function AdminMonthPage({
  month,
  monthName,
}: AdminMonthPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const lastFetchTimeRef = useRef<number>(0);
  const pageTitle = `Admin: ${monthName}`;
  usePageTitle(pageTitle);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const response = await fetch(
          `/api/posts/admin?month=${month}&_t=${timestamp}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );
        const data = await response.json();

        if (response.ok) {
          setPosts(data);
        } else {
          setError(data.error || "Failed to load posts");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    lastFetchTimeRef.current = Date.now();

    // Refetch when page becomes visible after being hidden for a while
    // This helps catch updates made in other tabs/windows
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        // Only refetch if it's been more than 5 seconds since last fetch
        // This prevents excessive refetching while still catching updates
        if (timeSinceLastFetch > 5000) {
          lastFetchTimeRef.current = Date.now();
          fetchPosts();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [month]);

  // Separate posts into published and unpublished
  const { publishedPosts, unpublishedPosts } = useMemo(() => {
    const published: Post[] = [];
    const unpublished: Post[] = [];

    posts.forEach((post) => {
      if (post.published) {
        published.push(post);
      } else {
        unpublished.push(post);
      }
    });

    // Sort unpublished posts by createdAt (newest first) since we disregard order
    unpublished.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { publishedPosts: published, unpublishedPosts: unpublished };
  }, [posts]);

  // Separate published posts into carousel posts and regular posts
  const { carouselPosts, regularPosts } = useMemo(() => {
    const carousel: Record<number, Post[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };
    const regular: Post[] = [];

    publishedPosts.forEach((post) => {
      if (
        hasCarouselTag(post) &&
        (post.type === "photo" || post.type === "video")
      ) {
        const carouselNum = getCarouselNumber(post);
        if (carouselNum && carouselNum >= 1 && carouselNum <= 9) {
          carousel[carouselNum].push(post);
        }
      } else {
        regular.push(post);
      }
    });

    // Sort carousel posts by order
    Object.keys(carousel).forEach((key) => {
      const num = parseInt(key, 10);
      carousel[num].sort((a, b) => a.order - b.order);
    });

    // Sort regular posts by order
    regular.sort((a, b) => a.order - b.order);

    return { carouselPosts: carousel, regularPosts: regular };
  }, [publishedPosts]);

  const getViewPostUrl = (postId: string) => `/admin/posts/${postId}`;

  // Render posts with carousels at appropriate intervals
  const renderPostsWithCarousels = () => {
    const carouselThresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const result: React.ReactElement[] = [];
    let regularIndex = 0;

    for (let i = 0; i < carouselThresholds.length; i++) {
      const threshold = carouselThresholds[i];
      const carouselNum = i + 1;

      // Render regular posts up to this threshold
      while (
        regularIndex < regularPosts.length &&
        regularPosts[regularIndex].order < threshold
      ) {
        result.push(
          <PostDisplay
            key={regularPosts[regularIndex].id}
            post={regularPosts[regularIndex]}
            showOrder={true}
            viewPostUrl={getViewPostUrl(regularPosts[regularIndex].id)}
          />
        );
        regularIndex++;
      }

      // Render carousel if it has posts
      if (carouselPosts[carouselNum].length > 0) {
        const carouselTitle = carouselNum === 9 ? "Bonus Funnies" : undefined;
        result.push(
          <PostCarousel
            key={`carousel-${carouselNum}`}
            posts={carouselPosts[carouselNum]}
            title={carouselTitle}
            showOrder={true}
            getViewPostUrl={getViewPostUrl}
          />
        );
      }
    }

    // Render remaining regular posts
    while (regularIndex < regularPosts.length) {
      result.push(
        <PostDisplay
          key={regularPosts[regularIndex].id}
          post={regularPosts[regularIndex]}
          showOrder={true}
          viewPostUrl={getViewPostUrl(regularPosts[regularIndex].id)}
        />
      );
      regularIndex++;
    }

    return result;
  };

  return (
    <Box
      sx={{
        width: "100%",
        pl: { md: "320px" }, // Account for sidebar on desktop
        mt: 4,
        mb: 4,
      }}
    >
      <Box
        sx={{
          maxWidth: "600px",
          mx: { xs: "auto", md: "auto" }, // Center on both mobile and desktop
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
              {pageTitle}
            </Typography>
            <Typography variant="h6" fontSize="1.25rem" color="text.secondary">
              {getMonthRangeText(month)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
            <Button href={`/month/${month}`} variant="outlined">
              View Published
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push(`/upload?month=${month}`)}
            >
              New Post
            </Button>
          </Stack>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && posts.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No posts yet for this month.
          </Typography>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            {renderPostsWithCarousels()}
            {unpublishedPosts.length > 0 && (
              <Box sx={{ mt: 6 }}>
                <Typography
                  variant="h2"
                  component="h2"
                  sx={{ mb: 3, fontSize: "1.5rem", fontWeight: 600 }}
                >
                  Unpublished
                </Typography>
                {unpublishedPosts.map((post) => (
                  <PostDisplay
                    key={post.id}
                    post={post}
                    showOrder={true}
                    viewPostUrl={getViewPostUrl(post.id)}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
