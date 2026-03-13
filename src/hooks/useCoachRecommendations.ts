import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { NutritionRecommendation, RecoveryRecommendation } from "@/data/recommendation-templates";

interface RecoData {
  nutritionRecos: NutritionRecommendation[];
  recoveryRecos: RecoveryRecommendation[];
  students: { id: string; name: string }[];
}

async function fetchAll(userId: string): Promise<RecoData> {
  const { data: relations } = await supabase
    .from("coach_students")
    .select("student_id")
    .eq("coach_id", userId)
    .eq("status", "active");

  const studentIds = relations?.map((r) => r.student_id) || [];
  const studentMap = new Map<string, string>();
  let studentsList: { id: string; name: string }[] = [];

  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", studentIds);
    profiles?.forEach((p) => studentMap.set(p.user_id, p.full_name));
    studentsList = profiles?.map((p) => ({ id: p.user_id, name: p.full_name })) || [];
  }

  const [nRes, rRes] = await Promise.all([
    supabase
      .from("coach_nutrition_recommendations")
      .select("*")
      .eq("coach_id", userId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("coach_recovery_recommendations")
      .select("*")
      .eq("coach_id", userId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  return {
    nutritionRecos: (nRes.data || []).map((r: any) => ({
      ...r,
      student_name: r.student_id ? studentMap.get(r.student_id) : undefined,
    })),
    recoveryRecos: (rRes.data || []).map((r: any) => ({
      ...r,
      student_name: r.student_id ? studentMap.get(r.student_id) : undefined,
    })),
    students: studentsList,
  };
}

export const useCoachRecommendations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["coach-recommendations", user?.id];

  const { data, isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchAll(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const saveNutritionReco = async (reco: Partial<NutritionRecommendation>) => {
    if (!user) return;
    if (reco.id) {
      const { error } = await supabase
        .from("coach_nutrition_recommendations")
        .update({ ...reco, coach_id: undefined, id: undefined } as any)
        .eq("id", reco.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("coach_nutrition_recommendations")
        .insert({ ...reco, coach_id: user.id } as any);
      if (error) throw error;
    }
    invalidate();
  };

  const deleteNutritionReco = async (id: string) => {
    await supabase.from("coach_nutrition_recommendations").delete().eq("id", id);
    invalidate();
  };

  const saveRecoveryReco = async (reco: Partial<RecoveryRecommendation>) => {
    if (!user) return;
    if (reco.id) {
      const { error } = await supabase
        .from("coach_recovery_recommendations")
        .update({ ...reco, coach_id: undefined, id: undefined } as any)
        .eq("id", reco.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("coach_recovery_recommendations")
        .insert({ ...reco, coach_id: user.id } as any);
      if (error) throw error;
    }
    invalidate();
  };

  const deleteRecoveryReco = async (id: string) => {
    await supabase.from("coach_recovery_recommendations").delete().eq("id", id);
    invalidate();
  };

  return {
    nutritionRecos: data?.nutritionRecos || [],
    recoveryRecos: data?.recoveryRecos || [],
    students: data?.students || [],
    loading,
    saveNutritionReco,
    deleteNutritionReco,
    saveRecoveryReco,
    deleteRecoveryReco,
    refetch: invalidate,
  };
};
