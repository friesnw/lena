"use client";

import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  TextField,
  Alert,
} from "@mui/material";

import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pageTitle = "Enter Password";
  usePageTitle(pageTitle);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page refresh
    setError(""); // Clear previous errors
    setLoading(true); // Show loading state

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Redirect to home
        window.location.href = "/";
      } else {
        // Error! Show error message
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              {pageTitle}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button type="submit" disabled={loading} variant="contained">
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
