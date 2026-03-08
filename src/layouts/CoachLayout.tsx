import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, Users, ClipboardList, LayoutDashboard, BookOpen, CreditCard, Shield, HelpCircle } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import InviteClientModal from "@/components/InviteClientModal";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const CoachLayout = () => {
  const { t } = useTranslation(['settings', 'common']);
  const { profile } = useAuth();

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

        <div className="border-t border-border pt-4 space-y-2">
          <InviteClientModal />
          <div className="flex items-center justify-between px-2">
            <p className="text-sm font-medium truncate">{profile?.full_name || t('common:roles.coach')}</p>
            <UserMenu />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <Logo variant="mobile" />
          <UserMenu />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto"><Outlet /></div>
        </main>

        <nav className="md:hidden flex items-center justify-around border-t border-border bg-background py-2 px-4">
          {navItems.slice(0, 5).map((item) => (
            <NavLink key={item.to} to={item.to} end={(item as any).end}
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
