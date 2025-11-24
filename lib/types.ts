export type PostType = "text" | "audio" | "video" | "photo" | "stat";

export interface FileMetadata {
  dateTaken?: string;
  dateCreated?: string;
  dateModified?: string;
  camera?: string;
  location?: { latitude?: number; longitude?: number };
  durationSeconds?: number;
  dimensions?: { width: number; height: number };
  albumCoverUrl?: string;
  albumCoverDimensions?: { width: number; height: number };
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  month: number;
  content: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: "admin" | "user" | undefined;
  published: boolean;
  order: number;
  metadata?: FileMetadata; // Original file metadata (date taken, camera, location, etc.)
  tags?: string[];
}
