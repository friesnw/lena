"use client";

import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { FileMetadata, Post, PostType } from "@/lib/types";
import Image from "next/image";
import { usePageTitle } from "@/hooks/usePageTitle";

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
  "bonus funnies",
];
const MEDIA_AND_HIDE_TAGS = [...MEDIA_TAG_OPTIONS, HIDE_TITLE_TAG];
const TEXT_TAG_OPTIONS = [HIDE_TITLE_TAG];

const getAllowedTags = (postType: PostType) => {
  if (postType === "text") {
    return TEXT_TAG_OPTIONS;
  }
  if (postType === "photo" || postType === "video") {
    return MEDIA_AND_HIDE_TAGS;
  }
  return [];
};

export default function EditPost() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [type, setType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState<number>(0);
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [order, setOrder] = useState<number>(0);
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFilePreviewUrl, setMediaFilePreviewUrl] = useState<string | null>(
    null
  );
  const [albumCoverPreviewUrl, setAlbumCoverPreviewUrl] = useState<
    string | null
  >(null);
  const [dateTaken, setDateTaken] = useState<string>("");
  const pageTitle = "Edit Post";
  usePageTitle(pageTitle);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (mediaFilePreviewUrl) {
        URL.revokeObjectURL(mediaFilePreviewUrl);
      }
      if (albumCoverPreviewUrl) {
        URL.revokeObjectURL(albumCoverPreviewUrl);
      }
    };
  }, [mediaFilePreviewUrl, albumCoverPreviewUrl]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const response = await fetch(`/api/posts/${postId}?_t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const data = await response.json();

        if (response.ok) {
          setPost(data);
          setType(data.type);
          setTitle(data.title || "");
          setMonth(data.month);
          setContent(data.content);
          setCaption(data.caption || "");
          setPublished(data.published);
          setOrder(data.order);
          setTags(
            (data.tags || [])
              .map((tag: string) => tag.trim())
              .filter((tag: string) => getAllowedTags(data.type).includes(tag))
          );
          // Load dateTaken if available, convert to date format
          if (data.metadata?.dateTaken) {
            // Extract just the date part (YYYY-MM-DD) from ISO string
            // This avoids timezone conversion issues
            const dateStr = data.metadata.dateTaken;
            const dateOnly = dateStr.slice(0, 10);
            setDateTaken(dateOnly);
          }
        } else {
          setError(data.error || "Failed to load post");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      let metadataToSave: FileMetadata | undefined = post?.metadata;
      let finalContent = content;
      const isMediaType =
        type === "audio" || type === "video" || type === "photo";

      // Upload new media file if one was selected
      if (isMediaType && mediaFile) {
        // Validate file size (11MB limit)
        const MAX_FILE_SIZE = 11 * 1024 * 1024; // 11MB
        if (mediaFile.size > MAX_FILE_SIZE) {
          setError(
            `File size exceeds maximum allowed size of ${
              MAX_FILE_SIZE / (1024 * 1024)
            }MB`
          );
          setSaving(false);
          return;
        }

        // Check if file is HEIC/HEIF (needs server-side conversion)
        const isHeic =
          mediaFile.type === "image/heic" ||
          mediaFile.type === "image/heif" ||
          mediaFile.name.toLowerCase().endsWith(".heic") ||
          mediaFile.name.toLowerCase().endsWith(".heif");

        let uploadedPath: string;
        let extractedMetadata: any = {};

        if (isHeic && type === "photo") {
          // HEIC files need server-side conversion
          const convertFormData = new FormData();
          convertFormData.append("file", mediaFile);

          const convertResponse = await fetch("/api/convert-heic", {
            method: "POST",
            body: convertFormData,
          });

          const convertData = await convertResponse.json();

          if (!convertResponse.ok) {
            setError(convertData.error || "Failed to convert HEIC file");
            setSaving(false);
            return;
          }

          uploadedPath = convertData.path;

          // Extract metadata from converted file
          extractedMetadata = {
            dateTaken: new Date(mediaFile.lastModified).toISOString(),
            dateCreated: new Date(mediaFile.lastModified).toISOString(),
            dateModified: new Date(mediaFile.lastModified).toISOString(),
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
                fileName: mediaFile.name,
                fileType: type,
                contentType: mediaFile.type,
                fileSize: mediaFile.size,
              }),
            });

            const presignedData = await presignedResponse.json();

            if (!presignedResponse.ok) {
              setError(presignedData.error || "Failed to get upload URL");
              setSaving(false);
              return;
            }

            // Step 2: Upload directly to S3
            const uploadResponse = await fetch(presignedData.url, {
              method: "PUT",
              body: mediaFile,
              headers: {
                "Content-Type": mediaFile.type,
              },
            });

            if (!uploadResponse.ok) {
              setError("Failed to upload file to S3");
              setSaving(false);
              return;
            }

            // Step 3: Construct the final S3 URL
            const mediaBaseUrl =
              process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
              "https://letters-for-lena-media.s3.us-east-2.amazonaws.com";
            uploadedPath = `${mediaBaseUrl}/${presignedData.key}`;

            // Step 4: Extract metadata
            const metadataFormData = new FormData();
            metadataFormData.append("file", mediaFile);
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
                dateTaken: new Date(mediaFile.lastModified).toISOString(),
                dateCreated: new Date(mediaFile.lastModified).toISOString(),
                dateModified: new Date(mediaFile.lastModified).toISOString(),
              };
            }
          } catch (uploadError) {
            console.error("Upload error:", uploadError);
            setError("Failed to upload file. Please try again.");
            setSaving(false);
            return;
          }
        }

        finalContent = uploadedPath;
        // Merge in any new metadata from the upload
        if (extractedMetadata && Object.keys(extractedMetadata).length > 0) {
          metadataToSave = {
            ...(metadataToSave || {}),
            ...extractedMetadata,
          };
        }
      }

      // Upload album cover if one was selected
      if (type === "audio" && albumCoverFile) {
        // Validate album cover size
        const MAX_FILE_SIZE = 11 * 1024 * 1024; // 11MB
        if (albumCoverFile.size > MAX_FILE_SIZE) {
          setError(
            `Album cover size exceeds maximum allowed size of ${
              MAX_FILE_SIZE / (1024 * 1024)
            }MB`
          );
          setSaving(false);
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
            setError(coverConvertData.error || "Failed to convert album cover");
            setSaving(false);
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
              coverPresignedData.error || "Failed to get album cover upload URL"
            );
            setSaving(false);
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
            setSaving(false);
            return;
          }

          const mediaBaseUrl =
            process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
            "https://letters-for-lena-media.s3.us-east-2.amazonaws.com";
          coverPath = `${mediaBaseUrl}/${coverPresignedData.key}`;
        }

        metadataToSave = {
          ...(metadataToSave || {}),
          albumCoverUrl: coverPath,
        };
      }

      // Override with manually entered dateTaken if provided
      if (dateTaken && (type === "photo" || type === "video")) {
        // Treat date as date-only (no time), create UTC midnight to avoid timezone shifts
        // dateTaken is in YYYY-MM-DD format from the date input
        metadataToSave = {
          ...(metadataToSave || {}),
          dateTaken: `${dateTaken}T00:00:00.000Z`,
        };
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          month,
          content: finalContent,
          caption: caption.trim() || undefined,
          published,
          order,
          tags: tags.map((tag) => tag.trim()),
          metadata: metadataToSave,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Post updated successfully!");
        setPost(data);
        // Update form state to match the saved post
        setType(data.type);
        setTitle(data.title || "");
        setMonth(data.month);
        setContent(data.content);
        setCaption(data.caption || "");
        setPublished(data.published);
        setOrder(data.order);
        setTags(
          (data.tags || [])
            .map((tag: string) => tag.trim())
            .filter((tag: string) => getAllowedTags(data.type).includes(tag))
        );
        // Clean up preview URLs
        if (mediaFilePreviewUrl) {
          URL.revokeObjectURL(mediaFilePreviewUrl);
          setMediaFilePreviewUrl(null);
        }
        if (albumCoverPreviewUrl) {
          URL.revokeObjectURL(albumCoverPreviewUrl);
          setAlbumCoverPreviewUrl(null);
        }
        setMediaFile(null);
        setAlbumCoverFile(null);
        // Reset file inputs
        const mediaInput = document.getElementById(
          "media-file-input"
        ) as HTMLInputElement;
        if (mediaInput) mediaInput.value = "";
        const coverInput = document.getElementById(
          "album-cover-input"
        ) as HTMLInputElement;
        if (coverInput) coverInput.value = "";
        // Invalidate Next.js router cache and refresh to ensure all pages see updated data
        router.refresh();
      } else {
        setError(data.error || "Failed to update post");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (response.ok) {
        router.push(`/admin/${month}`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete post");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  const isTextType = type === "text" || type === "stat";
  const isMediaType = type === "audio" || type === "video" || type === "photo";
  const tagOptions = getAllowedTags(type);
  const shouldShowTags = tagOptions.length > 0;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Post not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {pageTitle}
      </Typography>

      <Card>
        <CardContent>
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
                  setTags((prev) =>
                    prev.filter((tag) => getAllowedTags(nextType).includes(tag))
                  );
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
            />

            {/* Content Display/Edit */}
            {isTextType && (
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            {isMediaType && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Current file: {content}
                </Typography>
                {type === "photo" && content && (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "400px",
                      height: "auto",
                      mb: 2,
                    }}
                  >
                    <Image
                      src={content}
                      alt={caption || "Photo"}
                      width={400}
                      height={300}
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                      }}
                      unoptimized
                    />
                  </Box>
                )}
                {type === "audio" && content && (
                  <audio controls style={{ width: "100%", maxWidth: "600px" }}>
                    <source src={content} />
                  </audio>
                )}
                {type === "video" && content && (
                  <video
                    controls
                    style={{ width: "100%", maxWidth: "600px", height: "auto" }}
                  >
                    <source src={content} />
                  </video>
                )}
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
                    id="media-file-input"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const selectedFile = e.target.files[0];
                        setMediaFile(selectedFile);
                        // Clean up old preview URL
                        if (mediaFilePreviewUrl) {
                          URL.revokeObjectURL(mediaFilePreviewUrl);
                        }
                        // Create new preview URL
                        const previewUrl = URL.createObjectURL(selectedFile);
                        setMediaFilePreviewUrl(previewUrl);
                      }
                    }}
                  />
                  <label htmlFor="media-file-input">
                    <Button variant="outlined" component="span" fullWidth>
                      {mediaFile
                        ? `Replace with: ${mediaFile.name}`
                        : "Replace file"}
                    </Button>
                  </label>
                  {mediaFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        New file: {mediaFile.name} (
                        {(mediaFile.size / 1024).toFixed(2)} KB)
                      </Typography>
                      {mediaFilePreviewUrl && (
                        <Box sx={{ mt: 2 }}>
                          {type === "photo" && (
                            <>
                              {mediaFile.name.toLowerCase().endsWith(".heic") ||
                              mediaFile.name.toLowerCase().endsWith(".heif") ||
                              mediaFile.type === "image/heic" ||
                              mediaFile.type === "image/heif" ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                  HEIC files will be converted to JPEG on
                                  upload. Preview not available in browser.
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
                                    src={mediaFilePreviewUrl}
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
                              src={mediaFilePreviewUrl}
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
                              src={mediaFilePreviewUrl}
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
                <TextField
                  fullWidth
                  label="File Path"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  helperText="Or manually update the file path"
                />
              </Box>
            )}

            {/* Caption for photos & audio */}
            {(type === "photo" || type === "audio") && (
              <TextField
                fullWidth
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            {/* Date Taken field for photos & videos */}
            {(type === "photo" || type === "video") && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Capture Date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  helperText="Set the capture date for this media"
                />
                {post.metadata?.dateTaken && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Current:{" "}
                    {new Date(post.metadata.dateTaken).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            )}

            {type === "audio" && (
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="album-cover-input"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const selectedFile = e.target.files[0];
                      setAlbumCoverFile(selectedFile);
                      // Clean up old preview URL
                      if (albumCoverPreviewUrl) {
                        URL.revokeObjectURL(albumCoverPreviewUrl);
                      }
                      // Create new preview URL
                      const previewUrl = URL.createObjectURL(selectedFile);
                      setAlbumCoverPreviewUrl(previewUrl);
                    }
                  }}
                />
                <label htmlFor="album-cover-input">
                  <Button variant="outlined" component="span">
                    {albumCoverFile
                      ? `Album Cover: ${albumCoverFile.name}`
                      : post.metadata?.albumCoverUrl
                      ? "Replace album cover"
                      : "Upload album cover"}
                  </Button>
                </label>
                {albumCoverFile && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      New album cover: {albumCoverFile.name} (
                      {(albumCoverFile.size / 1024).toFixed(2)} KB)
                    </Typography>
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
                {!albumCoverFile && post.metadata?.albumCoverUrl && (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Current album cover:
                    </Typography>
                    <Box
                      sx={{
                        position: "relative",
                        width: 200,
                        height: 200,
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={post.metadata.albumCoverUrl}
                        alt={post.title || "Album cover"}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Month */}
            <TextField
              fullWidth
              type="number"
              label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, max: 12 } }}
              sx={{ mb: 2 }}
            />

            {/* Order */}
            <TextField
              fullWidth
              type="number"
              label="Order"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ mb: 2 }}
            />
            {/* Tags */}
            {shouldShowTags && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {tagOptions.map((tag) => {
                    const isSelected = tags.some(
                      (t) => t.trim() === tag.trim()
                    );
                    return (
                      <Chip
                        key={tag}
                        label={tag}
                        onClick={() => {
                          if (isSelected) {
                            setTags(
                              tags.filter((t) => t.trim() !== tag.trim())
                            );
                          } else {
                            setTags([...tags, tag]);
                          }
                        }}
                        color={isSelected ? "primary" : "default"}
                        sx={{ cursor: "pointer" }}
                      />
                    );
                  })}
                </Box>
                {tags.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Selected: {tags.join(", ")}
                  </Typography>
                )}
              </Box>
            )}
            {/* Published */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
              }
              label="Published"
              sx={{ mb: 2 }}
            />

            {/* Error/Success */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                disabled={saving}
                variant="contained"
                sx={{ flex: 1 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  router.refresh();
                  router.push(`/admin/${month}`);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
