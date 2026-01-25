"use client";

import { Typography, Alert, Box, Button } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import PostDisplay from "./PostDisplay";
import PostCarousel from "./PostCarousel";
import PostDisplaySkeleton from "./PostDisplaySkeleton";
import PostCarouselSkeleton from "./PostCarouselSkeleton";

import { getMonthRangeText } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { monthNavigation } from "@/lib/monthNavigation";

interface MonthPageProps {
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

// Helper function to get carousel number from tags
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

// Helper function to get month name from number
function getMonthName(monthNum: number): string {
  const monthNames = [
    "Month 0",
    "Month 1",
    "Month 2",
    "Month 3",
    "Month 4",
    "Month 5",
    "Month Six",
    "Month 7",
    "Month 8",
    "Month 9",
    "Month 10",
    "Month 11",
    "Month 12",
  ];
  return monthNames[monthNum] || `Month ${monthNum}`;
}

export default function MonthPage({ month, monthName }: MonthPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  usePageTitle(monthName);

  // Check if next month exists in navigation
  const hasNextMonth = useMemo(() => {
    return monthNavigation.some((item) => item.month === month + 1);
  }, [month]);

  // Simple scroll restoration - only save/restore on page load/unload
  useEffect(() => {
    const scrollKey = `scroll-position-month-${month}`;

    // Restore scroll position after page loads
    const restoreScroll = () => {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) {
        const scrollY = parseInt(saved, 10);
        if (scrollY > 0) {
          // Wait for content to be rendered
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 100);
        }
      }
    };

    // Save scroll position before page unloads
    const saveScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY > 0) {
        sessionStorage.setItem(scrollKey, scrollY.toString());
      }
    };

    // Restore after content loads
    if (!loading && posts.length > 0) {
      restoreScroll();
    }

    // Save on unload
    window.addEventListener("beforeunload", saveScroll);
    window.addEventListener("pagehide", saveScroll);

    return () => {
      saveScroll();
      window.removeEventListener("beforeunload", saveScroll);
      window.removeEventListener("pagehide", saveScroll);
    };
  }, [month, loading, posts.length]);

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
  }, [month]);

  // Separate posts into carousel posts, bonus funnies, and regular posts
  const { carouselPosts, bonusFunniesPosts, regularPosts } = useMemo(() => {
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
      10: [],
      11: [],
    };
    const bonusFunnies: Post[] = [];
    const regular: Post[] = [];

    posts.forEach((post) => {
      // Check for bonus funnies tag first (separate from numbered carousels)
      const hasBonusFunnies =
        post.tags?.some(
          (tag) => tag.toLowerCase().trim() === "bonus funnies"
        ) ?? false;

      const hasCarousel = hasCarouselTag(post);
      const isPhotoOrVideo = post.type === "photo" || post.type === "video";

      // Bonus funnies goes to its own separate carousel at the end
      if (hasBonusFunnies && isPhotoOrVideo) {
        bonusFunnies.push(post);
      } else if (hasCarousel && isPhotoOrVideo) {
        const carouselNum = getCarouselNumber(post);
        if (carouselNum && carouselNum >= 1 && carouselNum <= 11) {
          carousel[carouselNum].push(post);
        } else {
          // Debug: Log posts that have carousel tag but invalid carousel number
          console.log(`[MonthPage] Post has carousel tag but invalid number:`, {
            id: post.id,
            title: post.title,
            tags: post.tags,
            carouselNum,
          });
          regular.push(post);
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

    // Sort bonus funnies by order
    bonusFunnies.sort((a, b) => a.order - b.order);

    // Sort regular posts by order
    regular.sort((a, b) => a.order - b.order);

    // Debug: Log carousel breakdown
    console.log(`[MonthPage] Carousel breakdown:`, {
      totalPosts: posts.length,
      carousel9Count: carousel[9].length,
      bonusFunniesCount: bonusFunnies.length,
      regularCount: regular.length,
      allCarouselCounts: Object.keys(carousel).reduce((acc, key) => {
        acc[key] = carousel[parseInt(key, 10)].length;
        return acc;
      }, {} as Record<string, number>),
    });

    if (carousel[9].length > 0) {
      console.log(
        `[MonthPage] Found ${carousel[9].length} carousel 9 posts:`,
        carousel[9].map((p) => ({
          id: p.id,
          title: p.title,
          tags: p.tags,
          order: p.order,
        }))
      );
    }

    return {
      carouselPosts: carousel,
      bonusFunniesPosts: bonusFunnies,
      regularPosts: regular,
    };
  }, [posts]);

  // Render posts with carousels at appropriate intervals
  const renderPostsWithCarousels = () => {
    const carouselThresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
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
        result.push(
          <PostCarousel
            key={`carousel-${carouselNum}`}
            posts={carouselPosts[carouselNum]}
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

    // Render bonus funnies carousel at the end
    if (bonusFunniesPosts.length > 0) {
      result.push(
        <PostCarousel
          key="bonus-funnies"
          posts={bonusFunniesPosts}
          title="Bonus Funnies"
        />
      );
    }

    return result;
  };

  // Render skeleton placeholders that match the expected layout
  const renderSkeletons = () => {
    const skeletons: React.ReactElement[] = [];

    // Add a few regular post skeletons
    for (let i = 0; i < 3; i++) {
      skeletons.push(<PostDisplaySkeleton key={`skeleton-post-${i}`} />);
    }

    // Add a carousel skeleton (with 3 posts to show it's scrollable)
    skeletons.push(
      <PostCarouselSkeleton key="skeleton-carousel" postCount={3} />
    );

    // Add a few more regular post skeletons
    for (let i = 3; i < 6; i++) {
      skeletons.push(<PostDisplaySkeleton key={`skeleton-post-${i}`} />);
    }

    return skeletons;
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

        {/* Only show skeletons if we don't have any posts (including cached) */}
        {loading && posts.length === 0 && renderSkeletons()}

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

        {/* Month Navigation */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            mt: 4,
            mb: 2,
          }}
        >
          {month > 0 ? (
            <Button
              component={Link}
              href={`/month/${month - 1}`}
              variant="primary"
              sx={{ flex: 1 }}
            >
              ← {getMonthName(month - 1)}
            </Button>
          ) : (
            <Box sx={{ flex: 1 }} /> // Spacer when no previous month
          )}

          {hasNextMonth ? (
            <Button
              component={Link}
              href={`/month/${month + 1}`}
              variant="primary"
              sx={{ flex: 1 }}
            >
              {getMonthName(month + 1)} →
            </Button>
          ) : (
            <Box sx={{ flex: 1 }} /> // Spacer when no next month
          )}
        </Box>
      </Box>
    </Box>
  );
}
