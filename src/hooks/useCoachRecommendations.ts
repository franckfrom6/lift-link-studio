import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { NutritionRecommendation, RecoveryRecommendation } from "@/data/recommendation-templates";

export const useCoachRecommendations = () => {
  const { user } = useAuth();
  const [nutritionRecos, setNutritionRecos] = useState<NutritionRecommendation[]>([]);
  const [recoveryRecos, setRecoveryRecos] = useState<RecoveryRecommendation[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    // Get students for name resolution
    const { data: relations } = await supabase
      .from("coach_students")
      .select("student_id")
      .eq("coach_id", user.id)
      .eq("status", "active");

    const studentIds = relations?.map((r) => r.student_id) || [];
    let studentMap = new Map<string, string>();

    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);
      profiles?.forEach((p) => studentMap.set(p.user_id, p.full_name));
      setStudents(profiles?.map((p) => ({ id: p.user_id, name: p.full_name })) || []);
    }

    // Fetch nutrition recos
    const { data: nRecos } = await supabase
      .from("coach_nutrition_recommendations")
      .select("*")
      .eq("coach_id", user.id)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    setNutritionRecos(
      (nRecos || []).map((r: any) => ({
        ...r,
        student_name: r.student_id ? studentMap.get(r.student_id) : undefined,
      }))
    );

    // Fetch recovery recos
    const { data: rRecos } = await supabase
      .from("coach_recovery_recommendations")
      .select("*")
      .eq("coach_id", user.id)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    setRecoveryRecos(
      (rRecos || []).map((r: any) => ({
        ...r,
        student_name: r.student_id ? studentMap.get(r.student_id) : undefined,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [user]);

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
    await fetchAll();
  };

  const deleteNutritionReco = async (id: string) => {
    await supabase.from("coach_nutrition_recommendations").delete().eq("id", id);
    await fetchAll();
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
    await fetchAll();
  };

  const deleteRecoveryReco = async (id: string) => {
    await supabase.from("coach_recovery_recommendations").delete().eq("id", id);
    await fetchAll();
  };

  return {
    nutritionRecos,
    recoveryRecos,
    students,
    loading,
    saveNutritionReco,
    deleteNutritionReco,
    saveRecoveryReco,
    deleteRecoveryReco,
    refetch: fetchAll,
  };
};
