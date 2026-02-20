"use client";

import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminAllPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const pageTitle = "Admin: All Posts";
  usePageTitle(pageTitle);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const response = await fetch(
          `/api/posts/admin?month=all&_t=${timestamp}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );
        const data = await response.json();

        if (response.ok) {
          setPosts(data);
        } else {
          setError(data.error || "Failed to load posts");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (postId: string) => {
    router.push(`/admin/posts/${postId}`);
  };

  // Group posts by month
  const postsByMonth = posts.reduce((acc, post) => {
    if (!acc[post.month]) {
      acc[post.month] = [];
    }
    acc[post.month].push(post);
    return acc;
  }, {} as Record<number, Post[]>);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          {pageTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {posts.length} total posts
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && posts.length === 0 && (
        <Typography variant="body1" color="text.secondary">
          No posts yet.
        </Typography>
      )}

      {!loading &&
        !error &&
        Object.entries(postsByMonth)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([month, monthPosts]) => (
            <Box key={month} sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5" component="h2">
                  Month {month}
                </Typography>
                <Button
                  href={`/admin/${month}`}
                  variant="outlined"
                  size="small"
                >
                  View Month
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {monthPosts.map((post) => (
                <Card
                  key={post.id}
                  sx={{
                    mb: 2,
                    cursor: "pointer",
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handlePostClick(post.id)}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Chip
                        label={post.type}
                        size="small"
                        color={post.published ? "success" : "default"}
                      />
                      {post.published ? (
                        <Chip label="Published" size="small" color="success" />
                      ) : (
                        <Chip label="Draft" size="small" />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Order: {post.order}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 1, fontWeight: "medium" }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {post.type === "text" || post.type === "stat"
                        ? post.content
                          ? post.content.substring(0, 100) + (post.content.length > 100 ? "..." : "")
                          : ""
                        : post.content}
                    </Typography>
                    {post.caption && (
                      <Typography variant="caption" color="text.secondary">
                        Caption: {post.caption}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      Created: {new Date(post.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ))}
    </Container>
  );
}
