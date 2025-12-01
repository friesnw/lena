"use client";

import { useEffect, useMemo, useRef } from "react";
import { Box, IconButton, Typography, Card, CardContent, Link } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import type { Post } from "@/lib/types";
import Image from "next/image";
import { getDaysSinceOct15_2025 } from "@/lib/utils";

interface PostCarouselProps {
  posts: Post[];
  title?: string;
  showOrder?: boolean;
  getViewPostUrl?: (postId: string) => string;
}

export default function PostCarousel({ posts, title, showOrder = false, getViewPostUrl }: PostCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Sort posts by order field in ascending order
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => a.order - b.order);
  }, [posts]);

  if (sortedPosts.length === 0) {
    return null;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.muted = true;
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach((video) => observer.observe(video));

    return () => {
      observer.disconnect();
      videoRefs.current.forEach((video) => {
        video.pause();
      });
    };
  }, [sortedPosts]);

  const setVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (!el) {
      videoRefs.current.delete(id);
      return;
    }
    videoRefs.current.set(id, el);
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Calculate card width (accounts for padding and gap)
    const containerWidth = container.clientWidth;
    // Reduced padding for almost full width cards
    const padding = sortedPosts.length > 1 ? 32 : 0; // Just enough for buttons
    const gap = 8; // Minimal gap for peek effect
    const availableWidth = containerWidth - padding;
    const cardWidth = availableWidth - gap; // Card width minus gap for peek

    if (direction === "left") {
      container.scrollBy({
        left: -cardWidth - gap,
        behavior: "smooth",
      });
    } else {
      container.scrollBy({
        left: cardWidth + gap,
        behavior: "smooth",
      });
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Scroll Container */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
        {/* Horizontal Scrolling Container */}
        <Box
          ref={scrollContainerRef}
          sx={{
            display: "flex",
            overflowX: "auto",
            overflowY: "hidden",
            gap: 1, // Reduced gap for almost full width
            px: sortedPosts.length > 1 ? 2 : 1, // Minimal padding for almost full width
            py: 2,
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": {
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderRadius: 4,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          }}
        >
          {sortedPosts.map((post, index) => {
            const hideTitle = post.tags?.includes("Hide Title") ?? false;
            const daysSince = getDaysSinceOct15_2025(
              post.metadata?.dateTaken || post.createdAt
            );
            return (
              <Card
                key={post.id}
                sx={{
                  minWidth: (theme) => {
                    // Calculate width: almost full container with minimal padding and gap
                    const padding = sortedPosts.length > 1 ? 32 : 16; // Minimal padding for almost full width
                    const gap = 8; // Minimal gap: 8px
                    return `calc(100% - ${padding}px - ${gap}px)`;
                  },
                  maxWidth: (theme) => {
                    const padding = sortedPosts.length > 1 ? 32 : 16;
                    const gap = 8;
                    return `calc(100% - ${padding}px - ${gap}px)`;
                  },
                  width: (theme) => {
                    const padding = sortedPosts.length > 1 ? 32 : 16;
                    const gap = 8;
                    return `calc(100% - ${padding}px - ${gap}px)`;
                  },
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                }}
              >
                <CardContent>
                  {/* Photo or Video */}
                  {(post.type === "photo" || post.type === "video") && (
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: { xs: "350px", sm: "450px", md: "550px" },
                        mb: 2,
                        overflow: "hidden",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      {post.type === "photo" ? (
                        <Image
                          src={post.content}
                          alt={post.caption || post.title || "Photo"}
                          fill
                          style={{
                            objectFit: "cover",
                          }}
                          unoptimized
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                      ) : (
                        <Box
                          component="video"
                          ref={setVideoRef(post.id)}
                          muted
                          loop
                          playsInline
                          preload="metadata"
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

                  {/* Day X and Title/Caption below image */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mt: 2,
                    }}
                  >
                    {/* Day X and Order on the left */}
                    <Box>
                      {daysSince !== null && (
                        <Typography variant="h6" fontWeight="medium">
                          Day {daysSince}
                        </Typography>
                      )}
                      {showOrder && (
                        <Typography variant="caption" color="text.secondary">
                          Order: {post.order}
                        </Typography>
                      )}
                    </Box>

                    {/* Title/Caption on the right */}
                    {(!hideTitle && post.title) || post.caption ? (
                      <Box sx={{ textAlign: "right", maxWidth: "70%" }}>
                        {!hideTitle && post.title && (
                          <Typography
                            variant="body2"
                            component="h3"
                            sx={{
                              mb: post.caption ? 0.5 : 0,
                              fontWeight: "medium",
                            }}
                          >
                            {post.title}
                          </Typography>
                        )}
                        {post.caption && (
                          <Typography variant="body2" color="text.secondary">
                            {post.caption}
                          </Typography>
                        )}
                      </Box>
                    ) : null}
                  </Box>
                  {getViewPostUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Link href={getViewPostUrl(post.id)} underline="hover">
                        View Post
                      </Link>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Next Button */}
        {sortedPosts.length > 1 && (
          <IconButton
            onClick={() => handleScroll("right")}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              boxShadow: 2,
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
