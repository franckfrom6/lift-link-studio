import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Copy, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatLocalDate } from "@/lib/date-utils";

interface DuplicateSessionModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
  programId?: string;
}

const DuplicateSessionModal = ({ open, onClose, sessionId, sessionName, programId }: DuplicateSessionModalProps) => {
  const { t, i18n } = useTranslation(["session", "common"]);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language === "fr" ? fr : enUS;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [newName, setNewName] = useState(`${t("session:duplicate_prefix", "Copie de")} ${sessionName}`);
  const [selectedDate, setSelectedDate] = useState<Date>(tomorrow);
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch source session with sections and exercises
      const { data: source, error: fetchError } = await supabase
        .from("sessions")
        .select(`
          id, name, day_of_week, notes, week_id,
          session_sections(id, name, sort_order, notes, duration_estimate, icon),
          session_exercises(
            id, exercise_id, sort_order, sets, reps_min, reps_max, rest_seconds,
            tempo, rpe_target, suggested_weight, coach_notes, video_url, video_search_query, section_id
          )
        `)
        .eq("id", sessionId)
        .single();

      if (fetchError || !source) throw fetchError || new Error("Session not found");

      // 2. Create new session
      const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
      const { data: newSession, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          name: newName,
          day_of_week: dayOfWeek,
          notes: source.notes,
          is_free_session: true,
          created_by: user.id,
          free_session_date: formatLocalDate(selectedDate),
        })
        .select("id")
        .single();

      if (sessionError || !newSession) throw sessionError;

      // 3. Copy sections and build old->new ID map
      const sectionIdMap: Record<string, string> = {};
      if (source.session_sections?.length) {
        const sortedSections = [...source.session_sections].sort((a, b) => a.sort_order - b.sort_order);
        for (const sec of sortedSections) {
          const { data: newSec } = await supabase
            .from("session_sections")
            .insert({
              session_id: newSession.id,
              name: sec.name,
              sort_order: sec.sort_order,
              notes: sec.notes,
              duration_estimate: sec.duration_estimate,
              icon: sec.icon,
            })
            .select("id")
            .single();
          if (newSec) sectionIdMap[sec.id] = newSec.id;
        }
      }

      // 4. Copy exercises (NOT completed_sets)
      if (source.session_exercises?.length) {
        const exerciseRows = source.session_exercises
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((ex: any) => ({
            session_id: newSession.id,
            section_id: ex.section_id ? (sectionIdMap[ex.section_id] ?? null) : null,
            exercise_id: ex.exercise_id,
            sort_order: ex.sort_order,
            sets: ex.sets,
            reps_min: ex.reps_min,
            reps_max: ex.reps_max,
            rest_seconds: ex.rest_seconds,
            tempo: ex.tempo,
            rpe_target: ex.rpe_target,
            suggested_weight: ex.suggested_weight,
            coach_notes: ex.coach_notes,
            video_url: ex.video_url,
            video_search_query: ex.video_search_query,
          }));

        const { error: exError } = await supabase.from("session_exercises").insert(exerciseRows);
        if (exError) throw exError;
      }

      // 5. Invalidate queries
      if (programId) {
        queryClient.invalidateQueries({ queryKey: ["student-program"] });
      }
      queryClient.invalidateQueries({ queryKey: ["week-data"] });

      toast.success(t("session:duplicate_success", "Séance dupliquée !"));
      onClose();
    } catch (err) {
      console.error("Error duplicating session:", err);
      toast.error(t("session:duplicate_error", "Erreur lors de la duplication."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[80dvh]">
        <SheetHeader>
          <SheetTitle className="text-base flex items-center gap-2">
            <Copy className="w-4 h-4" strokeWidth={1.5} />
            {t("session:duplicate_title", "Dupliquer la séance")}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-xs">{t("session:duplicate_name_label", "Nom de la nouvelle séance")}</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">{t("session:duplicate_date_label", "Date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal mt-1")}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(selectedDate, "PPP", { locale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={d => d && setSelectedDate(d)}
                  className={cn("p-3 pointer-events-auto")}
                  locale={locale}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleDuplicate}
            disabled={loading || !newName.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            {t("session:duplicate_btn", "Dupliquer")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DuplicateSessionModal;
