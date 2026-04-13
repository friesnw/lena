"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, Typography, Box, Chip, Link, IconButton } from "@mui/material";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import type { Post } from "@/lib/types";
import Image from "next/image";
import { getDaysSinceOct15_2025 } from "@/lib/utils";
import AudioPost from "./posts/AudioPost";
import { postDimensions } from "./postDimensions";

interface PostDisplayProps {
  post: Post;
  showOrder?: boolean;
  viewPostUrl?: string;
}

export default function PostDisplay({
  post,
  showOrder = false,
  viewPostUrl,
}: PostDisplayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTitle = post.tags?.includes("Hide Title") ?? false;
  const soundOn = post.tags?.includes("Sound On") ?? false;
  const [isMuted, setIsMuted] = useState(true);

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
  }, [post.id, post.type]);

  useEffect(() => {
    if (post.type !== "video" || !videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, post.type]);

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
                height: "auto",
                margin: "0 auto",
                overflow: "hidden",
                ...postDimensions.regularPost.imageContainer,
              }}
            >
              {post.type === "photo" ? (
                <Image
                  src={post.content!}
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
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="video"
                    ref={videoRef}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    sx={{
                      width: "100%",
                      maxHeight: "600px",
                      height: "auto",
                      objectFit: "cover",
                      display: "block",
                    }}
                  >
                    <source src={post.content} />
                    Your browser does not support the video element.
                  </Box>
                  {soundOn && (
                    <IconButton
                      onClick={() => setIsMuted((prev) => !prev)}
                      size="small"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        bgcolor: "rgba(0, 0, 0, 0.5)",
                        color: "white",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                      }}
                    >
                      {isMuted ? (
                        <VolumeOffIcon fontSize="small" />
                      ) : (
                        <VolumeUpIcon fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
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
              <Box>
                {daysSince !== null && (
                  <Typography variant="h6" fontWeight="medium">
                    Day {daysSince}
                  </Typography>
                )}
              </Box>

              {/* Title/Caption on the right */}
              {(!hideTitle && post.title) || post.caption ? (
                <Box
                  sx={{
                    textAlign: "right",
                    maxWidth: postDimensions.spacing.textMaxWidth,
                  }}
                >
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
            {(showOrder || viewPostUrl) && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {showOrder && (
                  <Typography variant="body1" color="text.secondary">
                    Order: {post.order}
                  </Typography>
                )}
                {viewPostUrl && (
                  <Link href={viewPostUrl} underline="hover">
                    View Post
                  </Link>
                )}
              </Box>
            )}
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
          <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
            {post.title}
          </Typography>
        )}
        {renderPostContent()}
        {(showOrder || viewPostUrl) && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 2,
            }}
          >
            {showOrder && (
              <Typography variant="body1" color="text.secondary">
                Order: {post.order}
              </Typography>
            )}
            {viewPostUrl && (
              <Link href={viewPostUrl} underline="hover">
                View Post
              </Link>
            )}
          </Box>
        )}
      </Box>
    );
  }

  if (post.type === "audio") {
    return (
      <AudioPost post={post} hideTitle={hideTitle} viewPostUrl={viewPostUrl} />
    );
  }

  return (
    <Card sx={postDimensions.regularPost.card}>
      <CardContent>
        {post.type !== "photo" && post.type !== "video" ? (
          <>
            {!hideTitle && post.title && (
              <Typography component="h2" gutterBottom>
                {post.title}
              </Typography>
            )}
            <Box sx={{ mb: 2 }}>
              <Chip label={post.type} size="small" />
            </Box>
            {renderPostContent()}
          </>
        ) : (
          renderPostContent()
        )}
        {(showOrder || viewPostUrl) &&
          post.type !== "photo" &&
          post.type !== "video" && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 2,
              }}
            >
              {showOrder && (
                <Typography variant="body1" color="text.secondary">
                  Order: {post.order}
                </Typography>
              )}
              {viewPostUrl && (
                <Link href={viewPostUrl} underline="hover">
                  View Post
                </Link>
              )}
            </Box>
          )}
      </CardContent>
    </Card>
  );
}
