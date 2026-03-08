import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCoachRecommendations } from "@/hooks/useCoachRecommendations";
import CoachRecommendationCard from "@/components/coach/CoachRecommendationCard";
import CoachRecommendationForm from "@/components/coach/CoachRecommendationForm";

const CoachRecommendations = () => {
  const { t } = useTranslation("recommendations");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentRecos = tab === "nutrition" ? nutritionRecos : recoveryRecos;
  const filtered = filterRecos(currentRecos);

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
