import { Outlet, NavLink } from "react-router-dom";
import { Calendar, BarChart3, User, BookOpen, HelpCircle } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import HelpButton from "@/components/onboarding/HelpButton";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import AISidebarToggle from "@/components/ai/AISidebarToggle";
import AISidebar from "@/components/ai/AISidebar";

const StudentLayout = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [aiOpen, setAiOpen] = useState(false);

  const navItems = [
    { to: "/student", icon: Calendar, label: t('settings:nav_week'), end: true },
    { to: "/student/progress", icon: BarChart3, label: t('settings:nav_progress') },
    { to: "/student/recommendations", icon: BookOpen, label: t('settings:nav_recommendations') },
    { to: "/student/profile", icon: User, label: t('settings:nav_profile') },
    { to: "/support", icon: HelpCircle, label: t('settings:nav_support') },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <ImpersonationBanner />

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col w-[220px] lg:w-[260px] border-r border-border bg-secondary/50 p-4 shrink-0">
        <div className="mb-8 px-2">
          <Logo variant="header" />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={(item as any).end}
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

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-sm font-medium truncate">{t('common:roles.student', 'Athlète')}</p>
            <UserMenu />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <Logo variant="mobile" />
          <UserMenu />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around border-t border-border bg-background py-2 px-2 safe-area-bottom">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={(item as any).end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-h-[44px] justify-center py-1 px-2 text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }>
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="truncate max-w-[64px] text-center leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <AISidebarToggle onClick={() => setAiOpen(true)} />
      <AISidebar open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default StudentLayout;
