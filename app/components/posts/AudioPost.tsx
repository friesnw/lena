"use client";

import { Box, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import { PlayArrowRounded, PauseRounded } from "@mui/icons-material";
import type { Post } from "@/lib/types";
import { getDaysSinceOct15_2025, getS3Url } from "@/lib/utils";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import Image from "next/image";

interface AudioPostProps {
  post: Post;
  hideTitle: boolean;
}

export default function AudioPost({ post, hideTitle }: AudioPostProps) {
  const { audioRef, isPlaying, togglePlay } = useAudioPlayer();
  const daysSince = getDaysSinceOct15_2025(
    post.metadata?.dateTaken || post.createdAt
  );

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 4,
        background: "#FFFFFF",
        mb: 3,
      }}
    >
      <Stack
        direction="row"
        spacing={3}
        sx={{
          borderRadius: 3,
        }}
      >
        {post.metadata?.albumCoverUrl && (
          <Box
            sx={{
              width: 140,
              height: 140,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              alignSelf: "center",
            }}
          >
            <Image
              src={getS3Url(post.metadata.albumCoverUrl)}
              alt={post.title || "Album cover"}
              width={140}
              height={140}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              unoptimized
            />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexGrow: 1,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            {!hideTitle && post.title && (
              <Typography variant="h5" component="h2" fontSize="1.25rem">
                {post.title}
              </Typography>
            )}
            {post.caption && (
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="1rem"
                sx={{ mt: 0.5 }}
              >
                {post.caption}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            sx={{
              width: 72,
              height: 72,
              m: { xs: 2, md: 3 },
              borderRadius: "50%",
              background: (theme) => theme.palette.primary.main,
              color: "white",
              boxShadow: isPlaying ? 4 : 2,
              "&:hover": {
                background: "#D76A58",
              },
            }}
          >
            {isPlaying ? (
              <PauseRounded fontSize="large" />
            ) : (
              <PlayArrowRounded fontSize="large" />
            )}
          </IconButton>
        </Box>
      </Stack>

      <audio ref={audioRef} src={post.content} preload="metadata" />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {post.tags?.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
