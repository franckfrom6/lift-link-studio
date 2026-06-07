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

      // Check if it's a legacy invite (f6gym- or 6way- prefix)
      if (code.startsWith("6way-") || code.startsWith("f6gym-")) {
        const shortHex = code.replace(/^(6way-|f6gym-)/i, '');
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
      const upper = code.toUpperCase();

      // Server-side validation (RLS-safe RPC)
      const { data: coachId, error: lookupError } = await supabase
        .rpc("lookup_coach_invite_token", { _token: upper });

      if (lookupError || !coachId) {
        setNotFound(true);
        return;
      }

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/auth?token=${upper}`, { replace: true });
        return;
      }

      setProcessing(true);
      await joinCoachViaToken(upper);
    };
    resolve();
  }, [code]);

  const joinCoachViaToken = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc("redeem_coach_invite_token", { _token: token });
      const status = (data as any)?.status;
      if (error || !status || status === "invalid" || status === "expired" || status === "maxed") {
        toast.error("Code invalide ou expiré");
        navigate("/student", { replace: true });
        return;
      }
      if (status === "already_linked") {
        toast.info("Vous êtes déjà associé à ce coach");
      } else if (status === "success") {
        toast.success("Vous avez rejoint le coach !");
      }
      navigate("/student", { replace: true });
    } catch {
      toast.error("Erreur");
      navigate("/student", { replace: true });
    }
  };

  if (notFound) return <Navigate to="/auth" replace />;
  if (inviteId) return <Navigate to={`/auth?invite=${inviteId}`} replace />;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default JoinRedirect;
