import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw, Link2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

interface TokenData {
  id: string;
  token: string;
  uses_count: number;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
}

const CoachInviteToken = () => {
  const { t } = useTranslation(["auth", "dashboard"]);
  const { user } = useAuth();
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchToken();
  }, [user]);

  const fetchToken = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_invite_tokens")
      .select("*")
      .eq("coach_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setToken(data as TokenData | null);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // Deactivate old tokens
      await supabase
        .from("coach_invite_tokens")
        .update({ is_active: false })
        .eq("coach_id", user.id);

      const newToken = generateToken();
      const { data, error } = await supabase
        .from("coach_invite_tokens")
        .insert({
          coach_id: user.id,
          token: newToken,
        })
        .select("*")
        .single();

      if (error) {
        toast.error(t("auth:error_generic"));
      } else {
        setToken(data as TokenData);
        toast.success(t("auth:token_generated", "Code généré !"));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("auth:invite_link_copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const joinUrl = token
    ? `${window.location.origin}/join/${token.token}`
    : "";

  if (loading) return null;

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h3 className="font-semibold text-sm">{t("auth:invite_token_title", "Code d'invitation")}</h3>
        </div>
        {token && (
          <Badge variant="secondary" className="text-[10px]">
            <Users className="w-3 h-3 mr-1" />
            {t("auth:token_uses", "{{count}} utilisation(s)", { count: token.uses_count })}
          </Badge>
        )}
      </div>

      {token ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-center text-lg font-bold tracking-widest select-all">
              {token.token}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => handleCopy(token.token)}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("auth:token_share_hint", "Partagez ce code à vos athlètes. Ils l'utilisent pour rejoindre votre liste.")}
          </p>
          <div className="flex gap-2">
            <Input value={joinUrl} readOnly className="text-[11px] text-muted-foreground" />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCopy(joinUrl)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs w-full"
            onClick={handleGenerate}
            disabled={generating}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${generating ? "animate-spin" : ""}`} />
            {t("auth:token_regenerate", "Générer un nouveau code")}
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {t("auth:token_empty", "Générez un code d'invitation pour que vos athlètes puissent vous rejoindre.")}
          </p>
          <Button onClick={handleGenerate} disabled={generating} size="sm">
            <Link2 className="w-3.5 h-3.5 mr-1" />
            {t("auth:token_generate", "Générer mon code")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CoachInviteToken;
