import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, Users, ClipboardList, LogOut, LayoutDashboard, BookOpen, CreditCard, Shield, HelpCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const CoachLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['settings', 'common']);
  const { profile } = useAuth();

  const handleSignOut = () => {
    navigate("/auth");
  };

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
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-secondary/50 p-4">
        <div className="mb-8 px-2">
          <Logo variant="header" />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }>
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">C</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t('common:roles.coach')}</p>
            </div>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors">
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            {t('common:logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <Logo variant="mobile" />
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto"><Outlet /></div>
        </main>

        <nav className="md:hidden flex items-center justify-around border-t border-border bg-background py-2 px-4">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }>
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CoachLayout;
