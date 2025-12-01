"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#F27E6B", // accent.blush
      light: "#6c7989",
      dark: "#465362",
    },
    secondary: {
      main: "#82A3A1",
      light: "#b6c9c7",
      dark: "#AB775C",
    },
    background: {
      default: "#FFFAF3", // neutral[200]
      paper: "#FFFFFF", // neutral[100]
      card: "#FFFAF3", // neutral[200]
      surface: "#FEF8ED", // neutral[400]
    },
    text: {
      primary: "#161424", // neutral[900]
      secondary: "#575365", // neutral[700]
    },
    neutral: {
      50: "#FFFFFF",
      100: "#FFFFFF",
      200: "#FFFAF3",
      400: "#FEF8ED",
      700: "#575365",
      900: "#161424",
    },
    accent: {
      darkGreen: "#9FC490",
      lightGreen: "#C0DFA1",
      blush: "#F27E6B",
      blushLight: "#ffc9c1",
      blueLight: "#aec6cf69",
      greenLight: "#b2d8b266",
    },
  },
  typography: {
    // Default font family (for body text)
    fontFamily: "var(--font-eczar), sans-serif",

    // Headers - using DM Serif Display
    h1: {
      fontFamily: "var(--font-dm-serif-display), serif",
      fontWeight: 400,
      fontSize: "3rem",
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
      fontFamily: "var(--font-dm-serif-display), serif",
      fontWeight: 400,
      fontSize: "1.25rem",
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: "var(--font-homemade-apple), sans-serif",
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: 1.75,
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
      styleOverrides: {
        containedPrimary: {
          color: "#fff",
          "&:hover": {
            backgroundColor: "#D76A58",
          },
        },
      },
      variants: [
        {
          props: { variant: "primary" },
          style: ({ theme }) => ({
            backgroundColor: theme.palette.accent?.blush || "#F27E6B",
            color: "#fff",
            padding: "10px 24px",
            fontFamily: "var(--font-lora), serif",
            fontSize: "1rem",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            "&:hover": {
              backgroundColor: "#D76A58",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            },
          }),
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
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
