"use client";

import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Stack,
  Divider,
} from "@mui/material";
import { usePageTitle } from "@/hooks/usePageTitle";

const months = [
  { num: 0, name: "Month Zero" },
  { num: 1, name: "Month One" },
  { num: 2, name: "Month Two" },
  { num: 3, name: "Month Three" },
  { num: 4, name: "Month Four" },
  { num: 5, name: "Month Five" },
  { num: 6, name: "Month Six" },
  { num: 7, name: "Month Seven" },
  { num: 8, name: "Month Eight" },
  { num: 9, name: "Month Nine" },
  { num: 10, name: "Month Ten" },
  { num: 11, name: "Month Eleven" },
  { num: 12, name: "Month Twelve" },
];

export default function AdminIndex() {
  const pageTitle = "Admin Dashboard";
  usePageTitle(pageTitle);
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h3" component="h1" gutterBottom>
            {pageTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Navigation hub for all pages on the site
          </Typography>

          <Divider sx={{ my: 4 }} />

          {/* Main Pages */}
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Main Pages
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            <Button href="/" variant="contained">
              Home
            </Button>
            <Button href="/upload" variant="contained">
              Upload Post
            </Button>
            <Button href="/login" variant="outlined">
              Login
            </Button>
          </Stack>

          <Divider sx={{ my: 4 }} />

          {/* Admin Pages */}
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Admin Pages
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Button
              href="/admin/all"
              variant="contained"
              size="large"
              sx={{ mb: 2 }}
            >
              All Posts
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Admin by Month
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 4,
            }}
          >
            {months.map((month) => (
              <Button
                key={month.num}
                href={`/admin/${month.num}`}
                variant="outlined"
                fullWidth
                size="small"
              >
                {month.name}
              </Button>
            ))}
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Public Month Pages */}
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Public Month Pages
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 4,
            }}
          >
            {months.map((month) => (
              <Button
                key={month.num}
                href={`/month/${month.num}`}
                variant="outlined"
                fullWidth
                size="small"
              >
                {month.name}
              </Button>
            ))}
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* API Endpoints */}
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2 }}>
            API Endpoints
          </Typography>
          <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>GET</strong> /api/posts?month={`{number}`} - Get published
              posts for a month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>POST</strong> /api/posts - Create a new post
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>GET</strong> /api/posts/admin?month={`{number}`} - Get all
              posts (published + unpublished) for a month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>GET</strong> /api/posts/admin?month=all - Get all posts in
              the system
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>GET</strong> /api/posts/{`{id}`} - Get a specific post
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>PATCH</strong> /api/posts/{`{id}`} - Update a post
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>DELETE</strong> /api/posts/{`{id}`} - Delete a post
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>POST</strong> /api/upload - Upload a media file
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>POST</strong> /api/auth - Authenticate
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
