import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Users, Shield, ToggleRight, ArrowLeft, Loader2, MessageSquare, BookOpen } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

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
  ];

  const backTo = role === "coach" ? "/coach" : "/student";

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-secondary/50 p-4">
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

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            <span className="font-bold">{t("title")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        <nav className="md:hidden flex items-center justify-around border-t border-border bg-background py-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;