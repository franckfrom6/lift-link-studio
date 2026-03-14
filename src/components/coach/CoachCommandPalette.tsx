import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCoachDashboard, StudentOverview } from "@/hooks/useCoachDashboard";
import { useTranslation } from "react-i18next";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Users, Dumbbell, ClipboardList, LayoutDashboard, BookOpen, Search } from "lucide-react";

const CoachCommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { students } = useCoachDashboard();
  const { t } = useTranslation(["dashboard", "settings", "common"]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("dashboard:search_student") + " / " + t("common:navigate") + "..."} />
      <CommandList>
        <CommandEmpty>{t("common:no_results")}</CommandEmpty>
        <CommandGroup heading={t("common:navigate")}>
          <CommandItem onSelect={() => runCommand(() => navigate("/coach"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t("settings:nav_dashboard")}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/coach/students"))}>
            <Users className="mr-2 h-4 w-4" />
            {t("settings:nav_students")}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/coach/programs"))}>
            <ClipboardList className="mr-2 h-4 w-4" />
            {t("settings:nav_programs")}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/coach/exercises"))}>
            <Dumbbell className="mr-2 h-4 w-4" />
            {t("settings:nav_exercises")}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/coach/recommendations"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            {t("settings:nav_recommendations")}
          </CommandItem>
        </CommandGroup>
        {students.length > 0 && (
          <CommandGroup heading={t("dashboard:my_students")}>
            {students.map((s) => (
              <CommandItem key={s.id} onSelect={() => runCommand(() => navigate(`/coach/students/${s.id}`))}>
                <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground mr-2">
                  {s.avatar}
                </div>
                {s.name}
                {s.programName && <span className="ml-2 text-muted-foreground text-xs">— {s.programName}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CoachCommandPalette;
