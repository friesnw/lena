import { NextRequest, NextResponse } from "next/server";
import exifr from "exifr";
import { parseBuffer } from "music-metadata";

// Maximum file size: 11MB
const MAX_FILE_SIZE = 11 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as string | null;

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

    // Validate file type parameter
    if (!fileType || !["photo", "audio", "video"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'photo', 'audio', or 'video'" },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract metadata based on file type
    let metadata: {
      dateTaken?: string;
      dateCreated?: string;
      dateModified?: string;
      camera?: string;
      location?: { latitude?: number; longitude?: number };
      durationSeconds?: number;
      [key: string]: any;
    } = {};

    // Extract EXIF metadata for images
    if (fileType === "photo") {
      try {
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

    // Handle video files - extract metadata
    if (fileType === "video") {
      try {
        const videoExifData = await exifr.parse(buffer, {
          pick: [
            "DateTimeOriginal",
            "CreateDate",
            "ModifyDate",
            "MediaCreateDate",
            "MediaModifyDate",
            "TrackCreateDate",
            "TrackModifyDate",
            "MovieHeaderCreateDate",
            "MovieHeaderModifyDate",
          ],
        });

        if (videoExifData) {
          // Date taken/created - prioritize DateTimeOriginal, then various creation date fields
          if (videoExifData.DateTimeOriginal) {
            metadata.dateTaken = new Date(
              videoExifData.DateTimeOriginal
            ).toISOString();
          } else if (videoExifData.CreateDate) {
            metadata.dateTaken = new Date(
              videoExifData.CreateDate
            ).toISOString();
          } else if (videoExifData.MediaCreateDate) {
            metadata.dateTaken = new Date(
              videoExifData.MediaCreateDate
            ).toISOString();
          } else if (videoExifData.TrackCreateDate) {
            metadata.dateTaken = new Date(
              videoExifData.TrackCreateDate
            ).toISOString();
          } else if (videoExifData.MovieHeaderCreateDate) {
            metadata.dateTaken = new Date(
              videoExifData.MovieHeaderCreateDate
            ).toISOString();
          }

          // Date modified
          if (videoExifData.ModifyDate) {
            metadata.dateModified = new Date(
              videoExifData.ModifyDate
            ).toISOString();
          } else if (videoExifData.MediaModifyDate) {
            metadata.dateModified = new Date(
              videoExifData.MediaModifyDate
            ).toISOString();
          } else if (videoExifData.TrackModifyDate) {
            metadata.dateModified = new Date(
              videoExifData.TrackModifyDate
            ).toISOString();
          } else if (videoExifData.MovieHeaderModifyDate) {
            metadata.dateModified = new Date(
              videoExifData.MovieHeaderModifyDate
            ).toISOString();
          }

          // Store all video EXIF data for reference
          metadata.videoExif = videoExifData;
        }
      } catch (videoError) {
        console.warn("Failed to extract video metadata:", videoError);
      }
    }

    // Fallback to file's lastModified date if no metadata date found
    if (!metadata.dateTaken && !metadata.dateCreated) {
      const fallbackDate = new Date(file.lastModified).toISOString();
      metadata.dateTaken = fallbackDate;
      metadata.dateCreated = fallbackDate;
    }

    // Also store file's lastModified as a fallback
    metadata.dateModified =
      metadata.dateModified || new Date(file.lastModified).toISOString();

    return NextResponse.json(
      {
        success: true,
        metadata,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Metadata extraction error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Failed to extract metadata",
        details:
          process.env.NODE_ENV === "development"
            ? { message: errorMessage, stack: errorStack }
            : undefined,
      },
      { status: 500 }
    );
  }
}
