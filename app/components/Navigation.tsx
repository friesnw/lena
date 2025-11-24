"use client";

import { useState } from "react";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  type Theme,
} from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { monthNavigation } from "@/lib/monthNavigation";

interface NavigationProps {
  variant?: "homepage" | "default";
}

export default function Navigation({ variant = "default" }: NavigationProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMonthPage = pathname.startsWith("/month/");

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLinkClick = () => {
    setDrawerOpen(false);
  };

  const drawerContent = (
    <Box
      sx={{
        width: 320,
        height: "100%",
        bgcolor: (theme) => theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontFamily: "var(--font-lora), serif",
            fontWeight: 700,
            color: (theme) => theme.palette.text.primary,
          }}
        >
          Navigation
        </Typography>
        <IconButton onClick={handleDrawerToggle} aria-label="close menu">
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ flexGrow: 1, pt: 2 }}>
        {monthNavigation.map((month) => (
          <ListItem key={month.month} disablePadding>
            <ListItemButton
              component={Link}
              href={`/month/${month.month}`}
              onClick={handleLinkClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                "&:hover": {
                  bgcolor: (theme) => theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  bgcolor: month.iconBgColor,
                  width: 48,
                  height: 48,
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
                      color: "#465362",
                    }}
                  >
                    {month.icon}
                  </Box>
                ) : (
                  <month.icon sx={{ fontSize: "1.5rem", color: "#465362" }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={month.title}
                secondary={month.description}
                primaryTypographyProps={{
                  fontWeight: 600,
                  color: "#465362",
                }}
                secondaryTypographyProps={{
                  color: "#627080",
                  fontSize: "0.875rem",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <ListItemButton
          component={Link}
          href="/intro"
          onClick={handleLinkClick}
          sx={{
            "&:hover": {
              bgcolor: (theme) => theme.palette.action.hover,
            },
          }}
        >
          <ListItemText
            primary="About This Scrapbook"
            primaryTypographyProps={{
              fontWeight: 500,
              sx: {
                color: (theme) => theme.palette.text.primary,
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: (theme) => theme.palette.primary.dark,
          boxShadow: variant === "homepage" ? 0 : 1,
          borderBottom: variant === "homepage" ? 0 : 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{
              color: (theme) => theme.palette.background.default,
              mr: 2,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            component={Link}
            href="/"
            sx={{
              color: "#FFFFFF",
              textDecoration: "none",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            Letters for Lena
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Spacer to prevent content from being hidden behind the fixed AppBar */}
      {variant !== "homepage" && <Toolbar />}

      {/* Sticky sidebar for desktop month pages */}
      {isDesktop && isMonthPage && (
        <Box
          sx={{
            position: "fixed",
            top: 64, // AppBar height
            left: 0,
            width: 320,
            height: "calc(100vh - 64px)",
            bgcolor: (theme) => theme.palette.background.default,
            display: "flex",
            flexDirection: "column",
            borderRight: 1,
            borderColor: "divider",
            zIndex: 1000,
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontFamily: "var(--font-lora), serif",
                fontWeight: 700,
                color: (theme) => theme.palette.text.primary,
              }}
            >
              Navigation
            </Typography>
          </Box>

          <List sx={{ flexGrow: 1, pt: 2 }}>
            {monthNavigation.map((month) => (
              <ListItem key={month.month} disablePadding>
                <ListItemButton
                  component={Link}
                  href={`/month/${month.month}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    "&:hover": {
                      bgcolor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 2,
                      bgcolor: month.iconBgColor,
                      width: 48,
                      height: 48,
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
                          color: "#465362",
                        }}
                      >
                        {month.icon}
                      </Box>
                    ) : (
                      <month.icon
                        sx={{ fontSize: "1.5rem", color: "#465362" }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={month.title}
                    secondary={month.description}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: "#465362",
                    }}
                    secondaryTypographyProps={{
                      color: "#627080",
                      fontSize: "0.875rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <ListItemButton
              component={Link}
              href="/intro"
              sx={{
                "&:hover": {
                  bgcolor: (theme) => theme.palette.action.hover,
                },
              }}
            >
              <ListItemText
                primary="About This Scrapbook"
                primaryTypographyProps={{
                  fontWeight: 500,
                  sx: {
                    color: (theme) => theme.palette.text.primary,
                  },
                }}
              />
            </ListItemButton>
          </Box>
        </Box>
      )}

      {/* Drawer for mobile or non-month pages */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
