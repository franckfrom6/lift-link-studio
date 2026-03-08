import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ProgressPhoto {
  id: string;
  date: string;
  photo_url: string;
  category: string;
  notes: string | null;
}

export const useProgressPhotos = () => {
  const { user } = useAuth();
  const { t } = useTranslation("dashboard");
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("student_id", user.id)
      .order("date", { ascending: false });
    if (data) setPhotos(data as ProgressPhoto[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [user]);

  const uploadPhoto = async (file: File, category: string, date: string, notes?: string) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("progress-photos")
      .upload(path, file);
    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("progress-photos").getPublicUrl(path);
    const { error } = await supabase.from("progress_photos").insert({
      student_id: user.id,
      date,
      photo_url: urlData.publicUrl,
      category,
      notes: notes || null,
    });
    if (!error) {
      toast.success(t("photo_uploaded"));
      fetchPhotos();
    }
  };

  return { photos, loading, uploadPhoto };
};
