import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

const CoachPrograms = () => {
  const { t } = useTranslation('program');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t('programs')}</h1>
        <p className="text-muted-foreground text-sm">{t('create_manage')}</p>
      </div>

      <div className="glass p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <ClipboardList className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold">{t('no_programs')}</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t('no_programs_desc')}</p>
      </div>
    </div>
  );
};

export default CoachPrograms;
