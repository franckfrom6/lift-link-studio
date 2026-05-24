import { useTranslation } from "react-i18next";

interface TaglineProps {
  className?: string;
}

const Tagline = ({ className = "" }: TaglineProps) => {
  const { t } = useTranslation("common");
  return (
    <p className={`text-muted-foreground ${className}`}>
      {t("brand_tagline", "Ton coach. Ton IA. Ton chemin.")}
    </p>
  );
};

export default Tagline;
