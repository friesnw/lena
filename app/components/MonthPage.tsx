"use client";

import { Typography, CircularProgress, Alert, Box } from "@mui/material";
import { useEffect, useState, useMemo, useRef } from "react";
import type { Post } from "@/lib/types";
import PostDisplay from "./PostDisplay";
import PostCarousel from "./PostCarousel";

import { getMonthRangeText } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

interface MonthPageProps {
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

// Helper function to get carousel number from tags
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

export default function MonthPage({ month, monthName }: MonthPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastFetchTimeRef = useRef<number>(0);
  usePageTitle(monthName);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const response = await fetch(
          `/api/posts?month=${month}&_t=${timestamp}`,
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

  // Separate posts into carousel posts and regular posts
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

    posts.forEach((post) => {
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
  }, [posts]);

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
        <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
          {monthName}
        </Typography>

        <Typography
          variant="h6"
          fontSize="1.25rem"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {getMonthRangeText(month)}
        </Typography>

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

        {!loading && !error && posts.length > 0 && renderPostsWithCarousels()}
      </Box>
    </Box>
  );
}
