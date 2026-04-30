import { useState } from "react";
import { Bot, UserRound, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoProgramOnboardingBannerProps {
  onStartAI?: () => void;
  onJoinCoach: (code: string) => Promise<void> | void;
  /** When true, the banner is collapsed by default (athlete already has a free session). */
  collapsedByDefault?: boolean;
}

/**
 * Compact, dismissable onboarding banner shown above the calendar when the
 * athlete has no structured program yet. Lets them generate one with VOLT or
 * join a coach without leaving the calendar view.
 */
const NoProgramOnboardingBanner = ({
  onStartAI,
  onJoinCoach,
  collapsedByDefault = false,
}: NoProgramOnboardingBannerProps) => {
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const [view, setView] = useState<"choice" | "code">("choice");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={cn(
          "mx-4 mt-3 mb-1 flex items-center justify-between gap-2 w-[calc(100%-2rem)]",
          "px-3 py-2 rounded-sm bg-card border border-border",
          "text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-bg-tinted transition-colors"
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          Pas encore de programme structuré
        </span>
        <ChevronRight className="w-3 h-3 text-muted-subtle" strokeWidth={2} />
      </button>
    );
  }

  return (
    <div className="mx-4 mt-3 mb-1 rounded-sm bg-card border border-border overflow-hidden animate-fade-in">
      <div className="px-3 pt-2.5 pb-2 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-foreground leading-tight">
            Compose ton programme
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            Ajoute des séances jour par jour, ou laisse VOLT t'en générer un.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-muted-subtle hover:text-foreground transition-colors p-0.5 -mr-0.5 -mt-0.5"
          aria-label="Réduire"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>

      {view === "choice" && (
        <div className="px-3 pb-2.5 grid grid-cols-2 gap-2">
          {onStartAI && (
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-8 text-[12px] font-semibold gap-1.5"
              onClick={onStartAI}
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={2} />
              Générer avec VOLT
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-[12px] font-semibold gap-1.5"
            onClick={() => setView("code")}
          >
            <UserRound className="w-3.5 h-3.5" strokeWidth={2} />
            Code coach
          </Button>
        </div>
      )}

      {view === "code" && (
        <div className="px-3 pb-2.5 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="h-8 text-[12px] font-mono tracking-wider"
            maxLength={8}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            className="h-8 text-[12px] font-semibold flex-shrink-0"
            disabled={code.trim().length < 4 || joining}
            onClick={async () => {
              setJoining(true);
              await onJoinCoach(code.trim());
              setJoining(false);
            }}
          >
            Rejoindre
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-[12px] flex-shrink-0"
            onClick={() => { setView("choice"); setCode(""); }}
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
};

export default NoProgramOnboardingBanner;