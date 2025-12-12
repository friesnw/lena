"use client";

import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import { postDimensions } from "./postDimensions";

interface PostCarouselSkeletonProps {
  title?: string;
  postCount?: number;
}

export default function PostCarouselSkeleton({
  title,
  postCount = 3,
}: PostCarouselSkeletonProps) {
  const hasMultiplePosts = postCount > 1;
  const cardWidth = postDimensions.carousel.cardWidth(hasMultiplePosts);

  return (
    <Box sx={postDimensions.carousel.container}>
      {/* Carousel Title skeleton - only if it's "Bonus Funnies" */}
      {title && title.toLowerCase() === "bonus funnies" && (
        <Skeleton
          variant="text"
          width={200}
          height={40}
          sx={postDimensions.carousel.title}
          animation="pulse"
        />
      )}
      
      {/* Horizontal scrolling container skeleton */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            overflowX: "hidden",
            ...postDimensions.carousel.scrollContainer,
          }}
        >
          {/* Render skeleton cards to show it's a carousel */}
          {Array.from({ length: Math.min(postCount, 3) }).map((_, i) => (
            <Card
              key={i}
              sx={{
                minWidth: cardWidth,
                maxWidth: cardWidth,
                width: cardWidth,
                flexShrink: 0,
              }}
            >
              <CardContent>
                {/* Photo/Video skeleton - matches PostCarousel dimensions */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    ...postDimensions.carousel.imageContainer,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="pulse"
                  />
                </Box>

                {/* Day X and Title/Caption skeleton - matches PostCarousel layout */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    ...postDimensions.spacing.dayTitleSpacing,
                  }}
                >
                  {/* Day X skeleton */}
                  <Skeleton variant="text" width={80} height={32} animation="pulse" />
                  
                  {/* Title/Caption skeleton */}
                  <Box
                    sx={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 0.5,
                      maxWidth: postDimensions.spacing.textMaxWidth,
                    }}
                  >
                    <Skeleton variant="text" width={150} height={24} animation="pulse" />
                    <Skeleton variant="text" width={200} height={20} animation="pulse" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

