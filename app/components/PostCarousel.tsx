"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  Link,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import type { Post } from "@/lib/types";
import Image from "next/image";
import { getDaysSinceOct15_2025 } from "@/lib/utils";
import { postDimensions } from "./postDimensions";

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

interface PostCarouselProps {
  posts: Post[];
  title?: string;
  showOrder?: boolean;
  getViewPostUrl?: (postId: string) => string;
}

export default function PostCarousel({
  posts,
  title,
  showOrder = false,
  getViewPostUrl,
}: PostCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

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

  // Track scroll position to show/hide arrows
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || sortedPosts.length <= 1) {
      setIsAtStart(true);
      setIsAtEnd(false);
      return;
    }

    // Set initial state immediately - we start at the beginning
    setIsAtStart(true);
    setIsAtEnd(false);

    const updateScrollState = () => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      // Use a very small threshold (1px) to account for sub-pixel rendering
      // If scrollLeft is 0 or essentially 0, we're at the start
      const atStart = scrollLeft < 1;

      // Check if we're at the end
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      const atEnd = scrollLeft >= maxScroll - 1;

      setIsAtStart(atStart);
      setIsAtEnd(atEnd);
    };

    // Ensure we start at the beginning and check state
    const initializeScroll = () => {
      // Force scroll to start
      container.scrollLeft = 0;
      // Immediately check state after forcing scroll
      updateScrollState();
    };

    // Initialize immediately
    initializeScroll();

    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      initializeScroll();
      // Double RAF to ensure everything is laid out
      requestAnimationFrame(() => {
        initializeScroll();
      });
    });

    // Also check after a short delay to catch any late layout changes
    setTimeout(initializeScroll, 100);
    setTimeout(initializeScroll, 300);

    // Listen to scroll events
    container.addEventListener("scroll", updateScrollState, { passive: true });

    // Also check on resize
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
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

    // Update scroll state after scrolling completes
    setTimeout(() => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const threshold = 10;

      setIsAtStart(scrollLeft <= threshold);
      setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - threshold);
    }, 300); // Wait for smooth scroll to complete
  };

  return (
    <Box sx={postDimensions.carousel.container}>
      {/* Carousel Title - only display if it's "Bonus Funnies" */}
      {title && title.toLowerCase() === "bonus funnies" && (
        <Typography
          variant="h2"
          component="h2"
          sx={postDimensions.carousel.title}
        >
          {title}
        </Typography>
      )}
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
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            ...postDimensions.carousel.scrollContainer,
            px: sortedPosts.length > 1 ? 2 : 1, // Minimal padding for almost full width
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
            const carouselNum = getCarouselNumber(post);
            return (
              <Card
                key={post.id}
                sx={{
                  minWidth: postDimensions.carousel.cardWidth(
                    sortedPosts.length > 1
                  ),
                  maxWidth: postDimensions.carousel.cardWidth(
                    sortedPosts.length > 1
                  ),
                  width: postDimensions.carousel.cardWidth(
                    sortedPosts.length > 1
                  ),
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
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ...postDimensions.carousel.imageContainer,
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
                      ...postDimensions.spacing.dayTitleSpacing,
                    }}
                  >
                    {/* Day X on the left */}
                    {daysSince !== null && (
                      <Typography variant="h6" fontWeight="medium">
                        Day {daysSince}
                      </Typography>
                    )}

                    {/* Title/Caption, Order, Carousel, and View Post on the right */}
                    <Box
                      sx={{
                        textAlign: "right",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 0.5,
                      }}
                    >
                      {(!hideTitle && post.title) || post.caption ? (
                        <Box
                          sx={{ maxWidth: postDimensions.spacing.textMaxWidth }}
                        >
                          {!hideTitle && post.title && (
                            <Typography
                              variant="body1"
                              fontSize=".875rem"
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
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        {showOrder && (
                          <Typography variant="body1" color="text.secondary">
                            Order: {post.order}
                          </Typography>
                        )}
                        {getViewPostUrl && (
                          <Link
                            href={getViewPostUrl(post.id)}
                            underline="hover"
                          >
                            View Post
                          </Link>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Left Arrow Button */}
        {sortedPosts.length > 1 && !isAtStart && (
          <IconButton
            onClick={() => handleScroll("left")}
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              boxShadow: 2,
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

        {/* Right Arrow Button */}
        {sortedPosts.length > 1 && !isAtEnd && (
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
