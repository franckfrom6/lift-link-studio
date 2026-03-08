import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const InviteClientModal = () => {
  const { t } = useTranslation("auth");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Check if the email already has a profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", email) // This won't work — we need to check via auth
        .maybeSingle();

      // Check via pending_invitations or coach_students
      const { data: alreadyMine } = await supabase
        .from("coach_students")
        .select("id")
        .eq("coach_id", user.id)
        .maybeSingle();

      // Insert pending invitation
      const { error } = await supabase.from("pending_invitations").insert({
        coach_id: user.id,
        email: email.toLowerCase().trim(),
        student_name: name || null,
      });

      if (error) {
        toast.error(t("error_generic"));
      } else {
        toast.success(t("invite_success"));
        setOpen(false);
        setEmail("");
        setName("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          {t("invite_client")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invite_client")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("invite_email")} *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t("invite_name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("invite_send")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteClientModal;
