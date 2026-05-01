import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, MessageSquare, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMealPlan, useCreatePlan } from "@/hooks/useMealPlan";
import MealPlanEditor from "@/components/nutrition/MealPlanEditor";

/** Athlete-side meal plan: read-only by default, editable when athlete_can_edit. */
const StudentNutritionPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id ?? null;
  const { data: plan, isLoading } = useMealPlan(studentId);
  const createPlan = useCreatePlan();

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [hasCoach, setHasCoach] = useState<boolean | null>(null);

  useEffect(() => {
    if (!studentId) return;
    supabase.from("coach_students")
      .select("coach_id").eq("student_id", studentId).eq("status", "active").maybeSingle()
      .then(({ data }) => setHasCoach(!!data));
  }, [studentId]);

  if (!studentId) return null;

  const canEdit = !!plan && (plan.athlete_can_edit || plan.coach_id === null);

  const submitRequest = async () => {
    if (!plan || !plan.coach_id) return;
    const { error } = await supabase.from("meal_plan_change_requests").insert({
      plan_id: plan.id,
      student_id: studentId,
      coach_id: plan.coach_id,
      message: requestMsg.trim(),
    });
    if (error) { toast.error("Erreur lors de l'envoi"); return; }
    toast.success("Demande envoyée à ton coach");
    setRequestOpen(false); setRequestMsg("");
  };

  return (
    <div className="px-3 py-3 space-y-4 max-w-2xl mx-auto pb-safe-nav">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => navigate("/student/nutrition")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-base font-bold">Plan nutritionnel</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : !plan ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <div>
            <h2 className="text-base font-bold">Aucun plan nutritionnel</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {hasCoach
                ? "Ton coach n'a pas encore créé de plan."
                : "Crée un plan personnel pour commencer."}
            </p>
          </div>
          {!hasCoach && (
            <Button
              onClick={() => createPlan.mutate({ studentId, coachId: null, name: "Mon plan nutritionnel" })}
              disabled={createPlan.isPending}
            >
              Créer mon plan
            </Button>
          )}
        </div>
      ) : (
        <>
          {!canEdit && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold">Plan verrouillé par ton coach</p>
                <p className="text-[11px] text-muted-subtle mt-0.5">
                  Pour toute modification, fais une demande à ton coach.
                </p>
              </div>
              <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Demander
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Demander une modification</DialogTitle></DialogHeader>
                  <Textarea
                    value={requestMsg} onChange={(e) => setRequestMsg(e.target.value)}
                    placeholder="Ex: J'aimerais ajouter une collation post-training…"
                    className="min-h-[100px]"
                  />
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setRequestOpen(false)}>Annuler</Button>
                    <Button onClick={submitRequest} disabled={requestMsg.trim().length === 0}>Envoyer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <MealPlanEditor
            studentId={studentId}
            asCoach={false}
            asAthlete
            readOnly={!canEdit}
          />
        </>
      )}
    </div>
  );
};

export default StudentNutritionPlan;