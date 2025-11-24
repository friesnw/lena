"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Card,
  CardActionArea,
  Stack,
  Link,
  useTheme,
  type Theme,
} from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import Image from "next/image";
import type { Post } from "@/lib/types";
import { getDaysSinceOct15_2025 } from "@/lib/utils";
import { useIntroSeen } from "@/hooks/useIntroSeen";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePageTitle";
import { monthNavigation } from "@/lib/monthNavigation";

const collageSlots = monthNavigation.map((month) => ({
  month: month.month,
  label: month.title,
}));

const mediaTypes: Post["type"][] = ["photo", "video"];

type MonthMediaMap = Record<number, Post[]>;

const INITIAL_MEDIA_STATE: MonthMediaMap = collageSlots.reduce((acc, slot) => {
  acc[slot.month] = [];
  return acc;
}, {} as MonthMediaMap);

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const { hasSeenIntro } = useIntroSeen();
  const pageTitle = "Lena's Digital Scrapbook";
  usePageTitle(pageTitle);
  const [postsByMonth, setPostsByMonth] =
    useState<MonthMediaMap>(INITIAL_MEDIA_STATE);
  const [activePosts, setActivePosts] = useState<(Post | null)[]>(
    collageSlots.map(() => null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ensure Material Symbols font loads
  useEffect(() => {
    if (typeof document !== "undefined") {
      const linkId = "material-symbols-font";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
        document.head.appendChild(link);
      }
    }
  }, []);

  useEffect(() => {
    if (hasSeenIntro === false) {
      router.replace("/intro");
    }
  }, [hasSeenIntro, router]);

  useEffect(() => {
    if (hasSeenIntro !== true) return;

    let isMounted = true;

    const fetchPostsForMonth = async (month: number) => {
      const response = await fetch(`/api/posts?month=${month}`);
      if (!response.ok) {
        throw new Error(`Failed to load posts for month ${month}`);
      }
      const data = (await response.json()) as Post[];
      return data.filter((post) => mediaTypes.includes(post.type));
    };

    const loadCollageMedia = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.all(
          collageSlots.map((slot) =>
            fetchPostsForMonth(slot.month).catch(() => [])
          )
        );

        if (!isMounted) return;

        const nextMap = collageSlots.reduce((acc, slot, index) => {
          acc[slot.month] = results[index];
          return acc;
        }, {} as MonthMediaMap);

        setPostsByMonth(nextMap);
      } catch (err) {
        if (isMounted) {
          setError("Unable to load the collage. Please refresh.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCollageMedia();

    return () => {
      isMounted = false;
    };
  }, [hasSeenIntro]);

  const pickRandomPost = useCallback(
    (month: number) => {
      const pool = postsByMonth[month];
      if (!pool || pool.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex];
    },
    [postsByMonth]
  );

  useEffect(() => {
    if (hasSeenIntro !== true) return;

    setActivePosts((prev) =>
      collageSlots.map((slot, index) => {
        const pool = postsByMonth[slot.month];
        if (!pool || pool.length === 0) return null;

        const current = prev[index];
        if (current && pool.some((post) => post.id === current.id)) {
          return current;
        }

        return pickRandomPost(slot.month);
      })
    );
  }, [pickRandomPost, postsByMonth, hasSeenIntro]);

  useEffect(() => {
    if (hasSeenIntro !== true) return;

    const intervals: number[] = [];

    collageSlots.forEach((slot, index) => {
      const pool = postsByMonth[slot.month];
      if (!pool || pool.length === 0) {
        return;
      }

      const intervalId = window.setInterval(() => {
        setActivePosts((prev) => {
          const next = [...prev];
          next[index] = pickRandomPost(slot.month);
          return next;
        });
      }, 7000 + index * 1500);

      intervals.push(intervalId);
    });

    return () => {
      intervals.forEach((intervalId) => window.clearInterval(intervalId));
    };
  }, [pickRandomPost, postsByMonth, hasSeenIntro]);

  if (hasSeenIntro !== true) {
    return (
      <Container
        maxWidth="md"
        sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 10,
            gap: 2,
          }}
        >
          <CircularProgress size={32} />
          <Typography variant="body1" color="text.secondary">
            Turning the page...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#465362",
        py: { xs: 3, md: 6 },
        pt: { xs: 10, md: 10 }, // Account for AppBar
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: "98%", px: { md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 4, md: 8 },
            alignItems: "stretch",
            px: { xs: 1, md: 2 },
          }}
        >
          <Box
            sx={{
              flex: { md: "0 0 500px" }, // Fixed width, narrower
              width: { md: 500 },
              maxWidth: { md: 500 },
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: "left", mb: 6 }}>
              <Typography
                component="h1"
                variant="h1"
                sx={{
                  color: "#F0F5F4",
                  lineHeight: 1.2,
                  fontSize: "3.5rem",
                  mb: 1,
                }}
              >
                {pageTitle}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#ffc9c1",
                  fontSize: "1.6rem",
                  lineHeight: 1.5,
                }}
              >
                from 0 to 365 days
              </Typography>
            </Box>

            {/* Month Navigation Cards */}
            <Stack spacing={1.5} sx={{ mb: 4 }}>
              {monthNavigation.map((month) => (
                <Card
                  key={month.month}
                  component={Link}
                  href={`/month/${month.month}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    bgcolor: (theme) => theme.palette.background.surface,
                    borderRadius: 2,
                    boxShadow: 1,
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-2px)",
                      bgcolor: "#eae5da",
                    },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 2,
                      bgcolor: month.iconBgColor,
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      color: "#465362",
                    }}
                  >
                    {typeof month.icon === "string" ? (
                      <Box
                        component="span"
                        className="material-symbols-outlined"
                        sx={{
                          fontSize: "1.5rem !important",
                          fontFamily: '"Material Symbols Outlined" !important',
                          fontWeight: 300,
                          fontVariationSettings:
                            '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24',
                          display: "inline-block",
                          lineHeight: 1,
                        }}
                      >
                        {month.icon}
                      </Box>
                    ) : (
                      <month.icon sx={{ fontSize: "1.5rem" }} />
                    )}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#465362",
                        fontWeight: 600,
                        fontSize: "1rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {month.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#627080",
                        fontSize: "0.875rem",
                      }}
                    >
                      {month.description}
                    </Typography>
                  </Box>

                  {/* Chevron */}
                  <Box
                    sx={{
                      flexShrink: 0,
                      color: "#8292A5",
                    }}
                  >
                    <ChevronRight sx={{ fontSize: "1.5rem" }} />
                  </Box>
                </Card>
              ))}
            </Stack>

            {/* Footer */}
            <Box sx={{ textAlign: "center", pt: 2 }}>
              <Link
                href="/intro"
                sx={{
                  color: "#F0F5F4",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                About This Scrapbook
              </Link>
            </Box>
          </Box>

          <Box
            sx={{
              flex: { md: 1 },
              width: "100%",
              height: { md: "calc(100vh - 120px)" },
              maxHeight: { md: "calc(100vh - 120px)" },
              position: "relative",
            }}
          >
            <MediaCollage
              activePosts={activePosts}
              loading={loading}
              error={error}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

interface MediaCollageProps {
  activePosts: (Post | null)[];
  loading: boolean;
  error: string;
}

function MediaCollage({ activePosts, loading, error }: MediaCollageProps) {
  const slotStyles = [
    {
      gridColumn: { xs: "span 1", sm: "span 2" },
      minHeight: { xs: 220, sm: 280, md: 320 },
      height: { md: "calc((100vh - 120px - 32px) * 0.65)" },
      maxHeight: { md: "calc((100vh - 120px - 32px) * 0.65)" },
    },
    {
      minHeight: { xs: 200, sm: 220, md: 240 },
      height: { md: "calc((100vh - 120px - 32px) * 0.175)" },
      maxHeight: { md: "calc((100vh - 120px - 32px) * 0.175)" },
    },
    {
      minHeight: { xs: 200, sm: 220, md: 240 },
      height: { md: "calc((100vh - 120px - 32px) * 0.175)" },
      maxHeight: { md: "calc((100vh - 120px - 32px) * 0.175)" },
    },
  ];

  return (
    <Box sx={{ height: { md: "100%" } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
          height: { md: "100%" },
          maxHeight: { md: "calc(100vh - 120px)" },
        }}
      >
        {collageSlots.map((slot, index) => (
          <CollageSlot
            key={slot.month}
            post={activePosts[index]}
            loading={loading}
            sx={slotStyles[index]}
          />
        ))}
      </Box>
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: "block" }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

interface CollageSlotProps {
  post: Post | null;
  loading: boolean;
  sx?: React.ComponentProps<typeof Box>["sx"];
}

function CollageSlot({ post, loading, sx }: CollageSlotProps) {
  const dayNumber =
    post && getDaysSinceOct15_2025(post.metadata?.dateTaken || post.createdAt);

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: 4,
        minHeight: 220,
        height: { md: "100%" },
        isolation: "isolate",
        ...sx,
      }}
    >
      {post ? (
        <>
          {post.type === "photo" ? (
            <Image
              src={post.content}
              alt={post.caption || post.title || "Collage image"}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{
                objectFit: "cover",
                transition: "transform 0.5s ease",
              }}
              unoptimized
            />
          ) : (
            <Box
              component="video"
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
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            backgroundColor: "rgba(0,0,0,0.02)",
          }}
        >
          <Typography variant="body2">
            {loading ? "Loading memories..." : "No media yet"}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          color: "common.white",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          p: 2,
          zIndex: 1,
        }}
      >
        {dayNumber !== null && (
          <Typography variant="h6">Day {dayNumber}</Typography>
        )}
      </Box>
    </Box>
  );
}
