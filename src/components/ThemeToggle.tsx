import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycle}
      className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center",
        "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      )}
      aria-label={theme === "light" ? "Mode clair" : theme === "dark" ? "Mode sombre" : "Système"}
    >
      {theme === "light" && <Sun className="w-4 h-4" strokeWidth={1.5} />}
      {theme === "dark" && <Moon className="w-4 h-4" strokeWidth={1.5} />}
      {theme === "system" && <Monitor className="w-4 h-4" strokeWidth={1.5} />}
    </button>
  );
};

export default ThemeToggle;
