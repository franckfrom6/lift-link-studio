import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ToggleRight, Trash2, Search, AlertTriangle } from "lucide-react";
import { format, addDays, isBefore } from "date-fns";

interface OverrideRow {
  id: string;
  user_id: string;
  feature_key: string;
  is_enabled: boolean;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
  user_name?: string;
  creator_name?: string;
}

const AdminOverrides = () => {
  const { t, i18n } = useTranslation("admin");
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("active");

  useEffect(() => { fetchOverrides(); }, []);

  const fetchOverrides = async () => {
    const { data } = await supabase.from("feature_overrides").select("*").order("created_at", { ascending: false });
    if (!data) return;

    const userIds = [...new Set(data.map((o: any) => o.user_id).concat(data.filter((o: any) => o.created_by).map((o: any) => o.created_by)))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

    setOverrides(
      data.map((o: any) => ({
        ...o,
        user_name: nameMap.get(o.user_id) || o.user_id,
        creator_name: o.created_by ? nameMap.get(o.created_by) : null,
      }))
    );
  };

  const deleteOverride = async (id: string) => {
    await supabase.from("feature_overrides").delete().eq("id", id);
    toast.success(t("override_deleted"));
    fetchOverrides();
  };

  const getFeatureLabel = (key: string) => t(`features.${key}`, { defaultValue: key });

  const now = new Date();
  const soonDate = addDays(now, 7);
  const expiringSoon = overrides.filter(
    (o) => o.expires_at && isBefore(new Date(o.expires_at), soonDate) && !isBefore(new Date(o.expires_at), now)
  );

  const filtered = overrides
    .filter((o) => o.user_name?.toLowerCase().includes(search.toLowerCase()) || o.feature_key.toLowerCase().includes(search.toLowerCase()))
    .filter((o) => {
      if (filterStatus === "active") return !o.expires_at || !isBefore(new Date(o.expires_at), now);
      if (filterStatus === "expired") return o.expires_at && isBefore(new Date(o.expires_at), now);
      return true;
    });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <ToggleRight className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("all_overrides")}</h1>
        <Badge variant="secondary">{filtered.length}</Badge>
      </div>

      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4" />
          {t("expiring_soon", { count: expiringSoon.length })}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("search_users")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["active", "expired", "all"] as const).map((s) => (
            <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)}>
              {t(s === "all" ? "filter_all" : s)}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">{t("user")}</th>
                <th className="text-left p-3 font-medium">{t("feature_key")}</th>
                <th className="text-left p-3 font-medium">{t("action")}</th>
                <th className="text-left p-3 font-medium">{t("reason")}</th>
                <th className="text-left p-3 font-medium">{t("expires_at")}</th>
                <th className="text-left p-3 font-medium">{t("status")}</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const isExpired = o.expires_at && isBefore(new Date(o.expires_at), now);
                return (
                  <tr key={o.id} className={`hover:bg-muted/30 ${isExpired ? "opacity-50" : ""}`}>
                    <td className="p-3 font-medium">{o.user_name}</td>
                    <td className="p-3">
                      <span className="text-xs">{getFeatureLabel(o.feature_key)}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant={o.is_enabled ? "default" : "secondary"}>
                        {o.is_enabled ? "ON" : "OFF"}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs max-w-[150px] truncate">{o.reason || "—"}</td>
                    <td className="p-3 text-xs">
                      {o.expires_at ? format(new Date(o.expires_at), "dd/MM/yyyy") : t("permanent")}
                    </td>
                    <td className="p-3">
                      <Badge variant={isExpired ? "secondary" : "default"} className="text-[10px]">
                        {isExpired ? t("expired") : t("active")}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteOverride(o.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">{t("no_overrides")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverrides;