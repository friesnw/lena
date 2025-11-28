"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useIntroSeen } from "@/hooks/useIntroSeen";
import { getDaysSinceOct15_2025 } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

const introPhoto = {
  src: "https://letters-for-lena-media.s3.us-east-2.amazonaws.com/uploads/c0e7b278-80da-4a08-ae28-7bebf55ed523.jpg",
  title: "My current view",
  dateTaken: "2025-10-15T12:00:00.000Z",
};

export default function IntroPage() {
  const router = useRouter();
  const { hasSeenIntro, markIntroSeen } = useIntroSeen();
  const pageTitle = "Welcome to Letters for Lena";
  usePageTitle(pageTitle);

  const introPhotoDay = getDaysSinceOct15_2025(introPhoto.dateTaken);

  const handleEnter = () => {
    markIntroSeen();
    router.replace("/");
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        {pageTitle}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
        Hi Lena! It’s your dad.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
        Welcome to your scrapbook. I’m not sure if you’re reading this, or if
        someone is reading it to you, but either way we’re glad you’re here.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
        This is a collection of memories and feelings about you and your family
        during the first year of your life.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
        It was made over the course of many of your nap times, usually with you
        sleeping on my chest or in my arms in very sweet ways.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={handleEnter}
        >
          Enter
        </Button>
      </Box>
      <Card sx={{ borderRadius: 4, boxShadow: 6 }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: "800px",
                height: "auto",
                margin: "0 auto",
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              }}
            >
              <Image
                src={introPhoto.src}
                alt={introPhoto.title}
                width={800}
                height={600}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                }}
                unoptimized
                priority
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mt: 2,
                mb: 1,
              }}
            >
              {introPhotoDay !== null && (
                <Typography variant="h6" fontWeight="medium">
                  Day {introPhotoDay}
                </Typography>
              )}
              <Box sx={{ textAlign: "right", maxWidth: "70%" }}>
                <Typography
                  variant="body2"
                  component="h3"
                  sx={{
                    fontWeight: "medium",
                  }}
                >
                  {introPhoto.title}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
