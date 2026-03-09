import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Resolves /join/<code> — supports both:
 * 1. Token-based: /join/ABCD1234 (coach_invite_tokens.token)
 * 2. Legacy invite: /join/f6gym-XXXXXXXX (pending_invitations short id)
 */
const JoinRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!code) { setNotFound(true); return; }

      // Check if it's a legacy f6gym- invite
      if (code.startsWith("f6gym-")) {
        const shortHex = code.replace(/^f6gym-/i, '');
        if (!shortHex || shortHex.length < 6) { setNotFound(true); return; }

        const { data, error } = await supabase
          .from("pending_invitations")
          .select("id")
          .ilike("id", `${shortHex.slice(0, 8)}%`)
          .limit(1)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setInviteId(data.id);
        }
        return;
      }

      // Token-based join
      const { data: tokenData, error: tokenError } = await supabase
        .from("coach_invite_tokens")
        .select("id, coach_id, token, is_active, max_uses, uses_count, expires_at")
        .eq("token", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (tokenError || !tokenData) {
        setNotFound(true);
        return;
      }

      // Check expiry
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        setNotFound(true);
        return;
      }

      // Check max uses
      if (tokenData.max_uses !== null && tokenData.uses_count >= tokenData.max_uses) {
        setNotFound(true);
        return;
      }

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to auth with token param so they can sign up/login first
        navigate(`/auth?token=${code.toUpperCase()}`, { replace: true });
        return;
      }

      // User is logged in — join the coach
      setProcessing(true);
      await joinCoachViaToken(user.id, tokenData);
    };
    resolve();
  }, [code]);

  const joinCoachViaToken = async (userId: string, tokenData: any) => {
    try {
      // Check if already linked
      const { data: existing } = await supabase
        .from("coach_students")
        .select("id")
        .eq("coach_id", tokenData.coach_id)
        .eq("student_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        toast.info("Vous êtes déjà associé à ce coach");
        navigate("/student", { replace: true });
        return;
      }

      // Create association
      const { error: insertError } = await supabase.from("coach_students").insert({
        coach_id: tokenData.coach_id,
        student_id: userId,
        status: "active",
      });

      if (insertError) {
        toast.error("Erreur lors de l'association");
        navigate("/student", { replace: true });
        return;
      }

      // Increment uses_count
      await supabase
        .from("coach_invite_tokens")
        .update({ uses_count: tokenData.uses_count + 1 })
        .eq("id", tokenData.id);

      toast.success("Vous avez rejoint le coach !");
      navigate("/student", { replace: true });
    } catch {
      toast.error("Erreur");
      navigate("/student", { replace: true });
    }
  };

  if (notFound) return <Navigate to="/auth" replace />;
  if (inviteId) return <Navigate to={`/auth?invite=${inviteId}`} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default JoinRedirect;
