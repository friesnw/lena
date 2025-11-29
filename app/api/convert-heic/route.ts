import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToS3, isS3Configured } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

// Maximum file size: 11MB
const MAX_FILE_SIZE = 11 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    // Check if file is HEIC/HEIF
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (!isHeic) {
      return NextResponse.json(
        { error: "File is not a HEIC/HEIF image" },
        { status: 400 }
      );
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

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert HEIC to JPEG using heic-convert
    let convert: any;
    try {
      const heicConvertModule = await import("heic-convert");
      convert = heicConvertModule.default || heicConvertModule;
    } catch (importError) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        convert = require("heic-convert");
      } catch (requireError) {
        return NextResponse.json(
          {
            error: "Failed to load heic-convert module",
            details:
              process.env.NODE_ENV === "development"
                ? {
                    importError:
                      importError instanceof Error
                        ? importError.message
                        : String(importError),
                    requireError:
                      requireError instanceof Error
                        ? requireError.message
                        : String(requireError),
                  }
                : undefined,
          },
          { status: 500 }
        );
      }
    }

    // Convert HEIC to JPEG
    const uint8Array = new Uint8Array(arrayBuffer);
    const jpegBuffer = await convert({
      buffer: uint8Array,
      format: "JPEG",
      quality: 0.9, // 90% quality
    });

    // Convert result to Buffer
    let jpegBufferNode: Buffer;
    if (Buffer.isBuffer(jpegBuffer)) {
      jpegBufferNode = jpegBuffer;
    } else if (jpegBuffer instanceof ArrayBuffer) {
      jpegBufferNode = Buffer.from(new Uint8Array(jpegBuffer));
    } else {
      jpegBufferNode = Buffer.from(jpegBuffer as Uint8Array);
    }

    // Optimize with sharp
    let finalBuffer: Buffer;
    try {
      finalBuffer = await sharp(jpegBufferNode)
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (sharpError) {
      // Use the direct output from heic-convert if sharp fails
      finalBuffer = jpegBufferNode;
    }

    // Upload to S3
    const uniqueFileName = `${uuidv4()}.jpg`;
    const s3Url = await uploadToS3(finalBuffer, uniqueFileName, "image/jpeg");

    return NextResponse.json(
      {
        success: true,
        path: s3Url,
        filename: uniqueFileName,
        originalName: file.name,
        size: finalBuffer.length,
        type: "image/jpeg",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("HEIC conversion error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Failed to convert HEIC file",
        details:
          process.env.NODE_ENV === "development"
            ? { message: errorMessage, stack: errorStack }
            : undefined,
      },
      { status: 500 }
    );
  }
}
