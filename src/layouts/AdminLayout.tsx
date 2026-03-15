import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Users, Shield, ToggleRight, ArrowLeft, Loader2, MessageSquare, BookOpen, Film, Rocket, MoreHorizontal } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const { profile, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">{t("not_authorized")}</h1>
          <p className="text-sm text-muted-foreground">{t("not_authorized_desc")}</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: "/admin", icon: BarChart3, label: t("dashboard"), end: true },
    { to: "/admin/users", icon: Users, label: t("users") },
    { to: "/admin/features", icon: Shield, label: t("features_plans") },
    { to: "/admin/overrides", icon: ToggleRight, label: t("overrides") },
    { to: "/admin/support", icon: MessageSquare, label: "Support" },
    { to: "/admin/kb", icon: BookOpen, label: "KB" },
    { to: "/admin/videos", icon: Film, label: "Videos" },
    { to: "/admin/pilot", icon: Rocket, label: "Pilot" },
  ];

  const backTo = role === "coach" ? "/coach" : "/student";

  // Mobile: show first 4 items + overflow menu
  const mobileMainItems = navItems.slice(0, 4);
  const mobileOverflowItems = navItems.slice(4);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-[220px] lg:w-[260px] border-r border-border bg-secondary/50 p-4 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Logo variant="compact" />
          <span className="font-bold text-lg tracking-tight">{t("title")}</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-4 space-y-1">
          <div className="flex items-center justify-end gap-2 px-3 py-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            {t("back_to_app")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            <span className="font-bold text-sm">{t("title")}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(backTo)}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label={t("back_to_app")}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-safe-nav md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex items-center justify-around border-t border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150 py-1.5 px-1"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {mobileMainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] py-2 px-3 text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="truncate max-w-[64px] text-center leading-tight">{item.label}</span>
            </NavLink>
          ))}
          {mobileOverflowItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] py-2 px-3 text-xs font-medium text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
                <span className="leading-tight">Plus</span>
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

export default AdminLayout;
