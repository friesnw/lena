"use client";

import Image from "next/image";
import { Box, Link, Typography } from "@mui/material";
import type { Post } from "@/lib/types";
import { getDaysSinceOct15_2025 } from "@/lib/utils";

interface PostGalleryProps {
  post: Post;
  showOrder?: boolean;
  viewPostUrl?: string;
}

const POSITIONS = [
  { alignSelf: "flex-start" as const, width: "58%", rotate: "-1.5deg" },
  { alignSelf: "flex-end"   as const, width: "56%", rotate: "1deg"   },
  { alignSelf: "flex-start" as const, width: "62%", rotate: "-0.8deg" },
];

const FEATURE_WIDTH_BOOST = 4;
const OVERLAP_PX = -160;

export default function PostGallery({ post, showOrder, viewPostUrl }: PostGalleryProps) {
  const images = post.images ?? [];
  const daysSince = getDaysSinceOct15_2025(
    post.metadata?.dateTaken || post.createdAt
  );

  if (images.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {images.map((img, i) => {
          const pos = POSITIONS[Math.min(i, POSITIONS.length - 1)];
          const baseWidth = parseFloat(pos.width);
          const width = img.isFeature
            ? `${baseWidth + FEATURE_WIDTH_BOOST}%`
            : pos.width;

          return (
            <Box
              key={img.url}
              sx={{
                alignSelf: pos.alignSelf,
                width,
                mt: i === 0 ? 0 : `${OVERLAP_PX}px`,
                position: "relative",
                zIndex: img.isFeature ? 10 : i + 1,
                transform: `rotate(${pos.rotate})`,
              }}
            >
              <Box
                sx={{
                  background: "#f9f6f2",
                  border: "1px solid #e2ddd7",
                  borderRadius: "6px",
                  boxShadow:
                    "0 8px 28px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)",
                  overflow: "hidden",
                  padding: "7px 7px 24px",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4/5",
                    overflow: "hidden",
                    borderRadius: "4px",
                  }}
                >
                  <Image
                    src={img.url}
                    alt={post.caption || "Gallery photo"}
                    fill
                    style={{
                      objectFit: "cover",
                    }}
                    unoptimized
                  />
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.1'/%3E%3C/svg%3E")`,
                      opacity: 0.5,
                      mixBlendMode: "multiply",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(ellipse at center, transparent 50%, rgba(50,40,30,0.28) 100%)",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 2,
        }}
      >
        {daysSince !== null && (
          <Typography variant="h6" fontWeight="medium" sx={{ flexShrink: 0 }}>
            Day {daysSince}
          </Typography>
        )}
        {post.caption && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              textAlign: "right",
              maxWidth: "75%",
              ml: 2,
            }}
          >
            {post.caption}
          </Typography>
        )}
      </Box>

      {(showOrder || viewPostUrl) && (
        <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
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
