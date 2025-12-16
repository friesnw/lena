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
import { useEffect, useState, Suspense } from "react";
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
  "Carousel 7",
  "Carousel 8",
  "Carousel 9",
  "bonus funnies",
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

function UploadForm() {
  const searchParams = useSearchParams();
  const prefillMonth = searchParams.get("month");

  // create a piece of state called type. Initially "photo", can later become one of the PostType values. setType is the function to update it.

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
      const MAX_FILE_SIZE = 11 * 1024 * 1024; // 11MB

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(
          `File size (${(selectedFile.size / (1024 * 1024)).toFixed(
            2
          )}MB) exceeds maximum allowed size of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`
        );
        e.target.value = ""; // Clear the input
        return;
      }

      setFile(selectedFile);
      setContent(""); // Clear text content when file is selected
      setError(""); // Clear any previous errors

      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(previewUrl);
    }
  };

  const handleAlbumCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const MAX_FILE_SIZE = 11 * 1024 * 1024; // 11MB

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(
          `Album cover size (${(selectedFile.size / (1024 * 1024)).toFixed(
            2
          )}MB) exceeds maximum allowed size of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`
        );
        e.target.value = ""; // Clear the input
        return;
      }

      setAlbumCoverFile(selectedFile);
      setError(""); // Clear any previous errors

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
        // Validate file size (11MB limit)
        const MAX_FILE_SIZE = 11 * 1024 * 1024; // 11MB
        if (file.size > MAX_FILE_SIZE) {
          setError(
            `File size exceeds maximum allowed size of ${
              MAX_FILE_SIZE / (1024 * 1024)
            }MB`
          );
          setLoading(false);
          return;
        }

        // Check if file is HEIC/HEIF (needs server-side conversion)
        const isHeic =
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif");

        let uploadedPath: string;
        let extractedMetadata: any = {};

        if (isHeic && type === "photo") {
          // HEIC files need server-side conversion
          const convertFormData = new FormData();
          convertFormData.append("file", file);

          const convertResponse = await fetch("/api/convert-heic", {
            method: "POST",
            body: convertFormData,
          });

          const convertData = await convertResponse.json();

          if (!convertResponse.ok) {
            setError(convertData.error || "Failed to convert HEIC file");
            setLoading(false);
            return;
          }

          uploadedPath = convertData.path;

          // Extract metadata from converted file (optional, can use basic file metadata)
          extractedMetadata = {
            dateTaken: new Date(file.lastModified).toISOString(),
            dateCreated: new Date(file.lastModified).toISOString(),
            dateModified: new Date(file.lastModified).toISOString(),
          };
        } else {
          // Direct S3 upload for non-HEIC files
          try {
            // Step 1: Get presigned URL
            const presignedResponse = await fetch("/api/upload-url", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: file.name,
                fileType: type,
                contentType: file.type,
                fileSize: file.size,
              }),
            });

            const presignedData = await presignedResponse.json();

            if (!presignedResponse.ok) {
              setError(presignedData.error || "Failed to get upload URL");
              setLoading(false);
              return;
            }

            // Step 2: Upload directly to S3
            const uploadResponse = await fetch(presignedData.url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!uploadResponse.ok) {
              setError("Failed to upload file to S3");
              setLoading(false);
              return;
            }

            // Step 3: Construct the final S3 URL
            const mediaBaseUrl =
              process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
              "https://letters-for-lena-media.s3.us-east-2.amazonaws.com";
            uploadedPath = `${mediaBaseUrl}/${presignedData.key}`;

            // Step 4: Extract metadata
            const metadataFormData = new FormData();
            metadataFormData.append("file", file);
            metadataFormData.append("type", type);

            const metadataResponse = await fetch("/api/extract-metadata", {
              method: "POST",
              body: metadataFormData,
            });

            if (metadataResponse.ok) {
              const metadataData = await metadataResponse.json();
              if (metadataData.success && metadataData.metadata) {
                extractedMetadata = metadataData.metadata;
              }
            } else {
              // Fallback to basic file metadata if extraction fails
              extractedMetadata = {
                dateTaken: new Date(file.lastModified).toISOString(),
                dateCreated: new Date(file.lastModified).toISOString(),
                dateModified: new Date(file.lastModified).toISOString(),
              };
            }
          } catch (uploadError) {
            console.error("Upload error:", uploadError);
            setError("Failed to upload file. Please try again.");
            setLoading(false);
            return;
          }
        }

        // Use the uploaded path
        finalContent = uploadedPath;

        // Capture metadata
        fileMetadata = extractedMetadata;

        // Override with manually entered dateTaken if provided (videos only on upload)
        if (dateTaken && type === "video") {
          // Treat date as date-only (no time), create UTC midnight to avoid timezone shifts
          // dateTaken is in YYYY-MM-DD format from the date input
          fileMetadata = {
            ...fileMetadata,
            dateTaken: `${dateTaken}T00:00:00.000Z`,
          };
        }

        // Optional album cover upload for audio posts
        if (type === "audio" && albumCoverFile) {
          // Validate album cover size
          if (albumCoverFile.size > MAX_FILE_SIZE) {
            setError(
              `Album cover size exceeds maximum allowed size of ${
                MAX_FILE_SIZE / (1024 * 1024)
              }MB`
            );
            setLoading(false);
            return;
          }

          // Check if album cover is HEIC
          const isCoverHeic =
            albumCoverFile.type === "image/heic" ||
            albumCoverFile.type === "image/heif" ||
            albumCoverFile.name.toLowerCase().endsWith(".heic") ||
            albumCoverFile.name.toLowerCase().endsWith(".heif");

          let coverPath: string;

          if (isCoverHeic) {
            // Convert HEIC album cover
            const coverConvertFormData = new FormData();
            coverConvertFormData.append("file", albumCoverFile);

            const coverConvertResponse = await fetch("/api/convert-heic", {
              method: "POST",
              body: coverConvertFormData,
            });

            const coverConvertData = await coverConvertResponse.json();

            if (!coverConvertResponse.ok || !coverConvertData.path) {
              setError(
                coverConvertData.error || "Failed to convert album cover"
              );
              setLoading(false);
              return;
            }

            coverPath = coverConvertData.path;
          } else {
            // Direct S3 upload for album cover
            const coverPresignedResponse = await fetch("/api/upload-url", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: albumCoverFile.name,
                fileType: "photo",
                contentType: albumCoverFile.type,
                fileSize: albumCoverFile.size,
              }),
            });

            const coverPresignedData = await coverPresignedResponse.json();
            if (!coverPresignedResponse.ok || !coverPresignedData.url) {
              setError(
                coverPresignedData.error ||
                  "Failed to get album cover upload URL"
              );
              setLoading(false);
              return;
            }

            const coverUploadResponse = await fetch(coverPresignedData.url, {
              method: "PUT",
              body: albumCoverFile,
              headers: {
                "Content-Type": albumCoverFile.type,
              },
            });

            if (!coverUploadResponse.ok) {
              setError("Failed to upload album cover");
              setLoading(false);
              return;
            }

            const mediaBaseUrl =
              process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
              "https://letters-for-lena-media.s3.us-east-2.amazonaws.com";
            coverPath = `${mediaBaseUrl}/${coverPresignedData.key}`;
          }

          fileMetadata = {
            ...fileMetadata,
            albumCoverUrl: coverPath,
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
        cache: "no-store",
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
                      Selected: {file.name} (
                      {(file.size / (1024 * 1024)).toFixed(2)} MB / 11 MB max)
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
                        {(albumCoverFile.size / (1024 * 1024)).toFixed(2)} MB /
                        11 MB max)
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

export default function Upload() {
  const pageTitle = "Upload Post";
  usePageTitle(pageTitle);

  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                {pageTitle}
              </Typography>
              <Typography>Loading...</Typography>
            </CardContent>
          </Card>
        </Container>
      }
    >
      <UploadForm />
    </Suspense>
  );
}
