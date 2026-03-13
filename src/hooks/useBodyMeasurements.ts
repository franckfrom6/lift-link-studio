import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface BodyMeasurement {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  thigh_cm: number | null;
  arm_cm: number | null;
  notes: string | null;
}

const PAGE_SIZE = 50;

async function fetchMeasurements(studentId: string, page: number): Promise<BodyMeasurement[]> {
  const { data } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  return (data as BodyMeasurement[]) || [];
}

export const useBodyMeasurements = (page = 0) => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const { t } = useTranslation("dashboard");
  const queryClient = useQueryClient();
  const studentId = user ? effectiveStudentId(user.id) : null;

  const { data: measurements = [], isLoading: loading } = useQuery({
    queryKey: ["body-measurements", studentId, page],
    queryFn: () => fetchMeasurements(studentId!, page),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (measurement: Omit<BodyMeasurement, "id">) => {
      if (!studentId) throw new Error("No student ID");
      const { error } = await supabase.from("body_measurements").insert({
        student_id: studentId,
        ...measurement,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("measurement_saved"));
      queryClient.invalidateQueries({ queryKey: ["body-measurements", studentId] });
    },
  });

  const addMeasurement = (measurement: Omit<BodyMeasurement, "id">) => {
    addMutation.mutate(measurement);
  };

  return { measurements, loading, addMeasurement };
};
