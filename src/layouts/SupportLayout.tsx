import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import MobileBottomNav, { type NavItem } from "@/components/navigation/MobileBottomNav";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import { Calendar, BarChart3, User, BookOpen, HelpCircle, Apple, LayoutDashboard, Users, ClipboardList, Dumbbell, CreditCard, Shield } from "lucide-react";

const SupportLayout = () => {
  const navigate = useNavigate();
  const { role, profile } = useAuth();
  const { t } = useTranslation(["settings", "common"]);

  const backTo = role === "coach" ? "/coach" : "/student";

  const studentNav: NavItem[] = [
    { to: "/student", icon: Calendar, label: t("settings:nav_week"), end: true },
    { to: "/student/progress", icon: BarChart3, label: t("settings:nav_progress") },
    { to: "/student/nutrition", icon: Apple, label: t("settings:nav_nutrition", "Nutrition") },
    { to: "/student/recommendations", icon: BookOpen, label: t("settings:nav_recommendations") },
    { to: "/student/profile", icon: User, label: t("settings:nav_profile") },
    { to: "/support", icon: HelpCircle, label: t("settings:nav_support") },
  ];

  const coachNav: NavItem[] = [
    { to: "/coach", icon: LayoutDashboard, label: t("settings:nav_dashboard"), end: true },
    { to: "/coach/students", icon: Users, label: t("settings:nav_students") },
    { to: "/coach/programs", icon: ClipboardList, label: t("settings:nav_programs") },
    { to: "/coach/exercises", icon: Dumbbell, label: t("settings:nav_exercises") },
    { to: "/coach/recommendations", icon: BookOpen, label: t("settings:nav_recommendations") },
    { to: "/pricing", icon: CreditCard, label: t("settings:nav_plans") },
    { to: "/support", icon: HelpCircle, label: t("settings:nav_support") },
    ...(profile?.is_admin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
  ];

  const navItems = role === "coach" ? coachNav : studentNav;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky top bar with back button */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label={t("common:back")}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <Logo variant="mobile" />
        <div className="flex-1" />
        <UserMenu />
      </header>

      {/* Desktop header */}
      <header className="hidden md:flex items-center gap-3 px-6 h-14 border-b border-border bg-background">
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          {t("common:back_to_app", "Retour à l'app")}
        </button>
        <div className="flex-1" />
        <Logo variant="compact" />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-safe-nav md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav — same as role layout */}
      <MobileBottomNav items={navItems} />
    </div>
  );
};

export default SupportLayout;
