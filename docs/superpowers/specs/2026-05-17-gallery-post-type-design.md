# Gallery Post Type — Design Spec

## Goal

Add a `gallery` post type that groups 2–3 photos into a single post with one shared caption. Photos auto-advance with a crossfade every 2.2s. The visual treatment is the "Matte" aesthetic: washed-out tones, wide white border, film grain, vignette. The gallery renders inline in the month feed at its `order` position, just like a regular photo post.

## Architecture

A gallery post is a single `Post` record with `type: "gallery"` and a new `images: string[]` field containing S3 URLs for 2–3 photos. The author uploads all photos in one form submission — no separate "carousel tag" authoring required. Display is handled by a new `PostGallery` component. Gallery posts flow through the same feed sorting as regular posts.

## Tech Stack

Next.js App Router · MUI · TypeScript · AWS S3 (presigned URLs) · posts.json data store

---

## Data Model

### `lib/types.ts`

- Add `"gallery"` to `PostType` union.
- Add `images?: string[]` to `Post` interface — an ordered array of S3 URLs for gallery photos (2–3 items). Only populated when `type === "gallery"`. The existing `content` field is unused for galleries.

```typescript
export type PostType = "text" | "audio" | "video" | "photo" | "stat" | "carousel" | "gallery";

export interface Post {
  // ... existing fields unchanged ...
  images?: string[];  // gallery only: ordered S3 URLs
}
```

---

## API Changes

### `app/api/posts/route.ts` — POST handler

- Accept `"gallery"` as a valid `type`.
- Accept `images?: string[]` in the request body.
- Include `images` in the saved `Post` object when present.
- No change to validation logic for other types.

### `app/api/upload-url/route.ts`

- Accept `"gallery"` as a valid `fileType` — treat it identically to `"photo"` (same MIME types, same 11MB size limit).

---

## Upload Form

### `app/upload/page.tsx`

When `type === "gallery"`:

- Replace the single file picker with a multi-image picker (`multiple` attribute, accepts same MIME types as photo).
- Show a preview grid of selected images (thumbnails, removable, reorderable via up/down buttons).
- Upload each image sequentially to S3 via the existing presigned URL flow on submit, collecting URLs into an `images` array.
- Caption field: single text input, shared across all photos.
- Order field: unchanged — one value for the whole post.
- Title field: hidden for gallery type (not displayed in the component). Submitted as empty string `""`.
- On submit: POST to `/api/posts` with `type: "gallery"`, `images`, `caption`, `month`, `order`.

Tag options: none for gallery type (galleries are not carousel-tagged).

---

## Display Component

### `app/components/posts/PostGallery.tsx` (new file)

Props:
```typescript
interface PostGalleryProps {
  post: Post; // post.images contains the URLs
}
```

Behavior:
- Auto-advances through `post.images` every 2200ms via `setInterval`.
- Crossfade transition (opacity, 900ms ease).
- Tapping/clicking the image skips to the next photo and resets the timer.
- Image index indicator: small dots below the image (inactive = `#e8e4de`, active = `#bbb`).
- Caption: always visible below the frame in italic Georgia serif.
- Day counter (`getDaysSinceOct15_2025`) shown alongside caption, same as other post types.

Visual treatment (Matte aesthetic):
- Outer container: `background: #faf8f5`, `border: 1px solid #e0dbd3`, `padding: 20px 20px 14px`, subtle box shadow.
- Images: `filter: saturate(0.3) contrast(0.75) brightness(1.15)` — very faded, washed-out.
- Grain overlay: SVG `feTurbulence` filter at low opacity via an absolutely-positioned `<div>`.
- Vignette: `radial-gradient(ellipse at center, transparent 60%, rgba(200,190,180,0.3) 100%)`.
- Progress bar: 1px line below image, animated from 0→100% over 2200ms, resets on each advance.
- Aspect ratio: `4/3`, full width of container.
- Margin bottom: `mb: 3` (same as other post cards).

### `app/components/PostDisplay.tsx`

Add a `case "gallery"` branch that renders `<PostGallery post={post} />`. Import `PostGallery` at the top.

---

## Month Feed Integration

### `app/components/MonthPage.tsx`

No changes needed. Gallery posts have no carousel tags, so they fall into `regularPosts` and render via `PostDisplay` in order. The existing `hasCarouselTag` check correctly ignores them.

---

## Prototype / Clone Page

A read-only clone page at `/month/[n]/gallery-preview` is out of scope for this spec — the feature ships as the real thing within the existing month feed. The author can create a gallery post in any month to preview it.

---

## Out of Scope

- Reordering gallery images after post creation (can be added later via the admin edit flow).
- Video support in galleries (photos only for now).
- More than 3 images per gallery.
- Admin edit UI for swapping individual gallery images (edit post deletes and re-creates for now).
