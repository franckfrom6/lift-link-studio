import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InviteClientModal = () => {
  const { t } = useTranslation("auth");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  // Fetch current student count when modal opens
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("coach_students")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .eq("status", "active")
      .then(({ count }) => setStudentCount(count || 0));
  }, [open, user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedEmail = email.toLowerCase().trim();

    // 1. Email format validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error(t("invalid_email", "Adresse email invalide"));
      return;
    }

    setLoading(true);

    try {
      // 2. Check for duplicate pending invitation
      const { data: existing } = await supabase
        .from("pending_invitations")
        .select("id")
        .eq("coach_id", user.id)
        .eq("email", trimmedEmail)
        .eq("status", "pending")
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error(t("invite_already_sent", "Une invitation a déjà été envoyée à cet email"));
        return;
      }

      // 3. Check if student is already linked
      const { data: existingStudent } = await supabase
        .from("coach_students")
        .select("id, student_id")
        .eq("coach_id", user.id)
        .eq("status", "active");

      // Check plan limit (count active students + pending invitations)
      const { count: pendingCount } = await supabase
        .from("pending_invitations")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", user.id)
        .eq("status", "pending");

      const totalClients = (existingStudent?.length || 0) + (pendingCount || 0);

      // Get plan limit from plan_features
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (sub) {
        const { data: feature } = await supabase
          .from("plan_features")
          .select("limit_value")
          .eq("plan_id", sub.plan_id)
          .eq("feature_key", "max_clients")
          .maybeSingle();

        if (feature?.limit_value !== null && feature?.limit_value !== undefined && totalClients >= feature.limit_value) {
          toast.error(t("client_limit_reached", "Vous avez atteint la limite de clients de votre plan. Passez à un plan supérieur."));
          return;
        }
      }

      // 4. Insert invitation
      const { data, error } = await supabase.from("pending_invitations").insert({
        coach_id: user.id,
        email: trimmedEmail,
        student_name: name.trim() || null,
      }).select("id").single();

      if (error) {
        toast.error(t("error_generic"));
      } else {
        const shortId = data.id.replace(/-/g, '').slice(0, 8);
        const url = `${window.location.origin}/join/f6gym-${shortId}`;
        setInviteUrl(url);
        toast.success(t("invite_success"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t("invite_link_copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEmail("");
      setName("");
      setInviteUrl(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

        {inviteUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("invite_link_desc")}</p>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => handleClose(false)}>
              {t("onboarding_continue")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("invite_email")} *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("invite_name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("invite_send")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteClientModal;
