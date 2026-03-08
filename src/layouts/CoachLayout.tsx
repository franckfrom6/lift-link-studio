import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, Users, ClipboardList, LayoutDashboard, BookOpen, CreditCard, Shield, HelpCircle, MoreHorizontal } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import InviteClientModal from "@/components/InviteClientModal";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CoachLayout = () => {
  const { t } = useTranslation(['settings', 'common']);
  const { profile } = useAuth();
  const navigate = useNavigate();

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

  // Mobile: show first 4 items + "More" dropdown for the rest
  const mobileMainItems = navItems.slice(0, 4);
  const mobileOverflowItems = navItems.slice(4);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-secondary/50 p-4 shrink-0">
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

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-background">
          <Logo variant="mobile" />
          <UserMenu />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-4xl mx-auto"><Outlet /></div>
        </main>

        <nav className="md:hidden flex items-center justify-around border-t border-border bg-background py-1.5 px-0.5 safe-area-bottom">
          {mobileMainItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={(item as any).end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }>
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="truncate max-w-[52px] text-center leading-tight">{item.label}</span>
            </NavLink>
          ))}
          {mobileOverflowItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
                <span className="leading-tight">{t('common:more', 'Plus')}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="mb-2">
                {mobileOverflowItems.map((item) => (
                  <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)} className="gap-2">
                    <item.icon className="w-4 h-4" strokeWidth={1.5} />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </div>
  );
};

export default CoachLayout;
