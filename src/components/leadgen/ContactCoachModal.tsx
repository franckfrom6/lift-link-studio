import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactCoachModalProps {
  open: boolean;
  onClose: () => void;
  coachId: string;
}

const ContactCoachModal = ({ open, onClose, coachId }: ContactCoachModalProps) => {
  const { t } = useTranslation("leadgen");
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user) return;
    setSending(true);

    const { error } = await supabase.from("coach_contact_requests").insert({
      student_id: user.id,
      coach_id: coachId,
      message,
      status: "pending",
    });

    if (error) {
      console.error(error);
      toast.error("Erreur");
    } else {
      toast.success(t("contact_sent"));
      onClose();
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("contact_coach")}</DialogTitle>
          <DialogDescription>{t("contact_message_placeholder")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={t("contact_message_placeholder")}
          rows={4}
        />
        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {t("send_contact")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ContactCoachModal;
