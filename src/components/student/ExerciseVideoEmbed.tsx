import { forwardRef, useState, useEffect, useMemo } from "react";
import { Search, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface ExerciseVideoEmbedProps {
  exerciseName: string;
  /** Direct video URL override (e.g. from session_exercises.video_url). Skips gender & YouTube resolution. */
  directVideoUrl?: string | null;
  /** Exercise-level gendered video URL for female athletes */
  videoUrlFemale?: string | null;
  /** Exercise-level gendered video URL for male athletes */
  videoUrlMale?: string | null;
  /** Exercise-level generic video URL */
  exerciseVideoUrl?: string | null;
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export const ExerciseVideoEmbed = forwardRef<HTMLDivElement, ExerciseVideoEmbedProps>(function ExerciseVideoEmbed({
  exerciseName,
  directVideoUrl,
  videoUrlFemale,
  videoUrlMale,
  exerciseVideoUrl,
}, ref) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Iframe is only mounted after the user clicks the thumbnail. Until
  // then we render a static YouTube poster so there is no "black rectangle"
  // while the iframe boots.
  const [iframeMounted, setIframeMounted] = useState(false);
  const { t } = useTranslation("exercises");
  const { user } = useAuth();

  // Fetch user sex from nutrition_profiles for gender-based video selection
  const { data: userSex } = useQuery({
    queryKey: ["nutrition-profile-sex", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("nutrition_profiles")
        .select("sex")
        .eq("student_id", user.id)
        .maybeSingle();
      return data?.sex as string | null;
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Resolve the best video URL based on gender, with fallback chain
  const resolvedUrl = useMemo(() => {
    // 1. Direct override from session_exercises always wins
    if (directVideoUrl) return directVideoUrl;

    // 2. Gender-specific exercise-level video
    if (userSex === "female" && videoUrlFemale) return videoUrlFemale;
    if (userSex === "male" && videoUrlMale) return videoUrlMale;

    // 3. Generic exercise-level video
    if (exerciseVideoUrl) return exerciseVideoUrl;

    // 4. No URL available — will fall back to YouTube search
    return null;
  }, [directVideoUrl, videoUrlFemale, videoUrlMale, exerciseVideoUrl, userSex]);

  useEffect(() => {
    // If we have a resolved URL, extract the YouTube ID
    if (resolvedUrl) {
      const id = extractYouTubeId(resolvedUrl);
      setVideoId(id);
      setLoading(false);
      return;
    }

    // Otherwise, search YouTube by exercise name
    let cancelled = false;
    // Hard timeout: never let the skeleton spin more than 5s.
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      setError(true);
      setLoading(false);
    }, 5000);

    async function fetchVideo() {
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

    setLoading(true);
    setError(false);
    setVideoId(null);
    fetchVideo();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [exerciseName, resolvedUrl]);

  // Skeleton while loading
  if (loading) {
    return (
      <div ref={ref} className="w-full sm:max-w-2xl sm:mx-auto">
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
      <div ref={ref} className="w-full sm:max-w-2xl sm:mx-auto">
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
    <div ref={ref} className="w-full sm:max-w-2xl sm:mx-auto">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md">
        {iframeMounted ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={`${exerciseName} tutorial`}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIframeMounted(true); }}
            className="absolute inset-0 w-full h-full group"
            aria-label={t("play_demo", "Lire la démo")}
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={`${exerciseName} thumbnail`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-black/70 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" strokeWidth={1.5} />
              </div>
            </div>
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {t("demo_video", "Vidéo de démonstration")}
      </p>
    </div>
  );
});
