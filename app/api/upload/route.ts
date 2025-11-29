import { NextRequest, NextResponse } from "next/server";

// Route segment config
export const maxDuration = 300;
export const runtime = "nodejs";

/**
 * @deprecated This route is deprecated.
 * Please use the following routes instead:
 * - /api/upload-url - Get presigned URL for direct S3 upload
 * - /api/extract-metadata - Extract metadata from files
 * - /api/convert-heic - Convert HEIC files to JPEG
 *
 * This route is kept for backward compatibility but will be removed in a future version.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This route is deprecated. Please use /api/upload-url, /api/extract-metadata, and /api/convert-heic instead.",
      details:
        "The /api/upload route has been replaced with separate, lightweight routes to reduce serverless function size.",
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
