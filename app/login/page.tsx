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
  useTheme,
} from "@mui/material";

import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.primary.dark,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h2"
          component="h1"
          sx={{
            mb: 4,
            textAlign: "left",
            color: "#FFFFFF",
            fontFamily: "var(--font-dm-serif-display), serif",
            fontSize: "4rem",
          }}
        >
          Letters for Lena
        </Typography>
        <Typography
          variant="body1"
          component="h4"
          gutterBottom
          sx={{ color: "#FFFFFF" }}
        >
          This scrapbook is private. Please enter a password to continue.{" "}
        </Typography>

        <Card
          sx={{
            bgcolor: theme.palette.background.surface,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                type="password"
                label="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.dark,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    bgcolor: "#ffc9c1",
                    color: theme.palette.text.primary,
                    "& .MuiAlert-icon": {
                      color: "#F27E6B",
                    },
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                fullWidth
                sx={{
                  py: 1.5,
                  bgcolor: theme.palette.primary.main,
                  color: "#fff",
                  fontFamily: "var(--font-lora), serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  },
                  "&:disabled": {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
