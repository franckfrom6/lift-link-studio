import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Exercise } from "@/types/exercise";
import { toast } from "sonner";
import i18n from "@/i18n";

type ExerciseInsert = {
  name: string;
  name_en?: string | null;
  muscle_group: string;
  equipment: string;
  type: string;
  tracking_type: string;
  description?: string | null;
  secondary_muscle?: string | null;
  public_cible?: string | null;
};

export const useCoachExercises = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all exercises visible to this user (default + custom via RLS)
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises", "all", user?.id],
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("is_default", { ascending: true }) // custom first
        .order("muscle_group")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const customExercises = exercises.filter(e => !e.is_default && e.created_by === user?.id);
  const isCustomExercise = (exerciseId: string) => customExercises.some(e => e.id === exerciseId);

  const createMutation = useMutation({
    mutationFn: async (input: ExerciseInsert) => {
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          ...input,
          is_default: false,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success(i18n.t("exercises:custom_created"));
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(i18n.t("exercises:custom_error"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ExerciseInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("exercises")
        .update(input)
        .eq("id", id)
        .eq("created_by", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success(i18n.t("exercises:custom_updated"));
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(i18n.t("exercises:custom_error"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if used in active programs
      const { count } = await supabase
        .from("session_exercises")
        .select("id", { count: "exact", head: true })
        .eq("exercise_id", id);

      if (count && count > 0) {
        throw new Error("EXERCISE_IN_USE");
      }

      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", id)
        .eq("created_by", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success(i18n.t("exercises:custom_deleted"));
    },
    onError: (err: any) => {
      if (err.message === "EXERCISE_IN_USE") {
        toast.error(i18n.t("exercises:custom_in_use"));
      } else {
        console.error(err);
        toast.error(i18n.t("exercises:custom_error"));
      }
    },
  });

  const checkNameExists = async (name: string, excludeId?: string): Promise<boolean> => {
    let query = supabase
      .from("exercises")
      .select("id", { count: "exact", head: true })
      .eq("name", name);
    if (excludeId) query = query.neq("id", excludeId);
    const { count } = await query;
    return (count || 0) > 0;
  };

  return {
    exercises,
    customExercises,
    isLoading,
    isCustomExercise,
    createExercise: createMutation.mutateAsync,
    updateExercise: updateMutation.mutateAsync,
    deleteExercise: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    checkNameExists,
  };
};
