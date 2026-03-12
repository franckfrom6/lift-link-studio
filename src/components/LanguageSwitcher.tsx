import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const toggle = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "h-8 px-2 rounded-lg text-xs font-bold border border-border",
        "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      )}
      aria-label={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </button>
  );
};

export default LanguageSwitcher;
