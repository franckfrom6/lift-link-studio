import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  NUTRITION_CATEGORIES,
  RECOVERY_CATEGORIES,
  NUTRITION_TRIGGER_TYPES,
  RECOVERY_TRIGGER_TYPES,
  MUSCLE_GROUPS,
  NUTRITION_TEMPLATES,
  RECOVERY_TEMPLATES,
  type RecommendationTemplate,
} from "@/data/recommendation-templates";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  type: "nutrition" | "recovery";
  students: { id: string; name: string }[];
  initial?: any;
}

const DAYS = [
  { value: 1, key: "day_mon" },
  { value: 2, key: "day_tue" },
  { value: 3, key: "day_wed" },
  { value: 4, key: "day_thu" },
  { value: 5, key: "day_fri" },
  { value: 6, key: "day_sat" },
  { value: 7, key: "day_sun" },
];

const CoachRecommendationForm = ({ open, onClose, onSave, type, students, initial }: Props) => {
  const { t, i18n } = useTranslation("recommendations");
  const categories = type === "nutrition" ? NUTRITION_CATEGORIES : RECOVERY_CATEGORIES;
  const triggerTypes = type === "nutrition" ? NUTRITION_TRIGGER_TYPES : RECOVERY_TRIGGER_TYPES;
  const templates = type === "nutrition" ? NUTRITION_TEMPLATES : RECOVERY_TEMPLATES;

  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [category, setCategory] = useState(initial?.category || categories[0]);
  const [forWho, setForWho] = useState<"global" | "student">(initial?.student_id ? "student" : "global");
  const [studentId, setStudentId] = useState<string>(initial?.student_id || "");
  const [triggerType, setTriggerType] = useState(initial?.trigger_type || "always");
  const [triggerConfig, setTriggerConfig] = useState<any>(initial?.trigger_config || {});
  const [priority, setPriority] = useState<number>(initial?.priority || 2);
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [durationMin, setDurationMin] = useState<string>(initial?.duration_minutes?.toString() || "");
  const [isActive] = useState(initial?.is_active !== false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: any = {
        title,
        content,
        category,
        student_id: forWho === "student" ? studentId : null,
        trigger_type: triggerType,
        trigger_config: Object.keys(triggerConfig).length > 0 ? triggerConfig : null,
        priority,
        is_active: isActive,
      };
      if (initial?.id) data.id = initial.id;
      if (type === "recovery") {
        data.video_url = videoUrl || null;
        data.duration_minutes = durationMin ? parseInt(durationMin) : null;
      }
      await onSave(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleTemplate = (tpl: RecommendationTemplate) => {
    const lang = i18n.language;
    setTitle(lang === "fr" ? tpl.title_fr : tpl.title_en);
    setContent(lang === "fr" ? tpl.content_fr : tpl.content_en);
    setCategory(tpl.category);
    setTriggerType(tpl.trigger_type);
    if (tpl.trigger_config) setTriggerConfig(tpl.trigger_config);
    if (tpl.duration_minutes) setDurationMin(tpl.duration_minutes.toString());
    setShowTemplates(false);
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const studentName = forWho === "student" ? students.find((s) => s.id === studentId)?.name : null;
      const { data, error } = await supabase.functions.invoke("generate-recommendation", {
        body: {
          type,
          category,
          student_name: studentName,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          lang: i18n.language,
        },
      });
      if (!error && data?.content) {
        setContent(data.content);
        if (data.title && !title) setTitle(data.title);
      }
    } catch (err) {
      console.error("AI generation error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const updateTriggerMuscleGroups = (group: string, checked: boolean) => {
    const current = triggerConfig?.muscle_groups || [];
    const updated = checked ? [...current, group] : current.filter((g: string) => g !== group);
    setTriggerConfig({ ...triggerConfig, muscle_groups: updated });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{initial?.id ? t("edit") : t("new_recommendation")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Template selector */}
          {!initial?.id && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
                {t("from_template")}
              </Button>
              {showTemplates && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                  {templates.filter((tpl) => tpl.category === category || !category).map((tpl, i) => (
                    <button
                      key={i}
                      className="w-full text-left text-sm p-2 rounded hover:bg-accent transition-colors"
                      onClick={() => handleTemplate(tpl)}
                    >
                      {i18n.language === "fr" ? tpl.title_fr : tpl.title_en}
                    </button>
                  ))}
                  {templates.length === 0 && <p className="text-xs text-muted-foreground p-2">—</p>}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <Label>{t("form_title")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Content + AI button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>{t("form_content")} *</Label>
              <Button variant="outline" size="sm" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
                {aiLoading ? t("generating") : t("generate_ai")}
              </Button>
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[120px]" />
          </div>

          {/* For who */}
          <div>
            <Label>{t("form_for_who")}</Label>
            <RadioGroup value={forWho} onValueChange={(v) => setForWho(v as "global" | "student")} className="mt-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="global" id="global" />
                <Label htmlFor="global" className="font-normal">{t("form_all_students")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="font-normal">{t("form_specific_student")}</Label>
              </div>
            </RadioGroup>
            {forWho === "student" && (
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="mt-2"><SelectValue placeholder={t("form_select_student")} /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Category */}
          <div>
            <Label>{t("form_category")} *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{t(`cat_${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trigger */}
          <div>
            <Label>{t("form_trigger")} *</Label>
            <Select value={triggerType} onValueChange={(v) => { setTriggerType(v); setTriggerConfig({}); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {triggerTypes.map((tt) => (
                  <SelectItem key={tt} value={tt}>{t(`trigger_${tt}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Trigger config */}
            {triggerType === "post_session" && (
              <div className="mt-2">
                <Label className="text-xs">{t("form_muscle_groups")}</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {MUSCLE_GROUPS.map((g) => (
                    <button
                      key={g}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        (triggerConfig?.muscle_groups || []).includes(g)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                      onClick={() => updateTriggerMuscleGroups(g, !(triggerConfig?.muscle_groups || []).includes(g))}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {triggerType === "specific_day" && (
              <Select
                value={triggerConfig?.day_of_week?.toString() || ""}
                onValueChange={(v) => setTriggerConfig({ day_of_week: parseInt(v) })}
              >
                <SelectTrigger className="mt-2"><SelectValue placeholder={t("form_day_of_week")} /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>{t(d.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {triggerType === "when_deficit" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-xs">{t("form_macro")}</Label>
                  <Select
                    value={triggerConfig?.macro || "protein"}
                    onValueChange={(v) => setTriggerConfig({ ...triggerConfig, macro: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protein">{t("cat_general") === "General" ? "Protein" : "Protéines"}</SelectItem>
                      <SelectItem value="carbs">{t("cat_general") === "General" ? "Carbs" : "Glucides"}</SelectItem>
                      <SelectItem value="fat">{t("cat_general") === "General" ? "Fats" : "Lipides"}</SelectItem>
                      <SelectItem value="calories">{t("cat_general") === "General" ? "Calories" : "Calories"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("form_threshold")}</Label>
                  <Input
                    type="number"
                    value={triggerConfig?.threshold_pct || 80}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, threshold_pct: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {triggerType === "high_soreness" && (
              <div className="mt-2">
                <Label className="text-xs">{t("form_soreness_min")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={triggerConfig?.soreness_level_min || 3}
                  onChange={(e) => setTriggerConfig({ soreness_level_min: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <Label>{t("form_priority")}</Label>
            <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("priority_high")}</SelectItem>
                <SelectItem value="2">{t("priority_medium")}</SelectItem>
                <SelectItem value="3">{t("priority_low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recovery-specific */}
          {type === "recovery" && (
            <>
              <div>
                <Label>{t("form_video_url")}</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>{t("form_duration")}</Label>
                <Input type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!title || !content || saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {t("save")}
            </Button>
            <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CoachRecommendationForm;
