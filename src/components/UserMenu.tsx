import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, LogOut, Sun, Moon, Globe } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

const UserMenu = () => {
  const { t, i18n } = useTranslation(["auth", "common", "settings"]);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground hover:ring-2 hover:ring-ring transition-all shrink-0">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{profile?.full_name || "—"}</p>
          <p className="text-xs text-muted-foreground">{profile?.role === "coach" ? t("common:roles.coach") : t("common:roles.student")}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(profile?.role === "coach" ? "/coach" : "/student/profile")}>
          <User className="w-4 h-4 mr-2" /> {t("settings:nav_profile", "Profil")}
        </DropdownMenuItem>
        {profile?.is_admin && (
          <DropdownMenuItem onClick={() => navigate("/admin")}>
            <Shield className="w-4 h-4 mr-2" /> Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleLang}>
          <Globe className="w-4 h-4 mr-2" /> {i18n.language === "fr" ? "English" : "Français"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          {isDark ? t("common:light_mode", "Light") : t("common:dark_mode", "Dark")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> {t("common:logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
