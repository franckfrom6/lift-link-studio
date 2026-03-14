import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Beef } from "lucide-react";
import { cn } from "@/lib/utils";

const ProteinTipsCard = () => {
  const { t } = useTranslation("nutrition");
  const [open, setOpen] = useState(false);

  return (
    <div className="glass overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Beef className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="text-sm font-semibold">{t("protein_tips_title")}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t("protein_tips_goal")}</p>

          <div className="space-y-1.5">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">{t("protein_tips_sources_title")}</p>
            <ul className="space-y-1 text-xs">
              <li>🍗 {t("protein_source_chicken")}</li>
              <li>🐟 {t("protein_source_fish")}</li>
              <li>🥚 {t("protein_source_eggs")}</li>
              <li>🫘 {t("protein_source_legumes")}</li>
              <li>🥛 {t("protein_source_dairy")}</li>
              <li>💪 {t("protein_source_whey")}</li>
            </ul>
          </div>

          <p className="text-xs italic">⏱ {t("protein_tips_timing")}</p>
        </div>
      </div>
    </div>
  );
};

export default ProteinTipsCard;
