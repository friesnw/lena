// Shared dimension constants for posts to keep skeletons in sync with actual components

export const postDimensions = {
  // PostDisplay photo/video dimensions
  regularPost: {
    imageContainer: {
      maxWidth: "800px",
      maxHeight: "600px",
      mb: 2,
      borderRadius: 1,
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    },
    card: {
      mb: 3,
    },
  },
  
  // PostCarousel dimensions
  carousel: {
    imageContainer: {
      height: { xs: "350px", sm: "450px", md: "550px" },
      mb: 2,
      borderRadius: 1,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    container: {
      mb: 3,
    },
    title: {
      mb: 2,
      fontSize: "1.75rem",
      fontWeight: 400,
    },
    scrollContainer: {
      gap: 1,
      py: 2,
    },
    cardWidth: (hasMultiplePosts: boolean) => {
      const padding = hasMultiplePosts ? 32 : 16;
      const gap = 8;
      return `calc(100% - ${padding}px - ${gap}px)`;
    },
  },
  
  // Common spacing
  spacing: {
    dayTitleSpacing: {
      mt: 2,
    },
    textMaxWidth: "85%",
  },
} as const;

