import { UserRound, Dumbbell, Sparkles, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import CoachRecommendationList from "@/components/leadgen/CoachRecommendationList";
import SessionBuilderModal from "./SessionBuilderModal";

interface SelfGuidedDashboardProps {
  onStartAI: () => void;
  onJoinCoach: (code: string) => void;
}

const SelfGuidedDashboard = ({ onStartAI, onJoinCoach }: SelfGuidedDashboardProps) => {
  const { t } = useTranslation(['dashboard', 'common', 'program', 'leadgen']);
  const [coachCode, setCoachCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('dashboard:welcome_title', 'Bienvenue sur F6GYM 👋')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('dashboard:no_coach_subtitle', "Vous n'avez pas encore de programme. Choisissez comment commencer :")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Create my own program */}
        <button
          onClick={() => navigate("/student/program/edit")}
          className="glass p-6 space-y-4 text-left hover:ring-1 hover:ring-primary/40 transition-all rounded-xl group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Dumbbell className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{t('program:create_my_program', 'Créer mon programme')}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('program:create_my_program_desc', 'Ajoutez vos séances de musculation, choisissez vos exercices et planifiez votre semaine.')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {t('program:start_creating', 'Commencer →')}
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
                placeholder={t('dashboard:coach_code_placeholder', 'Code du coach')}
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

      {/* Lead gen: Recommended coaches */}
      <CoachRecommendationList />
    </div>
  );
};

export default SelfGuidedDashboard;
