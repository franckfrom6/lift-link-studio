import { useState } from "react";
import { Play } from "lucide-react";

interface VideoEmbedProps {
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
}

export function VideoEmbed({ videoUrl, title, thumbnailUrl }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID for thumbnail if not provided
  const getYouTubeThumbnail = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }
    return null;
  };

  const defaultThumbnail = thumbnailUrl || getYouTubeThumbnail(videoUrl) || "";

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="w-full sm:max-w-2xl sm:mx-auto">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        {!isPlaying && defaultThumbnail && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 z-10 flex items-center justify-center group cursor-pointer"
            aria-label={`Play video: ${title}`}
          >
            <img
              src={defaultThumbnail}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="relative z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </button>
        )}
        
        {isPlaying && (
          <iframe
            src={videoUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}
      </div>
    </div>
  );
}
