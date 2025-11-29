This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Authentication
PASSWORD=your_password_here

# AWS S3 Configuration (Required for file uploads)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=letters-for-lena-media
NEXT_PUBLIC_MEDIA_BASE_URL=https://letters-for-lena-media.s3.us-east-2.amazonaws.com
```

### AWS S3 Setup

1. Create an S3 bucket in your AWS account
2. Configure bucket permissions:
   - Enable public read access for uploaded files, or
   - Set up a CloudFront distribution for private buckets
3. **Configure CORS for direct uploads:**

   - Go to your S3 bucket in AWS Console
   - Navigate to **Permissions** > **Cross-origin resource sharing (CORS)**
   - Add the following CORS configuration:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

   **For production**, replace `"AllowedOrigins": ["*"]` with your specific domains:

   ```json
   "AllowedOrigins": [
     "https://your-app.vercel.app",
     "https://your-custom-domain.com"
   ]
   ```

4. Create an IAM user with S3 upload permissions
5. Add the credentials to your `.env.local` file

Required IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Quick Deploy

1. **Push your code to GitHub** (or GitLab/Bitbucket)

2. **Import your project to Vercel:**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables:**

   - In your Vercel project dashboard, go to **Settings** > **Environment Variables**
   - Add the following variables (for Production, Preview, and Development environments):

   ```env
   PASSWORD=your_password_here
   AWS_REGION=us-east-2
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_S3_BUCKET_NAME=letters-for-lena-media
   NEXT_PUBLIC_MEDIA_BASE_URL=https://letters-for-lena-media.s3.us-east-2.amazonaws.com
   ```

4. **Deploy:**
   - Click **Deploy**
   - Vercel will build and deploy your app automatically
   - Your app will be live at `https://your-project.vercel.app`

### Important Notes

- **Vercel Plan Requirements:** The app now uses **direct-to-S3 uploads**, which works on **Vercel Hobby (free tier)**! Files are uploaded directly from the browser to S3, avoiding long-running serverless functions.
- **File Size Limit:** Maximum file size is **11MB** for all uploads.
- **HEIC Conversion:** HEIC/HEIF images are automatically converted to JPEG using a lightweight server endpoint (works on Hobby tier).
- **Metadata Extraction:** File metadata (EXIF, audio duration, etc.) is extracted via a separate lightweight endpoint.
- **Environment Variables:** Make sure all environment variables are set in Vercel before deploying. The app will not function properly without AWS S3 credentials.
- **Build Settings:** Vercel will automatically detect Next.js and use the build command from `package.json` (`next build`).
- **S3 CORS Configuration:** Make sure your S3 bucket has CORS configured (see AWS S3 Setup above) to allow direct browser uploads.

### Troubleshooting

- If uploads fail, verify your AWS S3 credentials are correctly set in Vercel environment variables
- Check the Vercel function logs in the dashboard for detailed error messages
- Ensure your S3 bucket has the correct CORS configuration if needed

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
