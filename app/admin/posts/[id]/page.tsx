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
  const pageTitle = "Edit Post";
  usePageTitle(pageTitle);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
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
            (data.tags || []).filter((tag: string) =>
              getAllowedTags(data.type).includes(tag)
            )
          );
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
        const mediaFormData = new FormData();
        mediaFormData.append("file", mediaFile);
        mediaFormData.append("type", type);

        const mediaResponse = await fetch("/api/upload", {
          method: "POST",
          body: mediaFormData,
        });

        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok || !mediaData.path) {
          setError(mediaData.error || "Failed to upload new file");
          setSaving(false);
          return;
        }

        finalContent = mediaData.path;
        // Merge in any new metadata from the upload
        if (mediaData.metadata) {
          metadataToSave = {
            ...(metadataToSave || {}),
            ...mediaData.metadata,
          };
        }
      }

      // Upload album cover if one was selected
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
          setSaving(false);
          return;
        }

        metadataToSave = {
          ...(metadataToSave || {}),
          albumCoverUrl: coverData.path,
          albumCoverDimensions: coverData.metadata?.dimensions,
        };
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
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
          tags,
          metadata: metadataToSave,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Post updated successfully!");
        setPost(data);
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
        setTimeout(() => {
          router.push(`/admin/${month}`);
        }, 1500);
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
                        setMediaFile(e.target.files[0]);
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      New file: {mediaFile.name} (
                      {(mediaFile.size / 1024).toFixed(2)} KB)
                    </Typography>
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

            {type === "audio" && (
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="album-cover-input"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAlbumCoverFile(e.target.files[0]);
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {albumCoverFile.name} (
                    {(albumCoverFile.size / 1024).toFixed(2)} KB)
                  </Typography>
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
                onClick={() => router.push(`/admin/${month}`)}
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
