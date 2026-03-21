export type PostType = "text" | "audio" | "video" | "photo" | "stat" | "carousel";

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
  fadeOutAt?: number; // Seconds into the song at which to begin fading out
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  month: number;
  content?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: "admin" | "user" | undefined;
  published: boolean;
  order: number;
  metadata?: FileMetadata; // Original file metadata (date taken, camera, location, etc.)
  tags?: string[];
  deleted?: boolean; // Soft delete flag - when true, post is hidden from UI
}
