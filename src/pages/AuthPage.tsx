import { useNavigate } from "react-router-dom";
import { Dumbbell, GraduationCap, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const AuthPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-secondary">
        <div className="relative z-10 px-12 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">FitForge</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t('welcome_description')}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold">FitForge</h1>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">{t('welcome_title')}</h2>
            <p className="text-muted-foreground">{t('welcome_subtitle')}</p>
          </div>

          <div className="space-y-4">
            <button onClick={() => navigate("/coach")}
              className="w-full flex items-center gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-accent-foreground" strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">{t('coach_space')}</div>
                <div className="text-sm text-muted-foreground">{t('coach_space_desc')}</div>
              </div>
            </button>

            <button onClick={() => navigate("/student")}
              className="w-full flex items-center gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                <User className="w-7 h-7 text-accent-foreground" strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">{t('student_space')}</div>
                <div className="text-sm text-muted-foreground">{t('student_space_desc')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
