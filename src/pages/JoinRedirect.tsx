import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Resolves /join/f6gym-XXXXXXXX to the full invitation UUID
 * and redirects to /auth?invite=<full-uuid>
 */
const JoinRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!code) { setNotFound(true); return; }
      
      // Extract the short hex from "f6gym-XXXXXXXX"
      const shortHex = code.replace(/^f6gym-/i, '');
      if (!shortHex || shortHex.length < 6) { setNotFound(true); return; }

      // Search pending_invitations where id starts with the reconstructed prefix
      const { data, error } = await supabase
        .from("pending_invitations")
        .select("id")
        .ilike("id", `${shortHex.slice(0,8)}%`)
        .limit(1)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setInviteId(data.id);
      }
    };
    resolve();
  }, [code]);

  if (notFound) return <Navigate to="/auth" replace />;
  if (inviteId) return <Navigate to={`/auth?invite=${inviteId}`} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default JoinRedirect;
