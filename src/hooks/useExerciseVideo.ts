import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseWithVideos {
  video_url?: string | null;
  video_url_female?: string | null;
  video_url_male?: string | null;
}

/**
 * Resolves the best video URL for an exercise based on the user's sex
 * from their nutrition profile. Falls back to the generic video_url.
 */
export const useExerciseVideo = (exercise: ExerciseWithVideos | null | undefined) => {
  const { user } = useAuth();

  const { data: sex } = useQuery({
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

  const videoUrl = useMemo(() => {
    if (!exercise) return null;

    if (sex === "female" && exercise.video_url_female) {
      return exercise.video_url_female;
    }
    if (sex === "male" && exercise.video_url_male) {
      return exercise.video_url_male;
    }

    return exercise.video_url ?? null;
  }, [exercise, sex]);

  return { videoUrl };
};
