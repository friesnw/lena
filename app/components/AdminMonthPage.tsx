"use client";

import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useEffect, useState, useMemo } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import Image from "next/image";
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
    };
    const regular: Post[] = [];

    posts.forEach((post) => {
      if (
        hasCarouselTag(post) &&
        (post.type === "photo" || post.type === "video")
      ) {
        const carouselNum = getCarouselNumber(post);
        if (carouselNum && carouselNum >= 1 && carouselNum <= 6) {
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

  const handlePostClick = (postId: string, event?: React.MouseEvent) => {
    const url = `/admin/posts/${postId}`;

    // Check for modifier keys (Command on Mac, Ctrl on Windows/Linux)
    if (event && (event.metaKey || event.ctrlKey)) {
      // Open in new tab
      window.open(url, "_blank");
    } else {
      // Normal navigation
      router.push(url);
    }
  };

  // Get sorted posts by order for finding adjacent posts
  const sortedPostsByOrder = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [posts]);

  const handleOrderChange = async (
    postId: string,
    direction: "up" | "down"
  ) => {
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    // Calculate new order (increment/decrement by 1)
    const newOrder =
      direction === "up" ? currentPost.order - 1 : currentPost.order + 1;

    // Don't allow negative orders
    if (newOrder < 0) return;

    // Check if another post has this order value
    const conflictingPost = posts.find(
      (p) => p.id !== postId && p.order === newOrder
    );

    try {
      if (conflictingPost) {
        // Swap orders with the conflicting post
        const [response1, response2] = await Promise.all([
          fetch(`/api/posts/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: newOrder }),
          }),
          fetch(`/api/posts/${conflictingPost.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: currentPost.order }),
          }),
        ]);

        if (response1.ok && response2.ok) {
          // Refresh posts
          const refreshResponse = await fetch(
            `/api/posts/admin?month=${month}`
          );
          if (refreshResponse.ok) {
            const refreshedPosts = await refreshResponse.json();
            setPosts(refreshedPosts);
          }
        } else {
          setError("Failed to update post order");
        }
      } else {
        // No conflict, just update this post's order
        const response = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        });

        if (response.ok) {
          // Refresh posts
          const refreshResponse = await fetch(
            `/api/posts/admin?month=${month}`
          );
          if (refreshResponse.ok) {
            const refreshedPosts = await refreshResponse.json();
            setPosts(refreshedPosts);
          }
        } else {
          setError("Failed to update post order");
        }
      }
    } catch (err) {
      setError("Something went wrong while updating order");
    }
  };

  const renderPostCard = (post: Post) => {
    // Can move up if order > 0
    const canMoveUp = post.order > 0;
    // Can move down - always allowed (order can increase)
    const canMoveDown = true;

    return (
      <Card
        key={post.id}
        sx={{
          mb: 2,
          cursor: "pointer",
          "&:hover": {
            boxShadow: 4,
          },
        }}
        onClick={(e) => handlePostClick(post.id, e)}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Chip
                label={post.type}
                size="small"
                color={post.published ? "success" : "default"}
              />
              {post.published ? (
                <Chip label="Published" size="small" color="success" />
              ) : (
                <Chip label="Draft" size="small" />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography color="text.secondary" sx={{ mr: 1 }}>
                Order: {post.order}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOrderChange(post.id, "up");
                }}
                disabled={!canMoveUp}
                sx={{ color: canMoveUp ? "primary.main" : "action.disabled" }}
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOrderChange(post.id, "down");
                }}
                disabled={!canMoveDown}
                sx={{ color: canMoveDown ? "primary.main" : "action.disabled" }}
              >
                <ArrowDownwardIcon />
              </IconButton>
            </Stack>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "medium" }}>
            {post.title}
          </Typography>
          {(post.type === "photo" || post.type === "video") && post.content && (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: 320,
                aspectRatio: "4 / 3",
                borderRadius: 1,
                overflow: "hidden",
                mb: 1.5,
                backgroundColor: "rgba(0,0,0,0.04)",
              }}
            >
              {post.type === "photo" ? (
                <Image
                  src={post.content}
                  alt={post.caption || post.title || "Photo preview"}
                  fill
                  sizes="320px"
                  style={{
                    objectFit: "cover",
                  }}
                  unoptimized
                />
              ) : (
                <Box
                  component="video"
                  controls={false}
                  autoPlay
                  muted
                  loop
                  playsInline
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                >
                  <source src={post.content} />
                  Your browser does not support the video element.
                </Box>
              )}
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {post.type === "text" || post.type === "stat"
              ? post.content.substring(0, 100) +
                (post.content.length > 100 ? "..." : "")
              : post.content}
          </Typography>
          {post.caption && (
            <Typography variant="caption" color="text.secondary">
              Caption: {post.caption}
            </Typography>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1 }}
          >
            Created: {new Date(post.createdAt).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderCarouselAccordion = (carouselNum: number) => {
    const postsForCarousel = carouselPosts[carouselNum];
    if (!postsForCarousel || postsForCarousel.length === 0) {
      return null;
    }

    return (
      <Accordion key={`carousel-${carouselNum}`} sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`carousel-${carouselNum}-content`}
          id={`carousel-${carouselNum}-header`}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">Carousel {carouselNum}</Typography>
            <Chip
              label={`${postsForCarousel.length} post${
                postsForCarousel.length !== 1 ? "s" : ""
              }`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {postsForCarousel.map((post) => renderPostCard(post))}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderContentInDisplayOrder = () => {
    const carouselThresholds = [10, 20, 30, 40, 50, 60];
    const result: ReactElement[] = [];
    let regularIndex = 0;

    for (let i = 0; i < carouselThresholds.length; i++) {
      const threshold = carouselThresholds[i];
      const carouselNum = i + 1;

      while (
        regularIndex < regularPosts.length &&
        regularPosts[regularIndex].order < threshold
      ) {
        result.push(renderPostCard(regularPosts[regularIndex]));
        regularIndex++;
      }

      const carousel = renderCarouselAccordion(carouselNum);
      if (carousel) {
        result.push(carousel);
      }
    }

    while (regularIndex < regularPosts.length) {
      result.push(renderPostCard(regularPosts[regularIndex]));
      regularIndex++;
    }

    return result;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          {pageTitle}
        </Typography>
        <Stack direction="row" spacing={2}>
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

      {!loading && !error && <>{renderContentInDisplayOrder()}</>}
    </Container>
  );
}
