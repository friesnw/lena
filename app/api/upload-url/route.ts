import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { isS3Configured } from "@/lib/s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "letters-for-lena-media";

// Maximum file size: 11MB
const MAX_FILE_SIZE = 11 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  photo: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/heic",
    "image/heif",
  ],
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, contentType, fileSize } = body;

    // Validate inputs
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    if (!["photo", "audio", "video"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'photo', 'audio', or 'video'" },
        { status: 400 }
      );
    }

    // Validate MIME type if provided
    if (contentType) {
      const allowedMimeTypes =
        ALLOWED_MIME_TYPES[fileType as keyof typeof ALLOWED_MIME_TYPES];
      if (!allowedMimeTypes.includes(contentType)) {
        return NextResponse.json(
          {
            error: `Invalid content type. Expected ${fileType} file (${allowedMimeTypes.join(
              ", "
            )})`,
          },
          { status: 400 }
        );
      }
    }

    // Check if S3 is configured
    if (!isS3Configured()) {
      return NextResponse.json(
        {
          error:
            "S3 is not properly configured. Please check your environment variables.",
        },
        { status: 500 }
      );
    }

    // Generate unique filename
    const fileExtension = fileName.split(".").pop() || "";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `uploads/${uniqueFileName}`;

    // Create presigned PUT URL (valid for 5 minutes)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json(
      {
        url,
        key,
        fileName: uniqueFileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to generate upload URL",
        details:
          process.env.NODE_ENV === "development"
            ? { message: errorMessage }
            : undefined,
      },
      { status: 500 }
    );
  }
}
