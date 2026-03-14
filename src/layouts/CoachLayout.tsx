import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, Users, ClipboardList, LayoutDashboard, BookOpen, CreditCard, Shield, HelpCircle, Search, Pin, ChevronLeft } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import InviteClientModal from "@/components/InviteClientModal";
import HelpButton from "@/components/onboarding/HelpButton";
import CoachCommandPalette from "@/components/coach/CoachCommandPalette";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import AISidebarToggle from "@/components/ai/AISidebarToggle";
import AISidebar from "@/components/ai/AISidebar";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import { useCoachDashboard } from "@/hooks/useCoachDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CoachLayout = () => {
  const { t } = useTranslation(['settings', 'common', 'program', 'dashboard']);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { students, kpis } = useCoachDashboard();

  // Pinned students from localStorage
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("coach_pinned_students") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("coach_pinned_students", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (id: string) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const pinnedStudents = students.filter(s => pinnedIds.includes(s.id));

  const navItems = [
    { to: "/coach", icon: LayoutDashboard, label: t('settings:nav_dashboard'), end: true },
    { to: "/coach/students", icon: Users, label: t('settings:nav_students') },
    { to: "/coach/programs", icon: ClipboardList, label: t('settings:nav_programs') },
    { to: "/coach/exercises", icon: Dumbbell, label: t('settings:nav_exercises') },
    { to: "/coach/recommendations", icon: BookOpen, label: t('settings:nav_recommendations') },
    { to: "/pricing", icon: CreditCard, label: t('settings:nav_plans') },
    { to: "/support", icon: HelpCircle, label: t('settings:nav_support') },
    ...(profile?.is_admin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <CoachCommandPalette />

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-secondary/50 shrink-0 transition-all duration-200",
        collapsed ? "w-[60px] p-2" : "w-[220px] lg:w-[260px] p-4"
      )}>
        <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
          {!collapsed && <Logo variant="header" />}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} strokeWidth={1.5} />
          </Button>
        </div>

        {/* Cmd+K hint */}
        {!collapsed && (
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-card border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="flex-1 text-left">{t('dashboard:search_student')}</span>
            <kbd className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        )}

        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  collapsed ? "justify-center p-2.5" : "px-3 py-2",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="relative">
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {/* Notification badge on students */}
                {item.to === "/coach/students" && kpis.alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {kpis.alertCount > 9 ? "9+" : kpis.alertCount}
                  </span>
                )}
              </div>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Pinned students */}
        {!collapsed && pinnedStudents.length > 0 && (
          <div className="border-t border-border pt-3 mt-3 space-y-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
              <Pin className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
              {t('dashboard:pinned', 'Épinglés')}
            </p>
            {pinnedStudents.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/coach/students/${s.id}`)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0">
                  {s.avatar}
                </div>
                <span className="truncate">{s.name}</span>
                {s.alerts.filter(a => a !== "swaps").length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className={cn("border-t border-border pt-3 space-y-2", collapsed && "pt-2")}>
          {!collapsed && <InviteClientModal />}
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
            {!collapsed && <p className="text-sm font-medium truncate">{profile?.full_name || t('common:roles.coach')}</p>}
            <UserMenu />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-background">
          <Logo variant="mobile" />
          <div className="flex items-center gap-1">
            <HelpButton />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto"><Outlet /></div>
        </main>

        <MobileBottomNav items={navItems} />
      </div>

      <AISidebarToggle onClick={() => setAiOpen(true)} />
      <AISidebar open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default CoachLayout;
