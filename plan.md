# Plan: Support Adding Content and Using It Within the App

## Overview
Enable users to add content (posts) and display them in the app. The API endpoints exist, but the frontend needs to be connected to fetch and display posts, and provide a way to add new content.

## Current State
- ✅ API endpoints exist (`/api/auth/posts`) for GET and POST
- ✅ Posts can be filtered by month and ordered by `order` field
- ✅ Posts have `published` flag to control visibility
- ❌ Frontend pages don't fetch posts from API
- ❌ No UI to add/create new posts
- ❌ Month pages show static content instead of dynamic posts

## Tasks

### 1. Update Month Page to Fetch and Display Posts
- [ ] Modify `app/1/page.tsx` (and future month pages) to:
  - Fetch posts from `/api/auth/posts?month=1` 
  - Display posts in order (by `order` field)
  - Handle different post types (text, audio, video, photo, stat)
  - Show loading and error states

### 2. Create Admin Interface for Adding Posts
- [ ] Create admin page (e.g., `app/admin/page.tsx` or `app/add/page.tsx`)
- [ ] Form to create new posts with fields:
  - Type (text, audio, video, photo, stat)
  - Month (number)
  - Content (text or file upload path)
  - Published (checkbox)
  - Order (number)
  - CreatedBy (optional)
- [ ] Submit form to POST `/api/auth/posts`
- [ ] Handle success/error responses

### 3. Update Home Page to Show Available Months
- [ ] Fetch all published posts from API
- [ ] Extract unique months from posts
- [ ] Dynamically generate month buttons/links
- [ ] Only show months that have published posts

### 4. Handle Different Post Types in Display
- [ ] Text posts: Display content as text
- [ ] Photo posts: Display as images (from content path)
- [ ] Audio posts: Display audio player
- [ ] Video posts: Display video player
- [ ] Stat posts: Display as formatted statistics

### 5. Add Authentication Check for Admin Pages
- [ ] Protect admin/add pages with authentication
- [ ] Redirect to login if not authenticated
- [ ] Check authentication cookie before allowing post creation

## Implementation Notes
- Posts are stored in `data/posts.json`
- API returns only published posts when using GET
- Posts are ordered by `order` field (ascending)
- Month filtering is available via query parameter

