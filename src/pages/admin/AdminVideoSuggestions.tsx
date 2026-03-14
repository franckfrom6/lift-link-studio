import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Film, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getExerciseName } from "@/lib/exercise-utils";

const AdminVideoSuggestions = () => {
  const { t } = useTranslation("admin");
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["video-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_suggestions")
        .select("*, exercises(name, name_en)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-suggestions"],
    queryFn: async () => {
      const ids = [...new Set(suggestions.map((s: any) => s.suggested_by).filter(Boolean))];
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return data || [];
    },
    enabled: suggestions.length > 0,
  });

  const getProfileName = (userId: string) => {
    const p = profiles.find((p: any) => p.user_id === userId);
    return p?.full_name || "—";
  };

  function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  const handleApprove = async (suggestion: any) => {
    setProcessingId(suggestion.id);
    try {
      const updateField = suggestion.gender_target === "female"
        ? { video_url_female: suggestion.video_url }
        : suggestion.gender_target === "male"
          ? { video_url_male: suggestion.video_url }
          : { video_url_female: suggestion.video_url, video_url_male: suggestion.video_url };

      const { error: exError } = await supabase
        .from("exercises")
        .update(updateField)
        .eq("id", suggestion.exercise_id);

      if (exError) throw exError;

      const { error } = await supabase
        .from("video_suggestions")
        .update({ status: "approved" })
        .eq("id", suggestion.id);

      if (error) throw error;

      toast.success(t("video_approved", "Video approved ✓"));
      queryClient.invalidateQueries({ queryKey: ["video-suggestions"] });
    } catch (e) {
      console.error(e);
      toast.error("Error approving");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("video_suggestions")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      toast.success(t("video_rejected", "Video rejected"));
      queryClient.invalidateQueries({ queryKey: ["video-suggestions"] });
    } catch (e) {
      console.error(e);
      toast.error("Error rejecting");
    } finally {
      setProcessingId(null);
    }
  };

  const pending = suggestions.filter((s: any) => s.status === "pending");
  const reviewed = suggestions.filter((s: any) => s.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">{t("video_suggestions_title", "Video Suggestions")}</h1>
        {pending.length > 0 && (
          <Badge variant="destructive" className="text-xs">{pending.length}</Badge>
        )}
      </div>

      {pending.length === 0 && (
        <div className="glass p-8 text-center text-muted-foreground">
          {t("no_pending_suggestions", "No pending suggestions")}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("pending", "Pending")} ({pending.length})
          </h2>
          {pending.map((s: any) => {
            const ytId = extractYouTubeId(s.video_url);
            const exercise = s.exercises;
            return (
              <div key={s.id} className="glass p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{exercise ? getExerciseName(exercise) : "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("suggested_by", "By")}: {getProfileName(s.suggested_by)} ·{" "}
                      <Badge variant="outline" className="text-[10px]">
                        {s.gender_target === "female" ? "♀" : s.gender_target === "male" ? "♂" : "♀♂"}
                      </Badge>
                    </p>
                    {s.note && <p className="text-xs text-muted-foreground mt-1 italic">"{s.note}"</p>}
                  </div>
                </div>

                {ytId && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black max-w-md">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      loading="lazy"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(s)}
                    disabled={processingId === s.id}
                    className="gap-1"
                  >
                    {processingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {t("approve", "Approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(s.id)}
                    disabled={processingId === s.id}
                    className="gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t("reject", "Reject")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("reviewed", "Reviewed")} ({reviewed.length})
          </h2>
          {reviewed.slice(0, 20).map((s: any) => {
            const exercise = s.exercises;
            return (
              <div key={s.id} className="glass p-3 flex items-center gap-3">
                <Badge variant={s.status === "approved" ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {s.status}
                </Badge>
                <span className="text-sm truncate">{exercise ? getExerciseName(exercise) : "—"}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminVideoSuggestions;
