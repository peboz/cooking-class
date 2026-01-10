/**
 * Video utilities for handling video URLs
 * Currently supports YouTube, extensible for future platforms (S3, Vimeo, etc.)
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * 
 * @param url YouTube URL
 * @returns Video ID or null if invalid
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate if URL is a valid YouTube link
 * @param url URL to validate
 * @returns true if valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Generate YouTube embed URL from video ID
 * @param videoId YouTube video ID
 * @returns Embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get video type from URL
 * Extensible for future video sources (S3, Vimeo, etc.)
 * @param url Video URL
 * @returns Video type ('youtube' | 's3' | 'external' | null)
 */
export function getVideoType(url: string): 'youtube' | 's3' | 'external' | null {
  if (!url) return null;

  // Check if YouTube
  if (isValidYouTubeUrl(url)) {
    return 'youtube';
  }

  // Future: Check if S3 URL
  if (url.includes('s3.amazonaws.com') || url.includes('cloudfront.net')) {
    return 's3';
  }

  // Default to external
  return 'external';
}
