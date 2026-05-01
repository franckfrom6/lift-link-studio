import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreatePlan, useMealPlan,
} from "@/hooks/useMealPlan";
import MealPlanEditor from "@/components/nutrition/MealPlanEditor";

/** Coach-side full-page editor of an athlete's meal plan. */
const StudentNutritionPlan = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: plan, isLoading: planLoading } = useMealPlan(studentId ?? null);
  const createPlan = useCreatePlan();

  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    if (!studentId) return;
    supabase.from("profiles").select("full_name").eq("user_id", studentId).maybeSingle()
      .then(({ data }) => data && setStudentName(data.full_name));
  }, [studentId]);

  if (!studentId) return null;

  const handleCreate = async () => {
    try {
      await createPlan.mutateAsync({
        studentId,
        coachId: user?.id ?? null,
        name: "Plan nutritionnel",
      });
      toast.success("Plan créé");
    } catch (e: any) {
      toast.error(e?.message || "Impossible de créer le plan");
    }
  };

  return (
    <div className="px-3 py-3 space-y-4 max-w-2xl mx-auto pb-safe-nav">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2"
          onClick={() => navigate(`/coach/students/${studentId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/coach/students")} className="cursor-pointer">
                Athlètes
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(`/coach/students/${studentId}`)} className="cursor-pointer">
                {studentName || "Athlète"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Plan nutritionnel</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {planLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !plan ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <div>
            <h2 className="text-base font-bold">Aucun plan nutritionnel</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Créez un plan vide pour {studentName || "cet athlète"} et commencez à ajouter des repas.
            </p>
          </div>
          <Button onClick={handleCreate} disabled={createPlan.isPending}>
            {createPlan.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Créer un plan nutritionnel
          </Button>
        </div>
      ) : (
        <MealPlanEditor studentId={studentId} asCoach />
      )}
    </div>
  );
};

export default StudentNutritionPlan;