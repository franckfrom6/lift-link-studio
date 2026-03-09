import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const SharedSessionBadge = () => {
  const { t } = useTranslation("teammate");
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-accent/60 text-accent-foreground px-2 py-0.5 rounded-full">
      <Users className="w-3 h-3" strokeWidth={1.5} />
      {t("shared_session_badge")}
    </span>
  );
};

export default SharedSessionBadge;
