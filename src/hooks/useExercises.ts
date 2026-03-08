import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/coach";

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_default", true)
        .order("muscle_group")
        .order("name");

      if (!error && data) {
        setExercises(data);
      }
      setLoading(false);
    };

    fetchExercises();
  }, []);

  return { exercises, loading };
};
