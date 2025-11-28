"use client";

import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography as MuiTypography,
  Chip,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { FileMetadata, PostType } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "@/hooks/usePageTitle";
import Image from "next/image";

const HIDE_TITLE_TAG = "Hide Title";
const MEDIA_TAG_OPTIONS = [
  "Carousel 1",
  "Carousel 2",
  "Carousel 3",
  "Carousel 4",
  "Carousel 5",
  "Carousel 6",
];
const MEDIA_AND_HIDE_TAGS = [...MEDIA_TAG_OPTIONS, HIDE_TITLE_TAG];
const TEXT_TAG_OPTIONS = [HIDE_TITLE_TAG];

const getAllowedTags = (postType: PostType | "") => {
  if (postType === "text") {
    return TEXT_TAG_OPTIONS;
  }
  if (postType === "photo" || postType === "video") {
    return MEDIA_AND_HIDE_TAGS;
  }
  return [];
};

export default function Upload() {
  // create a piece of state called type. Initially "photo", can later become one of the PostType values. setType is the function to update it.
  const searchParams = useSearchParams();
  const prefillMonth = searchParams.get("month");

  const [type, setType] = useState<PostType | "">("photo");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // Create a state value called file, which starts as null. Later when the user selects a file, store the actual File object here and use setFile() to update it.
  const [file, setFile] = useState<File | null>(null);
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [albumCoverPreviewUrl, setAlbumCoverPreviewUrl] = useState<
    string | null
  >(null);
  const [caption, setCaption] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [order, setOrder] = useState<number | "">(0);
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [dateTaken, setDateTaken] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const pageTitle = "Upload Post";
  usePageTitle(pageTitle);

  const isTextType = type === "text" || type === "stat";
  const isMediaType = type === "audio" || type === "video" || type === "photo";
  const tagOptions = getAllowedTags(type);
  const shouldShowTags = tagOptions.length > 0;

  useEffect(() => {
    if (prefillMonth === null || prefillMonth === "") {
      return;
    }

    const parsedMonth = Number(prefillMonth);
    if (Number.isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 12) {
      return;
    }

    setMonth((prev) => {
      if (prev !== "") {
        return prev;
      }
      return parsedMonth;
    });
  }, [prefillMonth]);

  //This is a function to handle changes on a file <input>. React will pass it an event object called e
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setContent(""); // Clear text content when file is selected

      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(previewUrl);
    }
  };

  const handleAlbumCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setAlbumCoverFile(selectedFile);

      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setAlbumCoverPreviewUrl(previewUrl);
    }
  };

  // Clean up preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      if (albumCoverPreviewUrl) {
        URL.revokeObjectURL(albumCoverPreviewUrl);
      }
    };
  }, [filePreviewUrl, albumCoverPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent page reload
    setError(""); // clear previous errors
    setSuccess(""); // clear previous success messages
    setLoading(true); // show loading state

    try {
      let finalContent = content;
      let fileMetadata: FileMetadata | undefined;

      // Handle file upload for media types
      if (isMediaType && file) {
        // Upload the file first to get the path
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("type", type);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          setError(uploadData.error || "Failed to upload file");
          setLoading(false);
          return;
        }

        // Ensure we got a valid path
        if (!uploadData.path) {
          setError("File upload succeeded but no path was returned");
          setLoading(false);
          return;
        }

        // Use the path returned from the upload API
        finalContent = uploadData.path;

        // Capture metadata if available
        if (uploadData.metadata) {
          fileMetadata = uploadData.metadata;
        }

        // Override with manually entered dateTaken if provided (videos only on upload)
        if (dateTaken && type === "video") {
          fileMetadata = {
            ...(fileMetadata || {}),
            dateTaken: new Date(dateTaken).toISOString(),
          };
        }

        // Optional album cover upload for audio posts
        if (type === "audio" && albumCoverFile) {
          const coverFormData = new FormData();
          coverFormData.append("file", albumCoverFile);
          coverFormData.append("type", "photo");

          const coverResponse = await fetch("/api/upload", {
            method: "POST",
            body: coverFormData,
          });

          const coverData = await coverResponse.json();
          if (!coverResponse.ok || !coverData.path) {
            setError(coverData.error || "Failed to upload album cover");
            setLoading(false);
            return;
          }

          fileMetadata = {
            ...(fileMetadata || {}),
            albumCoverUrl: coverData.path,
            albumCoverDimensions: coverData.metadata?.dimensions,
          };
        }
      }

      // Validate required fields
      if (!type) {
        setError("Please select a post type");
        setLoading(false);
        return;
      }

      if (!title.trim()) {
        setError("Please enter a title");
        setLoading(false);
        return;
      }

      if (isTextType && !content.trim()) {
        setError("Please enter content");
        setLoading(false);
        return;
      }

      if (isMediaType && !file) {
        setError("Please select a file");
        setLoading(false);
        return;
      }

      // Add validation for media types to ensure finalContent is set
      if (isMediaType && !finalContent) {
        setError("File upload failed or no file path was returned");
        setLoading(false);
        return;
      }

      if (month === "" || month < 0) {
        setError("Please enter a valid month (0-12)");
        setLoading(false);
        return;
      }

      // Submit to API
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          month: Number(month),
          content: finalContent,
          caption:
            (type === "photo" || type === "audio") && caption.trim()
              ? caption.trim()
              : undefined,
          published,
          order: order ? Number(order) : 0,
          metadata: fileMetadata, // Include file metadata if available
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Post created successfully!");
        // Store values to persist
        const persistedMonth = month;
        const persistedOrder = order;
        const persistedTags = [...tags];
        // Reset form (but keep order, month, and tags)
        setType("photo");
        setTitle("");
        setContent("");
        setFile(null);
        setCaption("");
        setMonth(persistedMonth);
        setOrder(persistedOrder);
        setPublished(false);
        setTags(persistedTags);
        setAlbumCoverFile(null);
        setDateTaken("");
        // Clean up preview URLs
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
          setFilePreviewUrl(null);
        }
        if (albumCoverPreviewUrl) {
          URL.revokeObjectURL(albumCoverPreviewUrl);
          setAlbumCoverPreviewUrl(null);
        }
        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        const coverInput = document.getElementById(
          "album-cover-input"
        ) as HTMLInputElement;
        if (coverInput) coverInput.value = "";
      } else {
        setError(data.error || "Failed to create post");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            {pageTitle}
          </Typography>
          <form onSubmit={handleSubmit}>
            {/* Type Selector */}
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel id="type-label">Post Type</InputLabel>
              <Select
                labelId="type-label"
                id="type-select"
                value={type}
                label="Post Type"
                onChange={(e) => {
                  const nextType = e.target.value as PostType;
                  setType(nextType);
                  setContent("");
                  setFile(null);
                  setAlbumCoverFile(null);
                  setCaption("");
                  setTags((prev) =>
                    prev.filter((tag) => getAllowedTags(nextType).includes(tag))
                  );
                  const fileInput = document.getElementById(
                    "file-input"
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="photo">Photo</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="stat">Stat</MenuItem>
              </Select>
            </FormControl>

            {/* Title Field */}
            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
              placeholder="Enter a title for this post"
            />

            {/* Conditional Input */}
            {isTextType && (
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter your text content here..."
              />
            )}

            {isMediaType && (
              <Box sx={{ mb: 2 }}>
                <input
                  accept={
                    type === "photo"
                      ? "image/*"
                      : type === "audio"
                      ? "audio/*"
                      : "video/*"
                  }
                  style={{ display: "none" }}
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-input">
                  <Button variant="outlined" component="span" fullWidth>
                    {file ? file.name : `Choose ${type} file`}
                  </Button>
                </label>
                {file && (
                  <Box sx={{ mt: 2 }}>
                    <MuiTypography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </MuiTypography>
                    {filePreviewUrl && (
                      <Box sx={{ mt: 2 }}>
                        {type === "photo" && (
                          <>
                            {file.name.toLowerCase().endsWith(".heic") ||
                            file.name.toLowerCase().endsWith(".heif") ||
                            file.type === "image/heic" ||
                            file.type === "image/heif" ? (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                HEIC files will be converted to JPEG on upload.
                                Preview not available in browser.
                              </Alert>
                            ) : (
                              <Box
                                sx={{
                                  position: "relative",
                                  width: "100%",
                                  maxWidth: "400px",
                                  height: "auto",
                                  borderRadius: 1,
                                  overflow: "hidden",
                                }}
                              >
                                <Image
                                  src={filePreviewUrl}
                                  alt="Preview"
                                  width={400}
                                  height={300}
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    objectFit: "contain",
                                  }}
                                  unoptimized
                                  onError={() => {
                                    // If image fails to load, show message
                                    console.warn("Failed to load preview");
                                  }}
                                />
                              </Box>
                            )}
                          </>
                        )}
                        {type === "video" && (
                          <Box
                            component="video"
                            src={filePreviewUrl}
                            controls
                            style={{
                              width: "100%",
                              maxWidth: "600px",
                              height: "auto",
                              borderRadius: 4,
                            }}
                          />
                        )}
                        {type === "audio" && (
                          <Box
                            component="audio"
                            src={filePreviewUrl}
                            controls
                            style={{
                              width: "100%",
                              maxWidth: "600px",
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Caption field for photos & audio */}
            {(type === "photo" || type === "audio") && (
              <TextField
                fullWidth
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter a caption (optional)"
              />
            )}

            {/* Date Taken field for videos only */}
            {type === "video" && (
              <TextField
                fullWidth
                type="date"
                label="Capture Date"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                sx={{ mb: 2 }}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                helperText="Optional: Manually set the capture date. Leave empty to use metadata from file."
              />
            )}

            {type === "audio" && (
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="album-cover-input"
                  type="file"
                  onChange={handleAlbumCoverChange}
                />
                <label htmlFor="album-cover-input">
                  <Button variant="outlined" component="span" fullWidth>
                    {albumCoverFile
                      ? `Album Cover: ${albumCoverFile.name}`
                      : "Choose optional album cover image"}
                  </Button>
                </label>
                {albumCoverFile && (
                  <Box sx={{ mt: 2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <MuiTypography variant="body2" color="text.secondary">
                        {albumCoverFile.name} (
                        {(albumCoverFile.size / 1024).toFixed(2)} KB)
                      </MuiTypography>
                      <Button
                        size="small"
                        onClick={() => {
                          if (albumCoverPreviewUrl) {
                            URL.revokeObjectURL(albumCoverPreviewUrl);
                          }
                          setAlbumCoverFile(null);
                          setAlbumCoverPreviewUrl(null);
                          const coverInput = document.getElementById(
                            "album-cover-input"
                          ) as HTMLInputElement;
                          if (coverInput) coverInput.value = "";
                        }}
                      >
                        Remove
                      </Button>
                    </Stack>
                    {albumCoverPreviewUrl && (
                      <Box
                        sx={{
                          position: "relative",
                          width: 200,
                          height: 200,
                          borderRadius: 2,
                          overflow: "hidden",
                          mt: 1,
                        }}
                      >
                        <Image
                          src={albumCoverPreviewUrl}
                          alt="Album cover preview"
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Month Selector */}
            <TextField
              fullWidth
              type="number"
              label="Month"
              value={month}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setMonth(val);
              }}
              slotProps={{ htmlInput: { min: 0, max: 12 } }}
              sx={{ mb: 2 }}
              helperText="Enter a number between 0 and 12"
            />

            {/* Order Field */}
            <TextField
              fullWidth
              type="number"
              label="Order"
              value={order}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setOrder(val);
              }}
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ mb: 2 }}
              helperText="Lower numbers appear first (default: 0)"
            />

            {/* Tags */}
            {shouldShowTags && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {tagOptions.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => {
                        if (tags.includes(tag)) {
                          setTags(tags.filter((t) => t !== tag));
                        } else {
                          setTags([...tags, tag]);
                        }
                      }}
                      color={tags.includes(tag) ? "primary" : "default"}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>
                {tags.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Selected: {tags.join(", ")}
                  </Typography>
                )}
              </Box>
            )}

            {/* Publish Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
              }
              label="Publish immediately"
              sx={{ mb: 2 }}
            />

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !type || !title.trim()}
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              {loading ? "Submitting..." : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
