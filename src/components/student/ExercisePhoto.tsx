import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExercisePhotoProps {
  sessionExerciseId: string;
  completedSessionId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const MAX_PHOTOS = 2;

const ExercisePhoto = ({ sessionExerciseId, completedSessionId, photos, onPhotosChange }: ExercisePhotoProps) => {
  const { t } = useTranslation("exercises");
  const { user } = useAuth();
  const isAdvanced = useIsAdvanced();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");

  const handleUpload = async (file: File) => {
    if (!user || photos.length >= MAX_PHOTOS) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${completedSessionId}/${sessionExerciseId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("exercise-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("exercise-photos")
        .getPublicUrl(path);

      onPhotosChange([...photos, urlData.publicUrl]);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(t("photo_upload_error", "Erreur upload photo"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-center gap-2">
      {/* Photo thumbnails */}
      {photos.map((url, i) => (
        <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-border">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => removePhoto(i)}
            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}

      {/* Upload button */}
      {photos.length < MAX_PHOTOS && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center",
              "text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors",
              uploading && "opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default ExercisePhoto;
