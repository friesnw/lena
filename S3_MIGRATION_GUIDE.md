# S3 Migration Guide

## Summary of Changes

Your application has been successfully updated to use AWS S3 for file uploads instead of local storage. Here's what was changed:

### 1. New Dependencies

- **@aws-sdk/client-s3**: Official AWS SDK for JavaScript v3, used for S3 operations

### 2. New Files Created

#### `lib/s3.ts`

A utility module for S3 operations that includes:

- `uploadToS3()`: Function to upload files to your S3 bucket
- `isS3Configured()`: Function to check if S3 environment variables are properly set
- Configured S3 client with credentials from environment variables

### 3. Modified Files

#### `app/api/upload/route.ts`

**Before**: Files were saved to `public/uploads/` directory locally
**After**: Files are uploaded to S3 bucket

Key changes:

- Removed local filesystem operations (`writeFile`, `mkdir`, `existsSync`, `path`)
- Added S3 upload functionality via `uploadToS3()`
- Added S3 configuration validation
- Returns full S3 URL instead of relative path (e.g., `https://bucket.s3.region.amazonaws.com/uploads/file.jpg` instead of `/uploads/file.jpg`)

#### `next.config.ts`

Added `images.remotePatterns` configuration to allow Next.js Image component to load images from S3:

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    { protocol: "https", hostname: "*.s3.amazonaws.com" },
  ],
}
```

#### `README.md`

Added comprehensive documentation for:

- Required environment variables
- AWS S3 setup instructions
- IAM permissions needed

## Required Environment Variables

Add these to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=your_bucket_name

# Optional: Custom S3 Base URL (for CloudFront)
AWS_S3_BASE_URL=https://your-cloudfront-domain.com
```

## What You Need to Do

### 1. Set Up Your S3 Bucket

1. Log in to AWS Console
2. Create a new S3 bucket (or use an existing one)
3. Configure bucket permissions:
   - **Option A**: Public bucket with public read access
   - **Option B**: Private bucket with CloudFront distribution (recommended for production)

### 2. Create IAM User with S3 Permissions

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    }
  ]
}
```

### 3. Update Your Environment Variables

Add the AWS credentials to your `.env.local` file with the values from step 2.

### 4. Migrate Existing Files

✅ **COMPLETED!** All posts have been migrated to use S3 URLs.

The migration script has been run and updated:

- 80 posts with updated URLs
- `data/posts.json` now uses full S3 URLs
- `app/intro/page.tsx` updated to use S3 URL
- Backup created at `data/posts.json.backup`

Example of the migration:

```json
// Before
"content": "/uploads/file.jpg"

// After
"content": "https://letters-for-lena-media.s3.us-east-2.amazonaws.com/uploads/file.jpg"
```

### Migration Script

A migration script has been created at `scripts/migrate-posts-to-s3.ts` to automate this process. It has already been run successfully!

To re-run the migration (if needed):

```bash
npx tsx scripts/migrate-posts-to-s3.ts
```

The script:

- ✅ Updates all `/uploads/` paths to full S3 URLs
- ✅ Creates a backup at `data/posts.json.backup`
- ✅ Handles both `content` and `albumCoverUrl` fields
- ✅ Shows a summary of changes

### 5. Update Production Environment

Don't forget to add the AWS environment variables to your production environment (Vercel, etc.).

## Testing

1. Start your development server: `npm run dev`
2. Try uploading a new file
3. Verify it appears in your S3 bucket
4. Verify the uploaded file displays correctly in your application

## Troubleshooting

### "S3 is not properly configured" Error

- Check that all required environment variables are set in `.env.local`
- Restart your development server after adding environment variables

### "Failed to upload to S3" Error

- Verify your AWS credentials are correct
- Check that your IAM user has the required permissions
- Verify the bucket name is correct
- Check that your bucket policy allows PutObject operations

### Images Not Loading

- Verify the S3 bucket has public read access, or
- Set up a CloudFront distribution and update `AWS_S3_BASE_URL`
- Check that `next.config.ts` has the correct remote patterns

### CORS Errors

If you're experiencing CORS issues, add this policy to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## Benefits of S3 Migration

✅ **Scalability**: No file storage limits on your server
✅ **Performance**: Serve files from AWS's CDN
✅ **Reliability**: AWS S3 offers 99.999999999% durability
✅ **Cost-effective**: Pay only for what you use
✅ **Global**: Works well with Vercel and other serverless platforms

## Rollback

If you need to rollback to local storage:

1. Revert changes to `app/api/upload/route.ts`
2. Remove `lib/s3.ts`
3. Remove AWS environment variables
4. Files will be saved to `public/uploads/` again
