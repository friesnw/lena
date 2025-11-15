"use client";

import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h1" component="h1" gutterBottom>
            Letters for Lena
          </Typography>
          <Typography variant="h3" color="text.secondary">
            A digital scrapbook
          </Typography>
          <Button href="/1" variant="primary" sx={{ mr: 2, mb: 2 }}>
            Month One
          </Button>
        </CardContent>
      </Card>
      {}
    </Container>
  );
}
