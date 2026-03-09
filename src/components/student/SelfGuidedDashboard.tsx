import { Bot, UserRound, Dumbbell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface SelfGuidedDashboardProps {
  onStartAI: () => void;
  onJoinCoach: (code: string) => void;
}

const SelfGuidedDashboard = ({ onStartAI, onJoinCoach }: SelfGuidedDashboardProps) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [coachCode, setCoachCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('dashboard:welcome_title', 'Bienvenue sur F6GYM 👋')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('dashboard:no_coach_subtitle', "Vous n'avez pas encore de coach. Deux options s'offrent à vous :")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Mode */}
        <button
          onClick={onStartAI}
          className="glass p-6 space-y-4 text-left hover:ring-1 hover:ring-primary/40 transition-all rounded-xl group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Bot className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{t('dashboard:self_guided_title', 'Mode autonome')}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('dashboard:self_guided_desc', "L'IA crée et adapte vos programmes selon votre profil.")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {t('dashboard:start_with_ai', "Commencer avec l'IA →")}
          </div>
        </button>

        {/* Coach Mode */}
        <div className="glass p-6 space-y-4 text-left rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center">
            <UserRound className="w-6 h-6 text-accent-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{t('dashboard:find_coach_title', 'Trouver un coach')}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('dashboard:find_coach_desc', 'Rejoignez un coach pour un suivi personnalisé.')}
            </p>
          </div>
          {!showCodeInput ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCodeInput(true)}
            >
              {t('dashboard:enter_coach_code', 'Entrer un code coach')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={coachCode}
                onChange={(e) => setCoachCode(e.target.value)}
                placeholder={t('dashboard:coach_code_placeholder', 'Code ou email du coach')}
                className="text-sm h-9"
              />
              <Button
                size="sm"
                className="h-9 shrink-0"
                disabled={!coachCode.trim()}
                onClick={() => onJoinCoach(coachCode.trim())}
              >
                {t('common:join', 'Rejoindre')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfGuidedDashboard;
