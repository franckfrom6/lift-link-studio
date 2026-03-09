import { Outlet, NavLink } from "react-router-dom";
import { Calendar, BarChart3, User, BookOpen, HelpCircle } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import ImpersonationBanner from "@/components/ImpersonationBanner";
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
    <div className="min-h-screen bg-background flex flex-col">
      <ImpersonationBanner />
      <header className="flex items-center justify-between p-4 border-b border-border bg-background">
        <Logo variant="mobile" />
        <UserMenu />
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="flex items-center justify-around border-t border-border bg-background py-2 px-4 safe-area-bottom">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={(item as any).end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-h-[44px] justify-center py-2 px-4 text-xs font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`
            }>
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <AISidebarToggle onClick={() => setAiOpen(true)} />
      <AISidebar open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default StudentLayout;
