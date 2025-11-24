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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

  const handlePostClick = (postId: string) => {
    router.push(`/admin/posts/${postId}`);
  };

  const renderPostCard = (post: Post) => (
    <Card
      key={post.id}
      sx={{
        mb: 2,
        cursor: "pointer",
        "&:hover": {
          boxShadow: 4,
        },
      }}
      onClick={() => handlePostClick(post.id)}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
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
          <Typography color="text.secondary">Order: {post.order}</Typography>
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
