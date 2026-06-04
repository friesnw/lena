# Gallery Post Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `gallery` post type that groups 2–3 portrait photos into a single post with a zigzag offset stack layout and one shared caption.

**Architecture:** A gallery post is a single `Post` record with a new `images: GalleryImage[]` field. Photos always display in authored order; the feature photo gets the highest z-index wherever it sits. The `PostGallery` component renders the zigzag stack using flex column with negative margins. The upload form gains a multi-image picker with reorder and feature-toggle controls.

**Tech Stack:** Next.js 14 App Router · MUI v5 · TypeScript · AWS S3 presigned URLs · posts.json flat-file store

---

## File Map

| File | Change |
|------|--------|
| `lib/types.ts` | Add `GalleryImage`, add `"gallery"` to `PostType`, add `images?` to `Post` |
| `app/api/posts/route.ts` | Accept `"gallery"` type + `images` field in POST handler |
| `app/api/upload-url/route.ts` | Accept `"gallery"` as a valid `fileType` (same rules as `"photo"`) |
| `app/components/posts/PostGallery.tsx` | **New** — the zigzag display component |
| `app/components/PostDisplay.tsx` | Add `case "gallery"` that renders `<PostGallery>` |
| `app/upload/page.tsx` | Add gallery state, multi-image UI section, gallery submit branch |

---

## Task 1: Data types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add `GalleryImage` interface and extend `PostType` and `Post`**

Replace the contents of `lib/types.ts` with:

```typescript
export type PostType = "text" | "audio" | "video" | "photo" | "stat" | "carousel" | "gallery";

export interface GalleryImage {
  url: string;
  isFeature: boolean;
}

export interface FileMetadata {
  dateTaken?: string;
  dateCreated?: string;
  dateModified?: string;
  camera?: string;
  location?: { latitude?: number; longitude?: number };
  durationSeconds?: number;
  dimensions?: { width: number; height: number };
  albumCoverUrl?: string;
  albumCoverDimensions?: { width: number; height: number };
  fadeOutAt?: number;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  month: number;
  content?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: "admin" | "user" | undefined;
  published: boolean;
  order: number;
  metadata?: FileMetadata;
  tags?: string[];
  deleted?: boolean;
  images?: GalleryImage[];
}
```

- [ ] **Step 2: Verify TypeScript sees no new errors**

```bash
cd /Users/nickfries/Documents/Code/lena && npx tsc --noEmit 2>&1 | head -30
```

Expected: same errors as before (if any pre-existing ones), no new errors from the types change.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add GalleryImage type and gallery to PostType"
```

---

## Task 2: Accept gallery in the posts API

**Files:**
- Modify: `app/api/posts/route.ts` (lines 83–86, 99–115, 148–163)

- [ ] **Step 1: Add `"gallery"` to the valid types allowlist**

In `app/api/posts/route.ts`, find this line:
```typescript
if (!["text", "audio", "video", "photo", "stat", "carousel"].includes(type as string)) {
```
Change it to:
```typescript
if (!["text", "audio", "video", "photo", "stat", "carousel", "gallery"].includes(type as string)) {
```

- [ ] **Step 2: Accept `images` in the request body destructure**

Find the destructure block (around line 99):
```typescript
    const {
      type,
      title,
      month,
      content,
      caption,
      createdBy,
      published,
      order,
      metadata,
      tags,
    } = body as {
      type: Post["type"];
      title: string;
      month: number;
      content: string;
      caption?: string;
      createdBy?: Post["createdBy"];
      published?: boolean;
      order?: number;
      metadata?: FileMetadata;
      tags?: string[];
    };
```

Replace with:
```typescript
    const {
      type,
      title,
      month,
      content,
      caption,
      createdBy,
      published,
      order,
      metadata,
      tags,
      images,
    } = body as {
      type: Post["type"];
      title: string;
      month: number;
      content: string;
      caption?: string;
      createdBy?: Post["createdBy"];
      published?: boolean;
      order?: number;
      metadata?: FileMetadata;
      tags?: string[];
      images?: import("@/lib/types").GalleryImage[];
    };
```

- [ ] **Step 3: Include `images` in the saved Post object**

Find the `newPost` object construction (around line 148):
```typescript
    const newPost: Post = {
      id: uuidv4(),
      type,
      title: title?.trim() || "",
      month,
      content,
      caption: caption?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      createdBy,
      published: isPublished,
      order: normalizedOrder,
      metadata: metadata || undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
    };
```

Replace with:
```typescript
    const newPost: Post = {
      id: uuidv4(),
      type,
      title: title?.trim() || "",
      month,
      content,
      caption: caption?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      createdBy,
      published: isPublished,
      order: normalizedOrder,
      metadata: metadata || undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
      images: images && images.length > 0 ? images : undefined,
    };
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/posts/route.ts
git commit -m "feat: accept gallery type and images field in posts API"
```

---

## Task 3: Accept gallery in the upload-url API

**Files:**
- Modify: `app/api/upload-url/route.ts` (lines 79, 69)

- [ ] **Step 1: Add `"gallery"` to the valid fileType check**

In `app/api/upload-url/route.ts`, find:
```typescript
    if (!["photo", "audio", "video"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'photo', 'audio', or 'video'" },
        { status: 400 }
      );
    }
```

Replace with:
```typescript
    if (!["photo", "audio", "video", "gallery"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'photo', 'audio', 'video', or 'gallery'" },
        { status: 400 }
      );
    }
```

- [ ] **Step 2: Map `gallery` to `photo` limits for size and MIME validation**

Find:
```typescript
    const maxSize = MAX_FILE_SIZES[fileType as keyof typeof MAX_FILE_SIZES] ?? MAX_FILE_SIZES.photo;
```

Replace with:
```typescript
    const resolvedFileType = fileType === "gallery" ? "photo" : fileType;
    const maxSize = MAX_FILE_SIZES[resolvedFileType as keyof typeof MAX_FILE_SIZES] ?? MAX_FILE_SIZES.photo;
```

Then find the MIME check:
```typescript
    if (contentType) {
      const allowedMimeTypes =
        ALLOWED_MIME_TYPES[fileType as keyof typeof ALLOWED_MIME_TYPES];
      if (!allowedMimeTypes.includes(contentType)) {
```

Replace with:
```typescript
    if (contentType) {
      const allowedMimeTypes =
        ALLOWED_MIME_TYPES[resolvedFileType as keyof typeof ALLOWED_MIME_TYPES];
      if (!allowedMimeTypes.includes(contentType)) {
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/upload-url/route.ts
git commit -m "feat: accept gallery fileType in upload-url API"
```

---

## Task 4: PostGallery component

**Files:**
- Create: `app/components/posts/PostGallery.tsx`

- [ ] **Step 1: Create the component**

Create `app/components/posts/PostGallery.tsx`:

```tsx
"use client";

import Image from "next/image";
import { Box, Typography } from "@mui/material";
import type { Post } from "@/lib/types";
import { getDaysSinceOct15_2025 } from "@/lib/utils";

interface PostGalleryProps {
  post: Post;
}

// Per-index zigzag config: alternates left/right, feature is wider
const POSITIONS = [
  { alignSelf: "flex-start" as const, width: "58%" },
  { alignSelf: "flex-end"   as const, width: "56%" },
  { alignSelf: "flex-start" as const, width: "62%" },
];

const FEATURE_WIDTH_BOOST = "4%"; // feature card is this much wider than its base width
const OVERLAP_PX = -120; // negative marginTop — how much each card overlaps the previous

export default function PostGallery({ post }: PostGalleryProps) {
  const images = post.images ?? [];
  const daysSince = getDaysSinceOct15_2025(
    post.metadata?.dateTaken || post.createdAt
  );

  if (images.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Zigzag stack */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {images.map((img, i) => {
          const pos = POSITIONS[Math.min(i, POSITIONS.length - 1)];
          const isFirst = i === 0;
          const baseWidth = parseFloat(pos.width);
          const width = img.isFeature
            ? `${baseWidth + parseFloat(FEATURE_WIDTH_BOOST)}%`
            : pos.width;

          return (
            <Box
              key={img.url}
              sx={{
                alignSelf: pos.alignSelf,
                width,
                mt: isFirst ? 0 : `${OVERLAP_PX}px`,
                position: "relative",
                zIndex: img.isFeature ? 10 : i + 1,
              }}
            >
              {/* Matte card */}
              <Box
                sx={{
                  background: "#f9f6f2",
                  border: "1px solid #e2ddd7",
                  borderRadius: "6px",
                  boxShadow:
                    "0 8px 28px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)",
                  overflow: "hidden",
                  padding: "7px 7px 24px",
                }}
              >
                {/* Image container */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "3/4",
                    overflow: "hidden",
                    borderRadius: "4px",
                  }}
                >
                  <Image
                    src={img.url}
                    alt={post.caption || "Gallery photo"}
                    fill
                    style={{
                      objectFit: "cover",
                      filter:
                        "saturate(0.28) contrast(0.73) brightness(1.17)",
                    }}
                    unoptimized
                  />
                  {/* Grain overlay */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.1'/%3E%3C/svg%3E")`,
                      opacity: 0.5,
                      mixBlendMode: "multiply",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  {/* Vignette overlay */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(ellipse at center, transparent 50%, rgba(50,40,30,0.28) 100%)",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Day + Caption below the stack */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 2,
        }}
      >
        {daysSince !== null && (
          <Typography variant="h6" fontWeight="medium" sx={{ flexShrink: 0 }}>
            Day {daysSince}
          </Typography>
        )}
        {post.caption && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              textAlign: "right",
              maxWidth: "75%",
              ml: 2,
            }}
          >
            {post.caption}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/posts/PostGallery.tsx
git commit -m "feat: add PostGallery component with zigzag matte layout"
```

---

## Task 5: Wire PostGallery into PostDisplay

**Files:**
- Modify: `app/components/PostDisplay.tsx`

- [ ] **Step 1: Add the import**

At the top of `app/components/PostDisplay.tsx`, after the existing `import AudioPost` line, add:

```typescript
import PostGallery from "./posts/PostGallery";
```

- [ ] **Step 2: Add the gallery early-return before the main Card render**

In `PostDisplay`, after the `if (post.type === "audio")` block (around line 272) and before the final `return (<Card ...>)`, add:

```tsx
  if (post.type === "gallery") {
    return <PostGallery post={post} />;
  }
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/PostDisplay.tsx
git commit -m "feat: render gallery posts via PostGallery in PostDisplay"
```

---

## Task 6: Gallery upload UI

**Files:**
- Modify: `app/upload/page.tsx`

This task has more steps because the upload form is long. Make each change precisely.

- [ ] **Step 1: Add `GalleryImage` to the import from `@/lib/types`**

Find the import at the top of `app/upload/page.tsx`:
```typescript
import type { FileMetadata, PostType } from "@/lib/types";
```
Replace with:
```typescript
import type { FileMetadata, GalleryImage, PostType } from "@/lib/types";
```

- [ ] **Step 2: Add gallery state inside `UploadForm`**

After the existing state declarations (after `const [loading, setLoading] = useState(false);`), add:

```typescript
  interface GalleryItem {
    file: File;
    previewUrl: string;
    isFeature: boolean;
  }
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
```

- [ ] **Step 3: Add gallery file change handler**

After `handleAlbumCoverChange`, add:

```typescript
  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const MAX = 11 * 1024 * 1024;
    const incoming: GalleryItem[] = [];
    for (const f of Array.from(e.target.files)) {
      if (f.size > MAX) {
        setError(`${f.name} exceeds the 11MB limit`);
        e.target.value = "";
        return;
      }
      incoming.push({ file: f, previewUrl: URL.createObjectURL(f), isFeature: false });
    }
    setGalleryItems((prev) => {
      const combined = [...prev, ...incoming].slice(0, 3);
      if (!combined.some((i) => i.isFeature) && combined.length > 0) {
        combined[0] = { ...combined[0], isFeature: true };
      }
      return combined;
    });
    e.target.value = "";
  };

  const moveGalleryItem = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= galleryItems.length) return;
    setGalleryItems((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
  };

  const setGalleryFeature = (index: number) => {
    setGalleryItems((prev) =>
      prev.map((item, i) => ({ ...item, isFeature: i === index }))
    );
  };

  const removeGalleryItem = (index: number) => {
    setGalleryItems((prev) => {
      const arr = prev.filter((_, i) => i !== index);
      if (arr.length > 0 && !arr.some((i) => i.isFeature)) {
        arr[0] = { ...arr[0], isFeature: true };
      }
      return arr;
    });
  };
```

- [ ] **Step 4: Clean up gallery preview URLs on unmount**

Find the existing cleanup `useEffect` (around line 183):
```typescript
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
```

Replace with:
```typescript
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      if (albumCoverPreviewUrl) URL.revokeObjectURL(albumCoverPreviewUrl);
      galleryItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePreviewUrl, albumCoverPreviewUrl]);
```

- [ ] **Step 5: Add gallery submit branch at the top of `handleSubmit`**

Inside `handleSubmit`, immediately after `setLoading(true);` and before `try {`, add this block so gallery bails out early before touching the media-upload logic:

```typescript
    // Gallery type: upload each photo then POST
    if (type === "gallery") {
      try {
        if (galleryItems.length < 2) {
          setError("Please add at least 2 photos");
          setLoading(false);
          return;
        }
        if (month === "" || month < 0) {
          setError("Please enter a valid month (0-12)");
          setLoading(false);
          return;
        }
        const mediaBaseUrl =
          process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
          "https://letters-for-lena-media.s3.us-east-2.amazonaws.com";
        const galleryImages: GalleryImage[] = [];

        for (const item of galleryItems) {
          const presignedResponse = await fetch("/api/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: item.file.name,
              fileType: "gallery",
              contentType: item.file.type,
              fileSize: item.file.size,
            }),
          });
          const presignedData = await presignedResponse.json();
          if (!presignedResponse.ok) {
            setError(presignedData.error || "Failed to get upload URL");
            setLoading(false);
            return;
          }
          const uploadResponse = await fetch(presignedData.url, {
            method: "PUT",
            body: item.file,
            headers: { "Content-Type": item.file.type },
          });
          if (!uploadResponse.ok) {
            setError("Failed to upload photo to S3");
            setLoading(false);
            return;
          }
          galleryImages.push({
            url: `${mediaBaseUrl}/${presignedData.key}`,
            isFeature: item.isFeature,
          });
        }

        const response = await fetch("/api/posts", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "gallery",
            title: "",
            month: Number(month),
            images: galleryImages,
            caption: caption.trim() || undefined,
            published: true,
            order: order ? Number(order) : 0,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setSuccess("Gallery created successfully!");
          const persistedMonth = month;
          const persistedOrder = order;
          galleryItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
          setGalleryItems([]);
          setCaption("");
          setMonth(persistedMonth);
          setOrder(persistedOrder);
        } else {
          setError(data.error || "Failed to create gallery");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }
```

- [ ] **Step 6: Add `"gallery"` to the type dropdown**

Find the `<Select>` block with `<MenuItem>` entries (around line 579). After:
```tsx
                <MenuItem value="carousel">Carousel</MenuItem>
```
Add:
```tsx
                <MenuItem value="gallery">Gallery</MenuItem>
```

- [ ] **Step 7: Clear gallery items when switching away from gallery type**

In the `onChange` handler of the type `<Select>` (around line 558), after `setAlbumCoverFile(null);`, add:

```typescript
                  if (type === "gallery") {
                    galleryItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                    setGalleryItems([]);
                  }
```

- [ ] **Step 8: Add the gallery UI section**

After the `{isMediaType && (...)}` block (around line 715) and before the caption field, add:

```tsx
            {/* Gallery multi-image picker */}
            {type === "gallery" && (
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="gallery-file-input"
                  type="file"
                  multiple
                  onChange={handleGalleryFilesChange}
                />
                <label htmlFor="gallery-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    disabled={galleryItems.length >= 3}
                  >
                    {galleryItems.length === 0
                      ? "Add photos (2–3)"
                      : galleryItems.length >= 3
                      ? "Maximum 3 photos added"
                      : `Add more photos (${galleryItems.length}/3)`}
                  </Button>
                </label>

                {galleryItems.length > 0 && (
                  <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                    {galleryItems.map((item, i) => (
                      <Box
                        key={item.previewUrl}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          p: 1,
                          border: "1px solid",
                          borderColor: item.isFeature ? "primary.main" : "divider",
                          borderRadius: 1,
                        }}
                      >
                        {/* Thumbnail */}
                        <Box
                          sx={{
                            position: "relative",
                            width: 48,
                            height: 64,
                            flexShrink: 0,
                            borderRadius: 0.5,
                            overflow: "hidden",
                          }}
                        >
                          <Image
                            src={item.previewUrl}
                            alt={`Gallery photo ${i + 1}`}
                            fill
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        </Box>

                        {/* Filename */}
                        <MuiTypography
                          variant="body2"
                          sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {item.file.name}
                        </MuiTypography>

                        {/* Feature toggle */}
                        <Button
                          size="small"
                          variant={item.isFeature ? "contained" : "outlined"}
                          onClick={() => setGalleryFeature(i)}
                          sx={{ flexShrink: 0, minWidth: 64 }}
                        >
                          {item.isFeature ? "★ Feature" : "Feature"}
                        </Button>

                        {/* Up/down */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                          <Button size="small" sx={{ minWidth: 28, p: 0.25 }} onClick={() => moveGalleryItem(i, -1)} disabled={i === 0}>↑</Button>
                          <Button size="small" sx={{ minWidth: 28, p: 0.25 }} onClick={() => moveGalleryItem(i, 1)} disabled={i === galleryItems.length - 1}>↓</Button>
                        </Box>

                        {/* Remove */}
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeGalleryItem(i)}
                          sx={{ flexShrink: 0 }}
                        >
                          ✕
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
```

- [ ] **Step 9: Show caption field for gallery type**

Find this line:
```tsx
            {/* Caption field for photos & audio */}
            {(type === "photo" || type === "audio") && (
```
Replace with:
```tsx
            {/* Caption field for photos, audio, and gallery */}
            {(type === "photo" || type === "audio" || type === "gallery") && (
```

- [ ] **Step 10: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 11: Commit**

```bash
git add app/upload/page.tsx
git commit -m "feat: add gallery upload UI with multi-image picker and feature toggle"
```

---

## Task 7: Manual browser verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the upload form**

Open `http://localhost:3000/upload`.

- Select type **Gallery** from the dropdown.
- Confirm: title field is gone, a multi-image picker appears, caption field is visible.
- Add 2–3 photos. Confirm: thumbnails appear, one is marked ★ Feature by default.
- Try reordering (↑↓) and changing the feature. Confirm state updates correctly.
- Submit. Confirm: "Gallery created successfully!" appears.

- [ ] **Step 3: Test the month feed**

Open `http://localhost:3000/month/[the month you uploaded to]`.

- Confirm the gallery appears in the feed at the correct order position.
- Confirm the zigzag stack: cards alternate left/right, portrait 3:4 ratio.
- Confirm the feature photo (whichever was marked ★) has the highest z-index and overlaps neighbors.
- Confirm caption appears below the stack in italic Georgia.
- Confirm Day counter appears on the left.

- [ ] **Step 4: Commit final verification note**

```bash
git commit --allow-empty -m "feat: gallery post type — verified working in browser"
```
