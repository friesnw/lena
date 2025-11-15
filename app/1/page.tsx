"use client";

import {
  Container,
  Typography,
  Card,
  CardContent,
} from "@mui/material";

export default function MonthOne() {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Month One
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Content for Month One
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

