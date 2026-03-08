import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Loader2, BookOpen, ChevronDown, ChevronUp, Copy } from "lucide-react";
import FeatureGate from "@/components/plans/FeatureGate";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCoachRecommendations } from "@/hooks/useCoachRecommendations";
import CoachRecommendationCard from "@/components/coach/CoachRecommendationCard";
import CoachRecommendationForm from "@/components/coach/CoachRecommendationForm";
import RecommendationCategoryBadge from "@/components/coach/RecommendationCategoryBadge";

interface DbTemplate {
  id: string;
  type: string;
  category: string;
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  trigger_type: string | null;
  trigger_config: any;
  duration_minutes: number | null;
  sort_order: number;
}

const CoachRecommendations = () => {
  const { t, i18n } = useTranslation("recommendations");
  const {
    nutritionRecos,
    recoveryRecos,
    students,
    loading,
    saveNutritionReco,
    deleteNutritionReco,
    saveRecoveryReco,
    deleteRecoveryReco,
  } = useCoachRecommendations();

  const [tab, setTab] = useState<"nutrition" | "recovery">("nutrition");
  const [formOpen, setFormOpen] = useState(false);
  const [editingReco, setEditingReco] = useState<any>(null);
  const [filterScope, setFilterScope] = useState<"all" | "global" | "student">("all");
  const [filterActive, setFilterActive] = useState<"active" | "inactive" | "all">("active");

  // Public templates from DB
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);

  useEffect(() => {
    supabase
      .from("recommendation_templates")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setTemplates(data as any);
        setTemplatesLoading(false);
      });
  }, []);

  const filterRecos = (recos: any[]) => {
    return recos
      .filter((r) => {
        if (filterScope === "global") return !r.student_id;
        if (filterScope === "student") return !!r.student_id;
        return true;
      })
      .filter((r) => {
        if (filterActive === "active") return r.is_active;
        if (filterActive === "inactive") return !r.is_active;
        return true;
      });
  };

  const handleSave = async (data: any) => {
    try {
      if (tab === "nutrition") await saveNutritionReco(data);
      else await saveRecoveryReco(data);
      toast.success(t("saved"));
    } catch {
      toast.error("Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (tab === "nutrition") await deleteNutritionReco(id);
    else await deleteRecoveryReco(id);
    toast.success(t("deleted"));
  };

  const handleUseTemplate = (tpl: DbTemplate) => {
    const lang = i18n.language;
    setEditingReco({
      title: lang === "fr" ? tpl.title_fr : tpl.title_en,
      content: lang === "fr" ? tpl.content_fr : tpl.content_en,
      category: tpl.category,
      trigger_type: tpl.trigger_type || "always",
      trigger_config: tpl.trigger_config || {},
      duration_minutes: tpl.duration_minutes,
    });
    setTab(tpl.type as "nutrition" | "recovery");
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentRecos = tab === "nutrition" ? nutritionRecos : recoveryRecos;
  const filtered = filterRecos(currentRecos);
  const currentTemplates = templates.filter((tpl) => tpl.type === tab);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => { setEditingReco(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> {t("new_recommendation")}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "nutrition" | "recovery")}>
        <TabsList>
          <TabsTrigger value="nutrition">{t("nutrition_tab")}</TabsTrigger>
          <TabsTrigger value="recovery">{t("recovery_tab")}</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Select value={filterScope} onValueChange={(v) => setFilterScope(v as any)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter_all")}</SelectItem>
              <SelectItem value="global">{t("filter_global")}</SelectItem>
              <SelectItem value="student">{t("filter_student")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("filter_active")}</SelectItem>
              <SelectItem value="inactive">{t("filter_inactive")}</SelectItem>
              <SelectItem value="all">{t("filter_all")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="nutrition" className="space-y-2 mt-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("no_recommendations")}</p>
          ) : (
            filtered.map((r) => (
              <CoachRecommendationCard
                key={r.id}
                reco={r}
                onEdit={() => { setEditingReco(r); setFormOpen(true); }}
                onDelete={() => handleDelete(r.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="recovery" className="space-y-2 mt-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("no_recommendations")}</p>
          ) : (
            filtered.map((r) => (
              <CoachRecommendationCard
                key={r.id}
                reco={r}
                onEdit={() => { setEditingReco(r); setFormOpen(true); }}
                onDelete={() => handleDelete(r.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Public library */}
      <div className="border rounded-lg bg-card">
        <button
          onClick={() => setLibraryOpen(!libraryOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold text-base">{t("public_library")}</h2>
              <p className="text-xs text-muted-foreground">{t("public_library_desc")}</p>
            </div>
          </div>
          {libraryOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {libraryOpen && (
          <div className="px-4 pb-4">
            {templatesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : currentTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">—</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {currentTemplates.map((tpl) => {
                  const title = i18n.language === "fr" ? tpl.title_fr : tpl.title_en;
                  const content = i18n.language === "fr" ? tpl.content_fr : tpl.content_en;
                  const isExpanded = expandedTemplateId === tpl.id;

                  return (
                    <div
                      key={tpl.id}
                      className="border rounded-md bg-background p-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className="flex-1 text-left"
                          onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{title}</span>
                            <RecommendationCategoryBadge category={tpl.category} />
                            {tpl.trigger_type && tpl.trigger_type !== "always" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {t(`trigger_${tpl.trigger_type}`)}
                              </span>
                            )}
                            {tpl.duration_minutes && (
                              <span className="text-[10px] text-muted-foreground">⏱ {tpl.duration_minutes} min</span>
                            )}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-7 text-xs gap-1"
                          onClick={() => handleUseTemplate(tpl)}
                        >
                          <Copy className="w-3 h-3" />
                          {t("use_template")}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line border-t pt-2">
                          {content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <CoachRecommendationForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingReco(null); }}
        onSave={handleSave}
        type={tab}
        students={students}
        initial={editingReco}
      />
    </div>
  );
};

export default CoachRecommendations;
