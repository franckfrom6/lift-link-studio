import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import ShareSessionModal from "./ShareSessionModal";

interface ShareSessionButtonProps {
  sessionId: string;
  completedSessionId?: string;
  sessionName: string;
}

const ShareSessionButton = ({ sessionId, completedSessionId, sessionName }: ShareSessionButtonProps) => {
  const { t } = useTranslation("teammate");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t("share_session")}
      </Button>
      <ShareSessionModal
        open={open}
        onClose={() => setOpen(false)}
        sessionId={sessionId}
        completedSessionId={completedSessionId}
        sessionName={sessionName}
      />
    </>
  );
};

export default ShareSessionButton;
