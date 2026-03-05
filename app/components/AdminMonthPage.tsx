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
  if (!post.tags || post.tags.length === 0) return false;
  return post.tags.some((tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    return normalizedTag.startsWith("carousel ");
  });
}

// Helper function to get carousel number from tag
function getCarouselNumber(post: Post): number | null {
  if (!post.tags || post.tags.length === 0) return null;

  // Find all carousel tags and extract numbers, return the highest valid one
  // This handles cases where a post might have multiple carousel tags
  let maxCarouselNum: number | null = null;
  for (const tag of post.tags) {
    const normalizedTag = tag.toLowerCase().trim();
    // Match the full pattern: "carousel" followed by whitespace and digits
    const match = normalizedTag.match(/^carousel\s+(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 11) {
        // Keep the highest carousel number found
        if (maxCarouselNum === null || num > maxCarouselNum) {
          maxCarouselNum = num;
        }
      }
    }
  }
  return maxCarouselNum;
}

export default function AdminMonthPage({
  month,
  monthName,
}: AdminMonthPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const lastFetchTimeRef = useRef<number>(0);
  const hasLoadedOnceRef = useRef<boolean>(false);
  const pageTitle = `Admin: ${monthName}`;
  usePageTitle(pageTitle);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Only show the big loading state on the first load.
        // On subsequent refetches (e.g., tab refocus), keep posts rendered and show a small refresh indicator.
        if (!hasLoadedOnceRef.current && posts.length === 0) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await fetch(`/api/posts/admin?month=${month}`);
        const data = await response.json();

        if (response.ok) {
          setPosts(data);
          hasLoadedOnceRef.current = true;
          setError("");
        } else {
          setError(data.error || "Failed to load posts");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
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

  // Separate published posts into carousel posts, bonus funnies, custom carousels, and regular posts
  const { carouselPosts, bonusFunniesPosts, regularPosts, carouselDefs, carouselDefPosts } = useMemo(() => {
    const carousel: Record<number, Post[]> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [],
    };
    const bonusFunnies: Post[] = [];
    const regular: Post[] = [];

    // Carousel-type posts define custom carousel slots
    const defs = publishedPosts
      .filter((p) => p.type === "carousel")
      .sort((a, b) => a.order - b.order);
    const defPosts: Post[][] = defs.map(() => []);

    publishedPosts.forEach((post) => {
      if (post.type === "carousel") return;

      const hasBonusFunnies =
        post.tags?.some((tag) => tag.toLowerCase().trim() === "bonus funnies") ?? false;
      const hasCarousel = hasCarouselTag(post);
      const isPhotoOrVideo = post.type === "photo" || post.type === "video";

      const defIndex = defs.findIndex((def) =>
        post.tags?.some(
          (tag) => tag.toLowerCase().trim() === def.title.toLowerCase().trim()
        )
      );

      if (defIndex !== -1 && isPhotoOrVideo) {
        defPosts[defIndex].push(post);
      } else if (hasBonusFunnies && isPhotoOrVideo) {
        bonusFunnies.push(post);
      } else if (hasCarousel && isPhotoOrVideo) {
        const carouselNum = getCarouselNumber(post);
        if (carouselNum && carouselNum >= 1 && carouselNum <= 11) {
          carousel[carouselNum].push(post);
        } else {
          regular.push(post);
        }
      } else {
        regular.push(post);
      }
    });

    Object.keys(carousel).forEach((key) => {
      const num = parseInt(key, 10);
      carousel[num].sort((a, b) => a.order - b.order);
    });
    defPosts.forEach((arr) => arr.sort((a, b) => a.order - b.order));
    bonusFunnies.sort((a, b) => a.order - b.order);
    regular.sort((a, b) => a.order - b.order);

    if (carousel[9].length > 0) {
      console.log(
        `[AdminMonthPage] Found ${carousel[9].length} carousel 9 posts:`,
        carousel[9].map((p) => ({ id: p.id, title: p.title, tags: p.tags }))
      );
    }

    return {
      carouselPosts: carousel,
      bonusFunniesPosts: bonusFunnies,
      regularPosts: regular,
      carouselDefs: defs,
      carouselDefPosts: defPosts,
    };
  }, [publishedPosts]);

  const getViewPostUrl = (postId: string) => `/admin/posts/${postId}`;

  // Render posts with carousels at appropriate intervals
  const renderPostsWithCarousels = () => {
    const carouselThresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
    const result: React.ReactElement[] = [];
    let regularIndex = 0;

    const numberedEvents = carouselThresholds
      .map((threshold, i) => ({ threshold, type: "numbered" as const, num: i + 1 }))
      .filter((e) => carouselPosts[e.num].length > 0);

    const customEvents = carouselDefs
      .map((def, i) => ({ threshold: def.order, type: "custom" as const, index: i, def }))
      .filter((e) => carouselDefPosts[e.index].length > 0);

    const allEvents = [...numberedEvents, ...customEvents].sort(
      (a, b) => a.threshold - b.threshold
    );

    for (const event of allEvents) {
      while (
        regularIndex < regularPosts.length &&
        regularPosts[regularIndex].order < event.threshold
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

      if (event.type === "custom") {
        result.push(
          <PostCarousel
            key={`carousel-def-${event.def.id}`}
            posts={carouselDefPosts[event.index]}
            title={event.def.title}
            showOrder={true}
            getViewPostUrl={getViewPostUrl}
          />
        );
      } else {
        result.push(
          <PostCarousel
            key={`carousel-${event.num}`}
            posts={carouselPosts[event.num]}
            showOrder={true}
            getViewPostUrl={getViewPostUrl}
          />
        );
      }
    }

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

    if (bonusFunniesPosts.length > 0) {
      result.push(
        <PostCarousel
          key="bonus-funnies"
          posts={bonusFunniesPosts}
          title="Bonus Funnies"
          showOrder={true}
          getViewPostUrl={getViewPostUrl}
        />
      );
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
          <Stack
            direction="row"
            spacing={2}
            sx={{ flexShrink: 0, alignItems: "center" }}
          >
            {refreshing && <CircularProgress size={18} />}
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

        {loading && posts.length === 0 && (
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

        {!error && posts.length > 0 && (
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
