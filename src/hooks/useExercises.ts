import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/coach";

const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("is_default", true)
    .order("muscle_group")
    .order("name");

  if (error) throw error;
  return data || [];
};

export const useExercises = () => {
  const { data: exercises = [], isLoading: loading } = useQuery({
    queryKey: ["exercises", "default"],
    queryFn: fetchExercises,
    staleTime: 10 * 60 * 1000, // 10 minutes — exercise library is quasi-static
    gcTime: 30 * 60 * 1000,
  });

  return { exercises, loading };
};
