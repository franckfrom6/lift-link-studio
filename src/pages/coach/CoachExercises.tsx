import { useState, useMemo } from "react";
import { Dumbbell, Search, Film, Video, Plus, Pencil, Loader2 } from "lucide-react";
import { useExerciseSearch, highlightMatch } from "@/hooks/useExerciseSearch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoachExercises } from "@/hooks/useCoachExercises";
import { MUSCLE_GROUPS } from "@/types/coach";
import { useTranslation } from "react-i18next";
import { getExerciseName, getMuscleGroupLabel, getEquipmentLabel } from "@/lib/exercise-utils";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CreateExerciseModal from "@/components/coach/CreateExerciseModal";
import EditExerciseModal from "@/components/coach/EditExerciseModal";
import { Exercise } from "@/types/exercise";

const CoachExercises = () => {
  const { exercises, isLoading: loading, isCustomExercise } = useCoachExercises();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [videoEdits, setVideoEdits] = useState<Record<string, { video_url: string; video_url_female: string; video_url_male: string }>>({});
  const [saving, setSaving] = useState(false);
  const [suggestExId, setSuggestExId] = useState<string | null>(null);
  const [suggestUrl, setSuggestUrl] = useState("");
  const [suggestGender, setSuggestGender] = useState<string>("both");
  const [suggestNote, setSuggestNote] = useState("");
  const [suggestSending, setSuggestSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const { t } = useTranslation('exercises');
  const isAdvanced = useIsAdvanced();

  const EQUIPMENT_LIST = [...new Set(exercises.map(e => e.equipment))].filter(Boolean).sort();

  const filtered = exercises.filter((ex) => {
    const name = getExerciseName(ex);
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !selectedMuscle || ex.muscle_group === selectedMuscle;
    const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  // Sort: custom exercises first
  const sorted = [...filtered].sort((a, b) => {
    const aCustom = isCustomExercise(a.id) ? 0 : 1;
    const bCustom = isCustomExercise(b.id) ? 0 : 1;
    if (aCustom !== bCustom) return aCustom - bCustom;
    return 0;
  });

  const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = [];
    acc[ex.muscle_group].push(ex);
    return acc;
  }, {});

  const getVideoEdits = (ex: any) => {
    if (videoEdits[ex.id]) return videoEdits[ex.id];
    return {
      video_url: (ex as any).video_url || "",
      video_url_female: (ex as any).video_url_female || "",
      video_url_male: (ex as any).video_url_male || "",
    };
  };

  const updateVideoEdit = (exId: string, field: string, value: string) => {
    const current = videoEdits[exId] || getVideoEdits(exercises.find(e => e.id === exId));
    setVideoEdits({ ...videoEdits, [exId]: { ...current, [field]: value } });
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url) return true;
    return /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/.test(url);
  };

  const handleSaveVideo = async (exId: string) => {
    const edits = videoEdits[exId];
    if (!edits) return;
    for (const [, url] of Object.entries(edits)) {
      if (url && !isValidYouTubeUrl(url)) {
        toast.error(t('video_url') + ": URL YouTube invalide");
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase.from("exercises").update({
      video_url: edits.video_url || null,
      video_url_female: edits.video_url_female || null,
      video_url_male: edits.video_url_male || null,
    }).eq("id", exId);
    setSaving(false);
    if (error) { toast.error("Error saving"); console.error(error); }
    else { toast.success("✓"); setExpandedId(null); }
  };

  const handleSendSuggestion = async () => {
    if (!suggestExId || !user || !suggestUrl) return;
    if (!isValidYouTubeUrl(suggestUrl)) { toast.error("URL YouTube invalide"); return; }
    setSuggestSending(true);
    const { error } = await supabase.from("video_suggestions").insert({
      exercise_id: suggestExId, suggested_by: user.id, video_url: suggestUrl,
      gender_target: suggestGender, note: suggestNote || null,
    } as any);
    setSuggestSending(false);
    if (error) { console.error(error); toast.error("Error"); }
    else { toast.success(t("suggestion_sent")); setSuggestExId(null); setSuggestUrl(""); setSuggestGender("both"); setSuggestNote(""); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('exercise_library')}</h1>
          <p className="text-muted-foreground text-sm">{t('exercises_available', { count: exercises.length })}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> {t('custom_create_link')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <Input placeholder={t('search_exercise')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-surface" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
        <button onClick={() => setSelectedMuscle(null)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${!selectedMuscle ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{t('all')}</button>
        {MUSCLE_GROUPS.map((mg) => (
          <button key={mg} onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${selectedMuscle === mg ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{getMuscleGroupLabel(mg)}</button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
        <button onClick={() => setSelectedEquipment(null)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${!selectedEquipment ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{t('all')}</button>
        {EQUIPMENT_LIST.map((eq) => (
          <button key={eq} onClick={() => setSelectedEquipment(eq === selectedEquipment ? null : eq)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${selectedEquipment === eq ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{getEquipmentLabel(eq)}</button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([muscle, exs]) => (
          <div key={muscle}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">{getMuscleGroupLabel(muscle)}</h3>
            <div className="grid gap-2">
              {exs.map((ex) => {
                const isExpanded = expandedId === ex.id;
                const edits = getVideoEdits(ex);
                const isCustom = isCustomExercise(ex.id);
                return (
                  <div key={ex.id} className="glass overflow-hidden">
                    <div className="p-3 sm:p-4 flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm">{getExerciseName(ex)}</p>
                          {isCustom && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-accent text-accent-foreground">{t('custom_badge')}</Badge>}
                        </div>
                        {ex.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ex.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAdvanced && <Badge variant="secondary" className="text-[10px]">{t(`type_${ex.type}`, ex.type)}</Badge>}
                        <Badge variant="outline" className="text-[10px]">{getEquipmentLabel(ex.equipment)}</Badge>
                        {isCustom && (
                          <button onClick={() => setEditExercise(ex)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title={t('custom_edit_title')}>
                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : ex.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title={t('video_url')}>
                          <Film className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => { setSuggestExId(ex.id); setSuggestUrl(""); setSuggestGender("both"); setSuggestNote(""); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title={t('suggest_video')}>
                          <Video className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 border-t border-border pt-3">
                        <div><label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">{t('video_url')}</label><Input value={edits.video_url} onChange={(e) => updateVideoEdit(ex.id, "video_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-9 bg-surface text-sm" /></div>
                        <div><label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">{t('video_url_female')}</label><Input value={edits.video_url_female} onChange={(e) => updateVideoEdit(ex.id, "video_url_female", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-9 bg-surface text-sm" /></div>
                        <div><label className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">{t('video_url_male')}</label><Input value={edits.video_url_male} onChange={(e) => updateVideoEdit(ex.id, "video_url_male", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-9 bg-surface text-sm" /></div>
                        <Button size="sm" className="w-full" onClick={() => handleSaveVideo(ex.id)} disabled={saving || !videoEdits[ex.id]}>{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="glass p-12 text-center space-y-3">
            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
            <p className="text-muted-foreground">{t('no_exercise_found')}</p>
          </div>
        )}
      </div>

      <CreateExerciseModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditExerciseModal open={!!editExercise} onClose={() => setEditExercise(null)} exercise={editExercise} />

      <Sheet open={!!suggestExId} onOpenChange={(open) => { if (!open) setSuggestExId(null); }}>
        <SheetContent side="bottom" className="max-h-[80dvh]">
          <SheetHeader><SheetTitle>{t('suggest_video')}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div><label className="text-sm font-medium">{t('video_url')}</label><Input value={suggestUrl} onChange={(e) => setSuggestUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1" /></div>
            <div><label className="text-sm font-medium">{t('gender_target')}</label>
              <Select value={suggestGender} onValueChange={setSuggestGender}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="female">{t('gender_female')}</SelectItem><SelectItem value="male">{t('gender_male')}</SelectItem><SelectItem value="both">{t('gender_both')}</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm font-medium">{t('suggestion_note')}</label><Textarea value={suggestNote} onChange={(e) => setSuggestNote(e.target.value)} placeholder={t('suggestion_note_placeholder')} className="mt-1" rows={2} /></div>
            <Button className="w-full" onClick={handleSendSuggestion} disabled={suggestSending || !suggestUrl}>{suggestSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{t('send_suggestion')}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CoachExercises;
