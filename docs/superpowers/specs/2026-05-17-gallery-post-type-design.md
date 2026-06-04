# Gallery Post Type — Design Spec

## Goal

Add a `gallery` post type that groups 2–3 photos into a single post with one shared caption. Photos are displayed in a zigzag offset stack — portrait cards alternating left/right as they go down — with a vintage matte aesthetic. The author designates one photo as the "feature"; it gets the highest z-index and sits visually on top of any overlapping neighbors. The gallery renders inline in the month feed at its `order` position like any regular post.

## Architecture

A gallery post is a single `Post` record with `type: "gallery"` and a new `images: GalleryImage[]` field. Each `GalleryImage` carries a URL and an `isFeature` flag. Photos always display in authored order (no reordering on render). The feature photo's z-index is overridden to the highest value wherever it sits in the sequence. The author uploads all photos in one form submission. Display is handled by a new `PostGallery` component. Gallery posts flow through the same feed sorting as regular posts.

## Tech Stack

Next.js App Router · MUI · TypeScript · AWS S3 (presigned URLs) · posts.json data store

---

## Data Model

### `lib/types.ts`

Add `"gallery"` to `PostType` union. Add `GalleryImage` interface and `images` field to `Post`.

```typescript
export type PostType = "text" | "audio" | "video" | "photo" | "stat" | "carousel" | "gallery";

export interface GalleryImage {
  url: string;
  isFeature: boolean;
}

export interface Post {
  // ... existing fields unchanged ...
  images?: GalleryImage[];  // gallery only: 2–3 ordered photos
}
```

Constraints: exactly one `isFeature: true` per gallery post. `content` is unused for gallery type. `title` is unused for gallery type (stored as `""`).

---

## API Changes

### `app/api/posts/route.ts` — POST handler

- Accept `"gallery"` as a valid `type` (add to the allowlist alongside existing types).
- Accept `images?: GalleryImage[]` in the request body.
- Include `images` in the saved `Post` object when present.

### `app/api/upload-url/route.ts`

- Accept `"gallery"` as a valid `fileType` — treat identically to `"photo"` (same MIME types, same 11MB size limit).

---

## Upload Form

### `app/upload/page.tsx`

When `type === "gallery"`:

- Hide the single file picker and the title field.
- Show a multi-image section: a file input (`multiple`, same photo MIME types) that adds images to a list as they're selected.
- Render each selected image as a row with: thumbnail preview, up/down reorder buttons, a "★ Feature" toggle (radio-style — only one can be active), and a remove button. Default: first image is feature.
- Caption field: single shared caption for all photos.
- Order and Month fields: unchanged.
- On submit:
  1. Upload each image sequentially to S3 via the presigned URL flow (`/api/upload-url` with `fileType: "gallery"`), collecting URLs.
  2. Build `images: GalleryImage[]` preserving the displayed order, with `isFeature` from the toggle.
  3. POST to `/api/posts` with `type: "gallery"`, `images`, `caption`, `month`, `order`, `title: ""`.

---

## Display Component

### `app/components/posts/PostGallery.tsx` (new file)

Props:
```typescript
interface PostGalleryProps {
  post: Post;
}
```

**Layout — zigzag offset stack:**

Photos render in `post.images` order (index 0 = top of stack). Positions alternate left/right:
- Index 0: `left: 0`, width ~58%
- Index 1: `right: 0`, width ~56%, `top` offset ~150px from index 0
- Index 2: `left: 0`, width ~62%, `top` offset ~150px from index 1

Feature photo: `zIndex: 10`. Non-feature photos: `zIndex: i + 1` (1-indexed, so later cards naturally win ties, but feature always wins).

The total height of the stage is computed from the number of images and the vertical step (150px per card).

**Card shell — matte aesthetic:**
- Outer padding: `7px 7px 24px` (white border all around, extra bottom for the white space)
- Background: `#f9f6f2`
- Border: `1px solid #e2ddd7`
- Border-radius: `6px`
- Box shadow: `0 8px 28px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)`

**Photo inside each card:**
- Aspect ratio: `3/4` (portrait)
- `Image` component with `objectFit: "cover"`
- Grain overlay: absolutely-positioned `<div>` with SVG `feTurbulence` noise, `opacity: 0.5`, `mix-blend-mode: multiply`
- Vignette overlay: `radial-gradient(ellipse at center, transparent 50%, rgba(50,40,30,0.28) 100%)`
- CSS filter: `saturate(0.28) contrast(0.73) brightness(1.17)` on the image itself

**Caption area** (below the absolute-positioned stage):
- Day counter (`getDaysSinceOct15_2025`) on the left in monospace, same pattern as other posts
- Caption text below in italic Georgia serif, `color: #888`

**No interaction** (no tap-to-advance, no animation). Static layout.

### `app/components/PostDisplay.tsx`

Add `import PostGallery from "./posts/PostGallery"` and a `case "gallery"` branch in `renderPostContent` that returns `<PostGallery post={post} />`. Gallery posts skip the Card/CardContent wrapper — `PostGallery` is self-contained.

---

## Month Feed Integration

### `app/components/MonthPage.tsx`

No changes needed. Gallery posts have no carousel tags, so they fall into `regularPosts` and render via `PostDisplay` in authored order.

---

## Out of Scope

- Editing gallery images after creation (delete + re-create for now).
- Video support in galleries (photos only).
- More than 3 images per gallery.
- Admin edit UI for individual image swaps.
