import { useNavigate } from "react-router-dom";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useTranslation } from "react-i18next";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ImpersonationBanner = () => {
  const { impersonating, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const { t } = useTranslation("settings");

  if (!impersonating) return null;

  const handleStop = () => {
    const studentId = impersonating.id;
    stopImpersonation();
    navigate(`/coach/students/${studentId}`, { replace: true });
  };

  return (
    <div className="bg-warning/15 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
        <Eye className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <span>
          {t("viewing_as", { name: impersonating.fullName, defaultValue: `Visualisation en tant que ${impersonating.fullName}` })}
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={handleStop} className="shrink-0 h-7 text-xs gap-1">
        <X className="w-3 h-3" strokeWidth={2} />
        {t("back_to_coach", "Retour coach")}
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
