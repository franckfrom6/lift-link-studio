import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/coach";

const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");

  if (error) throw error;
  return data || [];
};

/**
 * Sort exercises so that public_cible-matched ones appear first.
 * "all" exercises always stay in natural order.
 */
function sortByPublicCible(exercises: Exercise[], userSex?: string | null): Exercise[] {
  if (!userSex) return exercises;

  const preferred = userSex === "female" ? "women_focused" : userSex === "male" ? "men_focused" : null;
  if (!preferred) return exercises;

  return [...exercises].sort((a, b) => {
    const aMatch = (a as any).public_cible === preferred ? 0 : 1;
    const bMatch = (b as any).public_cible === preferred ? 0 : 1;
    return aMatch - bMatch;
  });
}

export const useExercises = (userSex?: string | null) => {
  const { data: exercises = [], isLoading: loading } = useQuery({
    queryKey: ["exercises", "all"],
    queryFn: fetchExercises,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => sortByPublicCible(data, userSex),
  });

  return { exercises, loading };
};
