import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("reset_password_success"));
        navigate("/auth", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="flex justify-center"><Logo variant="full" /></div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t("reset_password_title")}</h2>
          <p className="text-sm text-muted-foreground">{t("reset_password_desc")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("new_password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading || password.length < 8}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("reset_password_button")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
