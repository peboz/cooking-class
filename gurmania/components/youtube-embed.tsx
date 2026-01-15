"use client";

import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/video';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface YouTubeEmbedProps {
  videoUrl: string;
  className?: string;
}

export function YouTubeEmbed({ videoUrl, className = '' }: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nevažeći YouTube URL. Molimo unesite važeći YouTube link.
        </AlertDescription>
      </Alert>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(videoId);

  return (
    <div className={`relative w-full overflow-hidden rounded-lg ${className}`} style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

interface YouTubePreviewProps {
  videoUrl: string;
  onRemove?: () => void;
}

export function YouTubePreview({ videoUrl, onRemove }: YouTubePreviewProps) {
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    return null;
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="relative group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt="Video thumbnail"
        className="w-full rounded-lg"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <AlertCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
