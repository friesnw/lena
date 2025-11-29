import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MEDIA_BASE_URL } from "./config";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "letters-for-lena-media";
const S3_BASE_URL = MEDIA_BASE_URL;

/**
 * Upload a file to S3
 * @param buffer - File buffer to upload
 * @param fileName - Name of the file (including extension)
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // Make the file publicly readable (adjust based on your bucket policy)
    // ACL: "public-read", // Uncomment if your bucket allows ACLs
  });

  try {
    await s3Client.send(command);

    // Return the public URL
    // Format: https://bucket-name.s3.region.amazonaws.com/uploads/filename.jpg
    return `${S3_BASE_URL}/${key}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(
      `Failed to upload to S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check if S3 is properly configured
 */
export function isS3Configured(): boolean {
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  const hasBucketName = !!process.env.AWS_S3_BUCKET_NAME;
  const hasRegion = !!process.env.AWS_REGION;

  console.log("🔍 S3 Configuration Check:");
  console.log(
    `  AWS_ACCESS_KEY_ID: ${hasAccessKey ? "✓ SET" : "✗ MISSING"} ${
      hasAccessKey
        ? `(${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...)`
        : ""
    }`
  );
  console.log(
    `  AWS_SECRET_ACCESS_KEY: ${hasSecretKey ? "✓ SET" : "✗ MISSING"} ${
      hasSecretKey ? "(hidden)" : ""
    }`
  );
  console.log(
    `  AWS_S3_BUCKET_NAME: ${hasBucketName ? "✓ SET" : "✗ MISSING"} ${
      hasBucketName ? `(${process.env.AWS_S3_BUCKET_NAME})` : ""
    }`
  );
  console.log(
    `  AWS_REGION: ${hasRegion ? "✓ SET" : "✗ MISSING"} ${
      hasRegion ? `(${process.env.AWS_REGION})` : ""
    }`
  );

  if (!hasAccessKey || !hasSecretKey || !hasBucketName || !hasRegion) {
    console.error("\n❌ S3 is not properly configured!");
    console.error(
      "💡 Make sure all AWS_* variables are in your .env.local file"
    );
    console.error("💡 Restart your dev server after adding them");
    return false;
  }

  console.log("✅ S3 configuration looks good!");
  return true;
}
