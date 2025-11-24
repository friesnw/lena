"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import type { Post } from "@/lib/types";
import Image from "next/image";
import { getDaysSinceOct15_2025 } from "@/lib/utils";
import AudioPost from "./posts/AudioPost";

interface PostDisplayProps {
  post: Post;
}

export default function PostDisplay({ post }: PostDisplayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTitle = post.tags?.includes("Hide Title") ?? false;

  useEffect(() => {
    if (post.type !== "video") {
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== videoElement) return;
          if (entry.isIntersecting) {
            videoElement.muted = true;
            videoElement.play().catch(() => {});
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
      videoElement.pause();
    };
  }, [post]);

  const renderPostContent = () => {
    switch (post.type) {
      case "text":
        return (
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {post.content}
          </Typography>
        );

      case "photo":
      case "video":
        const daysSince = getDaysSinceOct15_2025(
          post.metadata?.dateTaken || post.createdAt
        );
        return (
          <Box>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: "800px",
                height: "auto",
                margin: "0 auto",
                mb: 2,
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              }}
            >
              {post.type === "photo" ? (
                <Image
                  src={post.content}
                  alt={post.caption || "Photo"}
                  width={800}
                  height={600}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    maxHeight: "600px",
                  }}
                  unoptimized
                />
              ) : (
                <Box
                  component="video"
                  ref={videoRef}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  sx={{
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
            {/* Day X and Title/Caption below image */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mt: 2,
              }}
            >
              {/* Day X on the left */}
              {daysSince !== null && (
                <Typography variant="h6" fontWeight="medium">
                  Day {daysSince}
                </Typography>
              )}

              {/* Title/Caption on the right */}
              {(!hideTitle && post.title) || post.caption ? (
                <Box sx={{ textAlign: "right", maxWidth: "70%" }}>
                  {!hideTitle && post.title && (
                    <Typography
                      variant="body2"
                      component="h3"
                      sx={{ mb: post.caption ? 0.5 : 0, fontWeight: "medium" }}
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
          </Box>
        );

      case "stat":
        return (
          <Typography
            variant="h5"
            component="div"
            sx={{ fontFamily: "monospace", textAlign: "center" }}
          >
            {post.content}
          </Typography>
        );

      default:
        return (
          <Typography variant="body1" color="text.secondary">
            Unknown post type
          </Typography>
        );
    }
  };

  if (post.type === "text") {
    return (
      <Box sx={{ mb: 3 }}>
        {!hideTitle && post.title && (
          <Typography variant="h4" component="h2" gutterBottom>
            {post.title}
          </Typography>
        )}
        {renderPostContent()}
      </Box>
    );
  }

  if (post.type === "audio") {
    return <AudioPost post={post} hideTitle={hideTitle} />;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {post.type !== "photo" && post.type !== "video" ? (
          <>
            {!hideTitle && post.title && (
              <Typography component="h2" gutterBottom>
                {post.title}
              </Typography>
            )}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Chip label={post.type} size="small" />
              {post.order !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  Order: {post.order}
                </Typography>
              )}
            </Box>
            {renderPostContent()}
          </>
        ) : (
          renderPostContent()
        )}
      </CardContent>
    </Card>
  );
}
