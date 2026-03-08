import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TicketForm = () => {
  const { t } = useTranslation("support");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("other");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const deviceInfo = `${navigator.userAgent.slice(0, 100)} / ${window.screen.width}×${window.screen.height}`;
    const appPage = window.location.pathname;

    const { error } = await (supabase as any).from("support_tickets").insert({
      user_id: user.id,
      category,
      subject,
      description,
      priority,
      device_info: deviceInfo,
      app_page: appPage,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("ticket_created"));
      navigate("/support");
    }
  };

  const categories = ["bug", "feature_request", "account", "billing", "training", "nutrition", "technical", "other"];
  const priorities = ["low", "medium", "high", "urgent"];

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{t("new_ticket")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>{t("category")} *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("subject")} *</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>{t("description")} *</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} />
        </div>

        <div className="space-y-2">
          <Label>{t("priority")}</Label>
          <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-4 flex-wrap">
            {priorities.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <RadioGroupItem value={p} id={`priority-${p}`} />
                <Label htmlFor={`priority-${p}`} className="cursor-pointer text-sm">{t(`priorities.${p}`)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("send_ticket")}
        </Button>
      </form>
    </div>
  );
};

export default TicketForm;
