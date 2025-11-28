/**
 * Migration Script: Update posts.json to use S3 URLs
 * 
 * This script updates all relative /uploads/ paths in posts.json
 * to full S3 URLs based on your environment configuration.
 * 
 * Usage: npx tsx scripts/migrate-posts-to-s3.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Use existing config
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'letters-for-lena-media';
const S3_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 
  `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

console.log('🚀 Starting posts.json migration to S3 URLs');
console.log(`📦 Bucket: ${AWS_S3_BUCKET_NAME}`);
console.log(`🌍 Region: ${AWS_REGION}`);
console.log(`🔗 Base URL: ${S3_BASE_URL}`);
console.log('');

// Read posts.json
const postsPath = path.join(process.cwd(), 'data', 'posts.json');
let postsData: any[];

try {
  const fileContent = fs.readFileSync(postsPath, 'utf-8');
  postsData = JSON.parse(fileContent);
  console.log(`✅ Loaded ${postsData.length} posts from data/posts.json`);
} catch (error) {
  console.error('❌ Error reading posts.json:', error);
  process.exit(1);
}

// Create backup
const backupPath = path.join(process.cwd(), 'data', 'posts.json.backup');
try {
  fs.copyFileSync(postsPath, backupPath);
  console.log(`💾 Created backup at data/posts.json.backup`);
} catch (error) {
  console.error('❌ Error creating backup:', error);
  process.exit(1);
}

// Migration function
function migrateUrl(url: string): string {
  if (typeof url !== 'string') return url;
  
  // Check if it's a relative /uploads/ path
  if (url.startsWith('/uploads/')) {
    // Extract filename
    const filename = url.replace('/uploads/', '');
    // Return full S3 URL
    return `${S3_BASE_URL}/uploads/${filename}`;
  }
  
  // Already an S3 URL or different path, return as-is
  return url;
}

// Track changes
let updatedPosts = 0;
let updatedFields = 0;

// Migrate posts
postsData = postsData.map((post) => {
  let postUpdated = false;
  
  // Update content field
  if (post.content && post.content.startsWith('/uploads/')) {
    const oldContent = post.content;
    post.content = migrateUrl(post.content);
    if (post.content !== oldContent) {
      updatedFields++;
      postUpdated = true;
    }
  }
  
  // Update albumCoverUrl field (for audio posts)
  if (post.audio?.albumCoverUrl && post.audio.albumCoverUrl.startsWith('/uploads/')) {
    const oldUrl = post.audio.albumCoverUrl;
    post.audio.albumCoverUrl = migrateUrl(post.audio.albumCoverUrl);
    if (post.audio.albumCoverUrl !== oldUrl) {
      updatedFields++;
      postUpdated = true;
    }
  }
  
  if (postUpdated) {
    updatedPosts++;
  }
  
  return post;
});

// Write updated posts.json
try {
  fs.writeFileSync(postsPath, JSON.stringify(postsData, null, 2), 'utf-8');
  console.log('');
  console.log('✅ Migration completed successfully!');
  console.log(`📝 Updated ${updatedPosts} posts`);
  console.log(`🔗 Updated ${updatedFields} URL fields`);
  console.log('');
  console.log('💡 Tip: If something went wrong, restore from data/posts.json.backup');
} catch (error) {
  console.error('❌ Error writing posts.json:', error);
  console.error('💡 Your backup is safe at data/posts.json.backup');
  process.exit(1);
}

// Show sample of changes
console.log('');
console.log('📋 Sample changes:');
const postsWithContent = postsData.filter(p => p.content && p.content.includes(S3_BASE_URL)).slice(0, 3);
postsWithContent.forEach((post) => {
  console.log(`  - ${post.title || post.id}: ${post.content.substring(0, 80)}...`);
});

