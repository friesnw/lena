"use client";

import { Card, CardContent, Box, Skeleton } from "@mui/material";
import { postDimensions } from "./postDimensions";

export default function PostDisplaySkeleton() {
  return (
    <Card sx={postDimensions.regularPost.card}>
      <CardContent>
        {/* Image/Video skeleton - matches PostDisplay photo/video container */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            ...postDimensions.regularPost.imageContainer,
            height: postDimensions.regularPost.imageContainer.maxHeight,
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="pulse"
          />
        </Box>
        
        {/* Day X and Title/Caption skeleton - matches PostDisplay layout */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            ...postDimensions.spacing.dayTitleSpacing,
          }}
        >
          {/* Day X skeleton */}
          <Skeleton variant="text" width={80} height={32} />
          
          {/* Title/Caption skeleton */}
          <Box sx={{ textAlign: "right", maxWidth: postDimensions.spacing.textMaxWidth }}>
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={200} height={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

