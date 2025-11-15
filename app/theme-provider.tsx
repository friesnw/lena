"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    // Default font family (for body text)
    fontFamily: "var(--font-eczar), sans-serif",

    // Headers - using DM Serif Display
    h1: {
      fontFamily: "var(--font-dm-serif-display), serif",
      fontWeight: 400,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: "var(--font-lora), serif",
      fontWeight: 400,
      fontSize: "2rem",
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: "var(--font-lora), serif",
      fontWeight: 400,
      fontSize: "1.75rem",
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: "var(--font-lora), serif",
      fontWeight: 400,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: "var(--font-lora), serif",
      fontWeight: 400,
      fontSize: "1.25rem",
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: "var(--font-lora), serif",
      fontWeight: 400,
      fontSize: "1.125rem",
      lineHeight: 1.5,
    },

    body1: {
      fontFamily: "var(--font-eczar), sans-serif",
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    caption: {
      fontFamily: "var(--font-homemade-apple), sans-serif",
      fontWeight: 400,
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: "primary" },
          style: {
            backgroundColor: "#1976d2",
            color: "#fff",
            padding: "10px 24px",
            fontFamily: "var(--font-lora), serif",
            fontSize: "1rem",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            "&:hover": {
              backgroundColor: "#1565c0",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            },
          },
        },
        {
          props: { variant: "secondary" },
          style: {
            backgroundColor: "#dc004e",
            color: "#fff",
            padding: "10px 24px",
            fontSize: "1rem",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            "&:hover": {
              backgroundColor: "#c2003d",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            },
          },
        },
        {
          props: { variant: "link" },
          style: {
            backgroundColor: "transparent",
            color: "#1976d2",
            padding: "10px 16px",
            fontSize: "1rem",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "4px",
            boxShadow: "none",
            textDecoration: "underline",
            "&:hover": {
              backgroundColor: "transparent",
              color: "#1565c0",
              textDecoration: "underline",
              boxShadow: "none",
            },
          },
        },
      ],
    },
  },
});

export default function MUIThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
