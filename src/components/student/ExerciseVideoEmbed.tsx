import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ExerciseVideoEmbedProps {
  exerciseName: string;
  /** Pre-resolved video URL (from useExerciseVideo). If provided, skips YouTube search. */
  directVideoUrl?: string | null;
}

interface CachedVideo {
  videoId: string | null;
  title: string | null;
  ts: number;
}

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(name: string) {
  return `yt_cache_${name.toLowerCase().replace(/\s+/g, "_")}`;
}

function getCached(name: string): CachedVideo | null {
  try {
    const raw = localStorage.getItem(getCacheKey(name));
    if (!raw) return null;
    const parsed: CachedVideo = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(name));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(name: string, videoId: string | null, title: string | null) {
  try {
    localStorage.setItem(
      getCacheKey(name),
      JSON.stringify({ videoId, title, ts: Date.now() })
    );
  } catch {
    // quota exceeded — ignore
  }
}

export function ExerciseVideoEmbed({ exerciseName, directVideoUrl }: ExerciseVideoEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation("exercises");

  // Extract YouTube video ID from a full URL
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    // If a direct URL is provided, use it instead of searching
    if (directVideoUrl) {
      const id = extractYouTubeId(directVideoUrl);
      setVideoId(id);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchVideo() {
      // Check cache first
      const cached = getCached(exerciseName);
      if (cached) {
        setVideoId(cached.videoId);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "youtube-search",
          { body: { exerciseName } }
        );

        if (cancelled) return;

        if (fnError || !data) {
          console.error("youtube-search error:", fnError);
          setError(true);
          setLoading(false);
          return;
        }

        setVideoId(data.videoId);
        setCache(exerciseName, data.videoId, data.title);
      } catch (e) {
        console.error("youtube-search fetch error:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVideo();
    return () => { cancelled = true; };
  }, [exerciseName, directVideoUrl]);

  // Skeleton while loading
  if (loading) {
    return (
      <div className="w-full sm:max-w-2xl sm:mx-auto">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted-foreground/10" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t("demo_video", "Vidéo de démonstration")}
        </p>
      </div>
    );
  }

  // No result — fallback search button
  if (error || !videoId) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${exerciseName} exercise tutorial`
    )}`;
    return (
      <div className="w-full sm:max-w-2xl sm:mx-auto">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-info-bg hover:bg-info/20 text-info px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <Search className="w-3 h-3" strokeWidth={1.5} />
          {t("search_youtube", "Voir sur YouTube")}
        </a>
      </div>
    );
  }

  // Embedded video
  return (
    <div className="w-full sm:max-w-2xl sm:mx-auto">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${exerciseName} tutorial`}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {t("demo_video", "Vidéo de démonstration")}
      </p>
    </div>
  );
}
