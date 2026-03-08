import { useTranslation } from "react-i18next";

interface TaglineProps {
  className?: string;
}

const Tagline = ({ className = "" }: TaglineProps) => {
  const { t } = useTranslation("common");
  return (
    <p className={`text-muted-foreground ${className}`}>
      {t("brand_tagline", "Ton coaching, structuré.")}
    </p>
  );
};

export default Tagline;
