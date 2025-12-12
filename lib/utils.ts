import { MEDIA_BASE_URL } from "./config";

export function getMonthRangeText(month: number): string {
  if (month === 0) {
    return "Summer of 2025";
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const startMonth = 9 + month; // September (9) + month number
  const endMonth = 10 + month; // October (10) + month number

  const startMonthName = monthNames[startMonth - 1]; // Convert to 0-indexed
  const endMonthName = monthNames[endMonth - 1];

  return `${startMonthName} - ${endMonthName}`;
}

// Helper function to calculate days since October 15, 2025
export function getDaysSinceOct15_2025(dateString: string): number {
  const startDate = new Date("2025-10-15T00:00:00Z");
  const captureDate = new Date(dateString);
  const diffTime = captureDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Convert a relative path or full URL to a full S3 URL
 * If the URL is already a full URL (starts with http/https), return it as-is
 * If it's a relative path (starts with /), prepend the MEDIA_BASE_URL
 */
export function getS3Url(pathOrUrl: string): string {
  // If it's already a full URL, return it as-is
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  // If it's a relative path, prepend the media base URL
  // Remove leading slash if present to avoid double slashes
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;
  return `${MEDIA_BASE_URL}/${cleanPath}`;
}
