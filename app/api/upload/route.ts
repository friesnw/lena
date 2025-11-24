import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import exifr from "exifr";
import { parseBuffer } from "music-metadata";

// Route segment config for handling large file uploads
export const maxDuration = 300; // 5 minutes for large video uploads
export const runtime = "nodejs"; // Use Node.js runtime for file operations

// Maximum file size: 15MB (adjust as needed)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

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
    console.log("Upload request received");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as string | null; // 'photo', 'audio', or 'video'

    console.log("File info:", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      uploadType: fileType,
    });

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type parameter
    if (!fileType || !["photo", "audio", "video"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'photo', 'audio', or 'video'" },
        { status: 400 }
      );
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

    // Validate MIME type
    const allowedMimeTypes =
      ALLOWED_MIME_TYPES[fileType as keyof typeof ALLOWED_MIME_TYPES];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Expected ${fileType} file (${allowedMimeTypes.join(
            ", "
          )})`,
        },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Get file as ArrayBuffer (needed for heic-convert)
    let arrayBuffer: ArrayBuffer;
    let buffer: Buffer;

    try {
      console.log("Reading file into buffer...", {
        fileType,
        fileName: file.name,
        fileSize: file.size,
      });
      arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log("File read successfully, buffer size:", buffer.length);
    } catch (bufferError) {
      console.error("Failed to read file into buffer:", bufferError);
      const errorMessage =
        bufferError instanceof Error
          ? bufferError.message
          : String(bufferError);
      return NextResponse.json(
        {
          error: "Failed to read file",
          details:
            process.env.NODE_ENV === "development"
              ? { message: errorMessage }
              : undefined,
        },
        { status: 500 }
      );
    }

    // Extract metadata (especially date taken/created)
    let metadata: {
      dateTaken?: string;
      dateCreated?: string;
      dateModified?: string;
      camera?: string;
      location?: { latitude?: number; longitude?: number };
      [key: string]: any;
    } = {};

    // Extract EXIF metadata for images
    if (fileType === "photo") {
      try {
        // Extract EXIF data from the buffer
        const exifData = await exifr.parse(buffer, {
          pick: [
            "DateTimeOriginal",
            "CreateDate",
            "ModifyDate",
            "Make",
            "Model",
            "GPSLatitude",
            "GPSLongitude",
            "GPSLatitudeRef",
            "GPSLongitudeRef",
          ],
        });

        if (exifData) {
          // Date taken/created - prioritize DateTimeOriginal, then CreateDate
          if (exifData.DateTimeOriginal) {
            metadata.dateTaken = new Date(
              exifData.DateTimeOriginal
            ).toISOString();
          } else if (exifData.CreateDate) {
            metadata.dateTaken = new Date(exifData.CreateDate).toISOString();
          }

          // Date modified
          if (exifData.ModifyDate) {
            metadata.dateModified = new Date(exifData.ModifyDate).toISOString();
          }

          // Camera info
          if (exifData.Make || exifData.Model) {
            metadata.camera = [exifData.Make, exifData.Model]
              .filter(Boolean)
              .join(" ");
          }

          // GPS location
          if (
            exifData.GPSLatitude !== undefined &&
            exifData.GPSLongitude !== undefined
          ) {
            let lat = exifData.GPSLatitude;
            let lon = exifData.GPSLongitude;

            // Apply reference direction (N/S, E/W)
            if (exifData.GPSLatitudeRef === "S") lat = -lat;
            if (exifData.GPSLongitudeRef === "W") lon = -lon;

            metadata.location = { latitude: lat, longitude: lon };
          }

          // Store all EXIF data for reference
          metadata.exif = exifData;
        }
      } catch (exifError) {
        console.warn("Failed to extract EXIF data:", exifError);
        // Continue without EXIF data
      }
    }

    // Capture audio duration
    if (fileType === "audio") {
      try {
        const audioMetadata = await parseBuffer(buffer, file.type);
        if (audioMetadata.format.duration) {
          metadata.durationSeconds = Math.round(audioMetadata.format.duration);
        }
      } catch (audioError) {
        console.warn("Failed to extract audio metadata:", audioError);
      }
    }

    // Handle video files - extract basic metadata if possible
    if (fileType === "video") {
      try {
        // For now, we'll just log video info
        // Future: could use ffmpeg or similar to extract duration, dimensions, etc.
        console.log("Processing video file:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });
      } catch (videoError) {
        console.warn("Failed to process video metadata:", videoError);
      }
    }

    // Fallback to file's lastModified date if no EXIF date found
    if (!metadata.dateTaken && !metadata.dateCreated) {
      metadata.dateCreated = new Date(file.lastModified).toISOString();
    }

    // Also store file's lastModified as a fallback
    metadata.dateModified =
      metadata.dateModified || new Date(file.lastModified).toISOString();

    // Check if file is HEIC/HEIF and needs conversion
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    console.log("File type check:", {
      isHeic,
      fileType: file.type,
      fileName: file.name,
      uploadType: fileType,
    });

    let uniqueFileName: string;
    let filePath: string;
    let finalBuffer: Buffer;

    if (isHeic && fileType === "photo") {
      // Convert HEIC to JPEG using heic-convert
      try {
        console.log("Starting HEIC conversion...", {
          fileName: file.name,
          fileType: file.type,
          bufferSize: arrayBuffer.byteLength,
        });

        // Try to load and use heic-convert
        let convert: any;
        try {
          console.log("Attempting to load heic-convert module...");
          // Try dynamic import first
          const heicConvertModule = await import("heic-convert");
          convert = heicConvertModule.default || heicConvertModule;
          console.log("heic-convert module loaded successfully via import");
        } catch (importError) {
          console.error("Dynamic import failed, trying require:", importError);
          // Fallback to require (might work in some Next.js setups)
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            convert = require("heic-convert");
            console.log("heic-convert module loaded successfully via require");
          } catch (requireError) {
            console.error("Both import and require failed:", requireError);
            throw new Error(
              `Failed to load heic-convert: Import error: ${
                importError instanceof Error
                  ? importError.message
                  : String(importError)
              }, Require error: ${
                requireError instanceof Error
                  ? requireError.message
                  : String(requireError)
              }`
            );
          }
        }

        // heic-convert expects Uint8Array, not ArrayBuffer
        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log("Calling convert function with Uint8Array...");
        const jpegBuffer = await convert({
          buffer: uint8Array,
          format: "JPEG",
          quality: 0.9, // 90% quality
        });
        console.log("Conversion completed, result type:", typeof jpegBuffer);

        console.log(
          "HEIC conversion successful, buffer type:",
          typeof jpegBuffer,
          "isBuffer:",
          Buffer.isBuffer(jpegBuffer),
          "isArrayBuffer:",
          jpegBuffer instanceof ArrayBuffer
        );

        // Convert result to Buffer (heic-convert may return Buffer or ArrayBuffer)
        let jpegBufferNode: Buffer;
        if (Buffer.isBuffer(jpegBuffer)) {
          jpegBufferNode = jpegBuffer;
        } else if (jpegBuffer instanceof ArrayBuffer) {
          jpegBufferNode = Buffer.from(new Uint8Array(jpegBuffer));
        } else {
          // Assume it's a Uint8Array or similar
          jpegBufferNode = Buffer.from(jpegBuffer as Uint8Array);
        }

        console.log("Converted to Buffer, size:", jpegBufferNode.length);

        // Try to use sharp to optimize, but fall back to direct output if it fails
        try {
          finalBuffer = await sharp(jpegBufferNode)
            .jpeg({ quality: 90 })
            .toBuffer();
          console.log(
            "Sharp optimization successful, final size:",
            finalBuffer.length
          );
        } catch (sharpError) {
          console.warn(
            "Sharp optimization failed, using direct conversion:",
            sharpError
          );
          // Use the direct output from heic-convert
          finalBuffer = jpegBufferNode;
        }

        uniqueFileName = `${uuidv4()}.jpg`;
        filePath = path.join(uploadsDir, uniqueFileName);
      } catch (error) {
        console.error("HEIC conversion error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error("Error details:", {
          message: errorMessage,
          stack: errorStack,
          fileType: file.type,
          fileName: file.name,
          bufferSize: arrayBuffer.byteLength,
        });

        // Return more detailed error for debugging
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
    } else {
      // Use original file
      const fileExtension = path.extname(file.name);
      uniqueFileName = `${uuidv4()}${fileExtension}`;
      filePath = path.join(uploadsDir, uniqueFileName);
      finalBuffer = buffer;
    }

    // TODO:
    // Generate derivatives:
    // •	Original (or near-original) quality: e.g. 3000px wide JPEG.
    // •	Medium: ~1200px.
    // •	Thumbnail: ~300px.
    // 4.	Store in object storage (S3 / GCS / Azure Blob):
    // •	E.g. /photos/{id}/original.heic (if you keep the original)
    // •	and /photos/{id}/full.jpg, /photos/{id}/1200.webp, /photos/{id}/300.jpg.
    // 5.	Return metadata to the FE, not the raw HEIC:

    // Save file
    try {
      console.log("Writing file to disk...", {
        filePath,
        bufferSize: finalBuffer.length,
        fileType,
      });
      await writeFile(filePath, finalBuffer);
      console.log("File written successfully");
    } catch (writeError) {
      console.error("Failed to write file:", writeError);
      const errorMessage =
        writeError instanceof Error ? writeError.message : String(writeError);
      return NextResponse.json(
        {
          error: "Failed to save file",
          details:
            process.env.NODE_ENV === "development"
              ? { message: errorMessage }
              : undefined,
        },
        { status: 500 }
      );
    }

    // Return the public path (relative to public directory)
    const publicPath = `/uploads/${uniqueFileName}`;

    // Determine the final file type (JPEG if converted from HEIC)
    const finalType = isHeic && fileType === "photo" ? "image/jpeg" : file.type;
    const finalSize =
      isHeic && fileType === "photo" ? finalBuffer.length : file.size;

    return NextResponse.json(
      {
        success: true,
        path: publicPath,
        filename: uniqueFileName,
        originalName: file.name,
        size: finalSize,
        type: finalType,
        metadata: {
          dateTaken: metadata.dateTaken,
          dateCreated: metadata.dateCreated,
          dateModified: metadata.dateModified,
          camera: metadata.camera,
          location: metadata.location,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details:
          process.env.NODE_ENV === "development"
            ? { message: errorMessage, stack: errorStack }
            : undefined,
      },
      { status: 500 }
    );
  }
}
