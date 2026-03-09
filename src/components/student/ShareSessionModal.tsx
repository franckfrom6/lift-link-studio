import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Teammate {
  user_id: string;
  full_name: string;
}

interface ShareSessionModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  completedSessionId?: string;
  sessionName: string;
}

const ShareSessionModal = ({ open, onClose, sessionId, completedSessionId, sessionName }: ShareSessionModalProps) => {
  const { t } = useTranslation("teammate");
  const { user } = useAuth();
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);

    const fetchTeammates = async () => {
      // Get my coach(es)
      const { data: myCoaches } = await supabase
        .from("coach_students")
        .select("coach_id")
        .eq("student_id", user.id)
        .eq("status", "active");

      if (!myCoaches?.length) {
        setTeammates([]);
        setLoading(false);
        return;
      }

      const coachIds = myCoaches.map(c => c.coach_id);

      // Get all students of these coaches (except me)
      const { data: coachStudents } = await supabase
        .from("coach_students")
        .select("student_id")
        .in("coach_id", coachIds)
        .eq("status", "active")
        .neq("student_id", user.id);

      if (!coachStudents?.length) {
        setTeammates([]);
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(coachStudents.map(s => s.student_id))];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);

      setTeammates((profiles || []).map(p => ({ user_id: p.user_id, full_name: p.full_name })));
      setLoading(false);
    };

    fetchTeammates();
  }, [open, user]);

  const handleShare = async (teammateId: string) => {
    if (!completedSessionId) {
      toast.error("Session pas encore démarrée");
      return;
    }

    setSending(teammateId);
    const { error } = await supabase.from("shared_sessions").insert({
      completed_session_id: completedSessionId,
      shared_with_user_id: teammateId,
      status: "pending",
    });

    if (error) {
      console.error(error);
      toast.error("Erreur lors du partage");
    } else {
      toast.success(t("invite_sent"));
      onClose();
    }
    setSending(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("share_title")}</DialogTitle>
          <DialogDescription>{t("share_desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : teammates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("no_teammates")}</p>
          ) : (
            teammates.map(tm => (
              <div key={tm.user_id} className="flex items-center justify-between glass p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                      {tm.full_name?.slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{tm.full_name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleShare(tm.user_id)}
                  disabled={sending === tm.user_id}
                >
                  {sending === tm.user_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    t("share_session")
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSessionModal;
