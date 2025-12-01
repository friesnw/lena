"use client";

import {
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  Stack,
} from "@mui/material";
import { useEffect, useState, useMemo } from "react";
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
  return post.tags?.some((tag) => tag.startsWith("Carousel ")) ?? false;
}

// Helper function to get carousel number from tag
function getCarouselNumber(post: Post): number | null {
  const carouselTag = post.tags?.find((tag) => tag.startsWith("Carousel "));
  if (!carouselTag) return null;
  const match = carouselTag.match(/Carousel (\d+)/);
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
  const pageTitle = `Admin: ${monthName}`;
  usePageTitle(pageTitle);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/admin?month=${month}`);
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

    return { carouselPosts: carousel, regularPosts: regular };
  }, [posts]);

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
        result.push(
          <PostCarousel
            key={`carousel-${carouselNum}`}
            posts={carouselPosts[carouselNum]}
            title={`Carousel ${carouselNum}`}
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

        {!loading && !error && posts.length > 0 && renderPostsWithCarousels()}
      </Box>
    </Box>
  );
}
