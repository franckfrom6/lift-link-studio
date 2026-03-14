import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

interface CoachNotifyModalProps {
  studentId: string;
  studentName: string;
}

const CoachNotifyModal = ({ studentId, studentName }: CoachNotifyModalProps) => {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !message.trim()) return;
    setSending(true);

    // Save notification to DB
    const { error } = await supabase.from("coach_notifications" as any).insert({
      coach_id: user.id,
      student_id: studentId,
      message: message.trim().slice(0, 120),
    });

    if (error) {
      toast.error(t("common:save_error"));
    } else {
      // Try to send push via edge function
      try {
        await supabase.functions.invoke("send-push", {
          body: {
            studentId,
            title: t("notif_coach_push_title"),
            body: message.trim().slice(0, 120),
          },
        });
      } catch {
        // Push sending is best-effort
      }
      toast.success(t("notif_sent_success", { name: studentName }));
      setMessage("");
      setOpen(false);
    }
    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t("notif_notify")}>
          <Megaphone className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">
            📣 {t("notif_notify")} {studentName}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 120))}
            placeholder={t("notif_message_placeholder")}
            className="resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{message.length}/120</span>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? t("common:saving") : t("notif_send")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CoachNotifyModal;
