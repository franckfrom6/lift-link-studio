import { useState, useEffect } from "react";
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

export const useBodyMeasurements = () => {
  const { user } = useAuth();
  const { effectiveStudentId } = useImpersonation();
  const { t } = useTranslation("dashboard");
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const studentId = user ? effectiveStudentId(user.id) : null;

  const fetchMeasurements = async () => {
    if (!studentId) return;
    const { data } = await supabase
      .from("body_measurements")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(50);
    if (data) setMeasurements(data as BodyMeasurement[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeasurements();
  }, [studentId]);

  const addMeasurement = async (measurement: Omit<BodyMeasurement, "id">) => {
    if (!studentId) return;
    const { error } = await supabase.from("body_measurements").insert({
      student_id: studentId,
      ...measurement,
    });
    if (!error) {
      toast.success(t("measurement_saved"));
      fetchMeasurements();
    }
  };

  return { measurements, loading, addMeasurement };
};
