import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell, ChevronLeft, ChevronRight, Ruler, Moon, Calendar, Volume2, Play,
  CreditCard, Receipt, Shield, Download, HelpCircle, Mail, FileText,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentPlan } from "@/providers/PlanProvider";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import NotificationSettings from "@/components/student/NotificationSettings";
import NutritionProfileForm, { NutritionProfileData } from "@/components/nutrition/NutritionProfileForm";

// ───────────────────────── Helpers

const initials = (name?: string | null, fallback = "AT") => {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || fallback;
};

const fmtMonthYear = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const APP_VERSION = "v2.4.1";

// ───────────────────────── Atoms

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-full transition-colors"
      style={{
        width: 36, height: 20,
        background: checked ? "hsl(var(--primary))" : "hsl(var(--border-strong, var(--input)))",
      }}
    >
      <span
        className="absolute top-[2px] rounded-full bg-white transition-[left]"
        style={{
          width: 16, height: 16,
          left: checked ? 18 : 2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          transitionDuration: "150ms",
        }}
      />
    </button>
  );
}

function Row({
  icon: Icon, label, value, last, toggle, onToggle, onClick,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  last?: boolean;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onClick?: () => void;
}) {
  const interactive = !!onClick && toggle === undefined;
  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={`flex items-center gap-3 px-3.5 py-3 ${last ? "" : "border-b border-border"} ${interactive ? "cursor-pointer active:bg-secondary/60" : ""} min-h-[44px]`}
    >
      <div className="w-[26px] h-[26px] rounded-[2px] bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
        <Icon className="w-[13px] h-[13px]" strokeWidth={1.75} />
      </div>
      <span className="flex-1 text-[13px] font-medium text-foreground">{label}</span>
      {toggle !== undefined ? (
        <div onClick={(e) => e.stopPropagation()}>
          <Toggle checked={!!toggle} onChange={(v) => onToggle?.(v)} label={label} />
        </div>
      ) : (
        <>
          {value && <span className="tabular text-[12px] text-muted-foreground font-medium">{value}</span>}
          <ChevronRight className="w-[13px] h-[13px] text-muted-foreground/70" strokeWidth={1.75} />
        </>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="px-5 pb-2">
        <span className="t-caption text-[10px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="px-4">
        <div className="bg-card border border-border rounded-md overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// ───────────────────────── Page

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { plan, subscription } = useCurrentPlan();

  const [coach, setCoach] = useState<{ name: string; nextSession: string | null } | null>(null);
  const [stats, setStats] = useState({ sessions: 0, weeks: 0, prs: 0 });

  // Local prefs (with optimistic update)
  const [units, setUnits] = useState<"metric" | "imperial">((profile?.unit_preference as any) ?? "metric");
  const [weekStart, setWeekStart] = useState<string>((profile as any)?.week_start ?? "monday");
  const [restSound, setRestSound] = useState<boolean>((profile as any)?.rest_timer_sound ?? true);
  const [autoTimer, setAutoTimer] = useState<boolean>((profile as any)?.auto_start_timer ?? true);

  useEffect(() => {
    if (!profile) return;
    setUnits((profile.unit_preference as any) ?? "metric");
    setWeekStart((profile as any).week_start ?? "monday");
    setRestSound((profile as any).rest_timer_sound ?? true);
    setAutoTimer((profile as any).auto_start_timer ?? true);
  }, [profile]);

  // Sheets
  const [openSheet, setOpenSheet] = useState<null | "units" | "theme" | "week" | "notifications" | "nutrition" | "security" | "billing">(null);

  // Load coach + stats
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      // Coach
      const { data: cs } = await supabase
        .from("coach_students")
        .select("coach_id")
        .eq("student_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (cs?.coach_id) {
        const { data: cp } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", cs.coach_id)
          .maybeSingle();
        if (!cancelled) {
          setCoach({
            name: cp?.full_name ?? "Coach",
            nextSession: null,
          });
        }
      }

      // Stats — sessions completed
      const { count: sessionsCount } = await supabase
        .from("completed_sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id)
        .not("completed_at", "is", null);

      // PRs ≈ failure sets count proxy: use distinct exercises with completed_sets as a simple total volume signal
      const { count: setsCount } = await supabase
        .from("completed_sets")
        .select("id", { count: "exact", head: true })
        .eq("is_failure", false);

      // Streak weeks: count distinct ISO weeks with at least one completed session
      const { data: weeksRows } = await supabase
        .from("completed_sessions")
        .select("completed_at")
        .eq("student_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(200);

      let streak = 0;
      if (weeksRows && weeksRows.length) {
        const weekKey = (d: Date) => {
          const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          const day = tmp.getUTCDay() || 7;
          tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
          const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          return `${tmp.getUTCFullYear()}-${weekNo}`;
        };
        const seen = new Set<string>();
        let current = weekKey(new Date());
        for (const r of weeksRows) {
          const k = weekKey(new Date(r.completed_at as string));
          if (!seen.has(k)) seen.add(k);
        }
        // count distinct weeks (simple approximation of "weeks suivies")
        streak = seen.size;
      }

      if (!cancelled) {
        setStats({
          sessions: sessionsCount ?? 0,
          weeks: streak,
          prs: Math.min(setsCount ?? 0, 9999),
        });
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Persist a profile field
  const updateProfile = async (patch: Record<string, any>) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) { toast.error("Échec de la mise à jour"); console.error(error); return; }
    refreshProfile();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleExport = async () => {
    if (!user) return;
    toast.info("Préparation de l'export…");
    const { data, error } = await supabase
      .from("completed_sets")
      .select("set_number, reps, weight, duration_seconds, rpe_actual, is_failure, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) { toast.error("Export impossible"); return; }
    const headers = ["set_number", "reps", "weight", "duration_seconds", "rpe_actual", "is_failure", "created_at"];
    const csv = [headers.join(",")].concat(
      (data ?? []).map((r: any) => headers.map((h) => r[h] ?? "").join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `f6gym-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé");
  };

  const userName = profile?.full_name ?? user?.email?.split("@")[0] ?? "Athlète";
  const userInitials = useMemo(() => initials(profile?.full_name ?? user?.email), [profile, user]);

  const themeLabel = theme === "dark" ? "Sombre" : theme === "light" ? "Clair" : "Système";
  const unitsLabel = units === "imperial" ? "lb" : "kg";
  const weekLabel = weekStart === "sunday" ? "dimanche" : "lundi";

  return (
    <div className="-m-4 md:-m-8 min-h-[100dvh] bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <div
        className="sticky top-0 z-20 bg-background border-b border-border flex items-center justify-between"
        style={{ padding: "14px 20px" }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors h-11 w-11 -ml-3 justify-center"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="text-[18px] font-bold tracking-[-0.02em]">Profil</div>
        </div>
        <button
          aria-label="Notifications"
          onClick={() => setOpenSheet("notifications")}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground border border-border bg-card"
        >
          <Bell className="w-[14px] h-[14px]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-3.5" style={{ padding: "20px 20px 16px" }}>
        <div
          className="w-14 h-14 rounded-md flex items-center justify-center text-[18px] font-bold tracking-[-0.02em] shrink-0"
          style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
        >
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-bold tracking-[-0.02em] truncate">{userName}</div>
          <div className="text-[12px] text-muted-foreground truncate mt-0.5">{user?.email}</div>
          <div className="t-caption text-[9px] text-muted-foreground/70 mt-1 normal-case tracking-normal font-medium">
            Membre depuis {fmtMonthYear(user?.created_at)}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-4 mb-5 rounded-md border border-border bg-card grid grid-cols-3">
        {[
          { value: stats.sessions, label: "Séances" },
          { value: stats.weeks, label: "Semaines suivies", border: true },
          { value: stats.prs, label: "Sets validés" },
        ].map((c, i) => (
          <div
            key={i}
            className="text-center py-3"
            style={{
              borderLeft: c.border ? "1px solid hsl(var(--border))" : undefined,
              borderRight: c.border ? "1px solid hsl(var(--border))" : undefined,
            }}
          >
            <div className="tabular text-[18px] font-bold tracking-[-0.02em] text-foreground">{c.value}</div>
            <div className="t-caption text-[9px] text-muted-foreground/70 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Coach card */}
      {coach && (
        <Link
          to="/student/recommendations"
          className="mx-4 mb-5 px-3.5 py-3.5 rounded-md border border-border bg-card flex items-center gap-3 active:bg-secondary/60"
        >
          <div
            className="w-[38px] h-[38px] rounded-sm flex items-center justify-center text-[13px] font-bold shrink-0"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
          >
            {initials(coach.name, "CO")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-caption text-[9px] text-muted-foreground/70 mb-0.5">Coach</div>
            <div className="text-[14px] font-bold tracking-[-0.01em] truncate">{coach.name}</div>
            <div className="tabular text-[11px] text-muted-foreground mt-0.5 font-medium truncate">
              {coach.nextSession
                ? `Prochaine séance · ${fmtDate(coach.nextSession)}`
                : "Aucune séance planifiée"}
            </div>
          </div>
          <ChevronRight className="w-[14px] h-[14px] text-muted-foreground/70 shrink-0" strokeWidth={1.75} />
        </Link>
      )}

      {/* Sections */}
      <Section label="Préférences">
        <Row icon={Ruler} label="Unités" value={unitsLabel} onClick={() => setOpenSheet("units")} />
        <Row icon={Moon} label="Apparence" value={themeLabel} onClick={() => setOpenSheet("theme")} />
        <Row icon={Calendar} label="Début de semaine" value={weekLabel} onClick={() => setOpenSheet("week")} />
        <Row icon={Volume2} label="Son du timer" toggle={restSound} onToggle={(v) => { setRestSound(v); updateProfile({ rest_timer_sound: v }); }} />
        <Row icon={Play} label="Auto-start timer repos" last toggle={autoTimer} onToggle={(v) => { setAutoTimer(v); updateProfile({ auto_start_timer: v }); }} />
      </Section>

      <Section label="Nutrition">
        <Row icon={Bell} label="Notifications" onClick={() => setOpenSheet("notifications")} />
        <Row icon={CreditCard} label="Mon profil nutrition" last onClick={() => setOpenSheet("nutrition")} />
      </Section>

      <Section label="Compte">
        <Row icon={CreditCard} label="Abonnement" value={plan?.displayNameFr ?? plan?.name ?? "—"} onClick={() => navigate("/pricing")} />
        <Row icon={Receipt} label="Prochain prélèvement" value={fmtDate(subscription?.current_period_end)} />
        <Row icon={Shield} label="Sécurité" onClick={() => navigate("/auth?reset=1")} />
        <Row icon={Download} label="Exporter mes données" last onClick={handleExport} />
      </Section>

      <Section label="Support">
        <Row icon={HelpCircle} label="Centre d'aide" onClick={() => navigate("/support")} />
        <Row icon={Mail} label="Contacter From6" onClick={() => { window.location.href = "mailto:support@f6gym.com"; }} />
        <Row icon={FileText} label="CGU & confidentialité" last onClick={() => navigate("/legal")} />
      </Section>

      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-border rounded-md text-[13px] font-semibold text-destructive bg-card active:bg-secondary/60"
        >
          Se déconnecter
        </button>
        <div className="t-caption tabular text-[9px] text-muted-foreground/70 text-center mt-3.5 normal-case tracking-normal">
          F6GYM · {APP_VERSION}
        </div>
      </div>

      {/* ───────── Sheets ───────── */}

      <Sheet open={openSheet === "units"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Unités</SheetTitle>
            <SheetDescription>Choisis l'unité de poids affichée.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => { setUnits(u); updateProfile({ unit_preference: u }); setOpenSheet(null); }}
                className={`w-full text-left px-4 py-3 rounded-md border ${units === u ? "border-primary bg-accent" : "border-border bg-card"} text-[14px] font-medium`}
              >
                {u === "metric" ? "Métrique (kg, cm)" : "Impérial (lb, in)"}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSheet === "theme"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Apparence</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpenSheet(null); }}
                className={`w-full text-left px-4 py-3 rounded-md border ${theme === t ? "border-primary bg-accent" : "border-border bg-card"} text-[14px] font-medium`}
              >
                {t === "system" ? "Système" : t === "light" ? "Clair" : "Sombre"}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSheet === "week"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Début de semaine</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            {(["monday", "sunday"] as const).map((w) => (
              <button
                key={w}
                onClick={() => { setWeekStart(w); updateProfile({ week_start: w }); setOpenSheet(null); }}
                className={`w-full text-left px-4 py-3 rounded-md border ${weekStart === w ? "border-primary bg-accent" : "border-border bg-card"} text-[14px] font-medium capitalize`}
              >
                {w === "monday" ? "Lundi" : "Dimanche"}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSheet === "notifications"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <NotificationSettings />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSheet === "nutrition"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Profil nutrition</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <NutritionProfileSheet onClose={() => setOpenSheet(null)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Lightweight nutrition profile sheet — keeps prior behaviour
function NutritionProfileSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [initial, setInitial] = useState<NutritionProfileData | null>(null);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("nutrition_profiles")
        .select("*")
        .eq("student_id", user.id)
        .maybeSingle();
      if (data) {
        setInitial({
          height_cm: data.height_cm ?? 0,
          weight_kg: data.weight_kg ?? 0,
          age: data.age ?? 0,
          sex: (data.sex as any) ?? "male",
          activity_multiplier: data.activity_multiplier ?? 1.55,
          objective: (data.objective as any) ?? "maintenance",
          bmr: data.bmr ?? 0,
          tdee: data.tdee ?? 0,
          calorie_target: data.calorie_target ?? 0,
          protein_g: data.protein_g ?? 0,
          carbs_g: data.carbs_g ?? 0,
          fat_g: data.fat_g ?? 0,
          dietary_restrictions: data.dietary_restrictions ?? [],
          allergies: data.allergies ?? [],
        });
      }
    })();
  }, [user]);
  return (
    <NutritionProfileForm
      initialData={initial}
      onSubmit={async (d) => {
        if (!user) return;
        const { error } = await (supabase.from("nutrition_profiles") as any).upsert({
          student_id: user.id, ...d, updated_by: user.id,
        }, { onConflict: "student_id" });
        if (error) { toast.error("Erreur"); return; }
        toast.success("Profil nutrition enregistré");
        onClose();
      }}
    />
  );
}

export default StudentProfile;
