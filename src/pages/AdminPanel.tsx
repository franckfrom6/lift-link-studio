import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/providers/PlanProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Shield, Trash2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import PlanBadge from "@/components/plans/PlanBadge";

interface UserRow {
  user_id: string;
  full_name: string;
  role: string;
  created_at: string;
  plan_name?: string;
  plan_id?: string;
  subscription_id?: string;
}

const AdminPanel = () => {
  const { t, i18n } = useTranslation("plans");
  const { user } = useAuth();
  const { allPlans, refetch } = usePlan();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [newOverrideKey, setNewOverrideKey] = useState("");
  const [newOverrideEnabled, setNewOverrideEnabled] = useState(true);
  const [newOverrideReason, setNewOverrideReason] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Fetch profiles with their subscriptions
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, created_at")
      .order("created_at", { ascending: false });

    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id, plan_id, id");

    const { data: plans } = await supabase
      .from("plans")
      .select("id, name");

    const planMap = new Map((plans || []).map((p: any) => [p.id, p.name]));
    const subMap = new Map((subs || []).map((s: any) => [s.user_id, { plan_id: s.plan_id, id: s.id }]));

    setUsers(
      (profiles || []).map((p: any) => {
        const sub = subMap.get(p.user_id);
        return {
          ...p,
          plan_name: sub ? planMap.get(sub.plan_id) || "free" : "free",
          plan_id: sub?.plan_id,
          subscription_id: sub?.id,
        };
      })
    );
  };

  const handleChangePlan = async (userRow: UserRow, newPlanName: string) => {
    const plan = allPlans.find((p: any) => p.name === newPlanName);
    if (!plan) return;

    if (userRow.subscription_id) {
      await supabase
        .from("user_subscriptions")
        .update({ plan_id: plan.id })
        .eq("id", userRow.subscription_id);
    } else {
      await supabase.from("user_subscriptions").insert({
        user_id: userRow.user_id,
        plan_id: plan.id,
        status: "active",
      });
    }

    toast.success(t("admin_plan_updated"));
    fetchUsers();
    refetch();
  };

  const selectUser = async (u: UserRow) => {
    setSelectedUser(u);
    const { data } = await supabase
      .from("feature_overrides")
      .select("*")
      .eq("user_id", u.user_id)
      .order("created_at", { ascending: false });
    setOverrides(data || []);
  };

  const addOverride = async () => {
    if (!selectedUser || !newOverrideKey) return;
    await supabase.from("feature_overrides").insert({
      user_id: selectedUser.user_id,
      feature_key: newOverrideKey,
      is_enabled: newOverrideEnabled,
      reason: newOverrideReason || null,
      created_by: user?.id,
    });
    toast.success(t("admin_override_added"));
    setNewOverrideKey("");
    setNewOverrideReason("");
    selectUser(selectedUser);
  };

  const deleteOverride = async (id: string) => {
    await supabase.from("feature_overrides").delete().eq("id", id);
    toast.success(t("admin_override_deleted"));
    if (selectedUser) selectUser(selectedUser);
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("admin_title")}</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t("admin_users")}</TabsTrigger>
          <TabsTrigger value="plans">{t("admin_plans")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* User list */}
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filtered.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => selectUser(u)}
                  className={`glass p-3 w-full text-left flex items-center gap-3 transition-colors ${
                    selectedUser?.user_id === u.user_id ? "ring-1 ring-primary" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.role}</p>
                  </div>
                  <PlanBadge plan={u.plan_name || "free"} showTooltip={false} />
                </button>
              ))}
            </div>

            {/* User detail */}
            {selectedUser && (
              <div className="glass p-4 space-y-4">
                <h3 className="font-bold">{selectedUser.full_name}</h3>
                <Badge variant="secondary">{selectedUser.role}</Badge>

                {/* Change plan */}
                <div>
                  <Label className="text-xs">{t("admin_change_plan")}</Label>
                  <Select
                    value={selectedUser.plan_name || "free"}
                    onValueChange={(v) => handleChangePlan(selectedUser, v)}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allPlans.map((p: any) => (
                        <SelectItem key={p.name} value={p.name}>
                          {i18n.language === "fr" ? p.displayNameFr : p.displayNameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Overrides */}
                <div className="space-y-2">
                  <Label className="text-xs">{t("admin_active_overrides")}</Label>
                  {overrides.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("admin_no_overrides")}</p>
                  ) : (
                    overrides.map((o: any) => (
                      <div key={o.id} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                        <span className="font-mono flex-1">{o.feature_key}</span>
                        <Badge variant={o.is_enabled ? "default" : "secondary"}>
                          {o.is_enabled ? "ON" : "OFF"}
                        </Badge>
                        {o.reason && <span className="text-muted-foreground truncate max-w-[100px]">{o.reason}</span>}
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteOverride(o.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add override */}
                <div className="space-y-2 border-t border-border pt-3">
                  <Label className="text-xs">{t("admin_add_override")}</Label>
                  <Input
                    placeholder="feature_key"
                    value={newOverrideKey}
                    onChange={(e) => setNewOverrideKey(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <Input
                    placeholder={t("admin_override_reason")}
                    value={newOverrideReason}
                    onChange={(e) => setNewOverrideReason(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Select value={newOverrideEnabled ? "on" : "off"} onValueChange={(v) => setNewOverrideEnabled(v === "on")}>
                      <SelectTrigger className="w-20 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">ON</SelectItem>
                        <SelectItem value="off">OFF</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={addOverride} disabled={!newOverrideKey}>
                      <Plus className="w-3 h-3 mr-1" /> {t("admin_add_override")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4 mt-4">
          {allPlans.map((plan: any) => (
            <div key={plan.id} className="glass p-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{i18n.language === "fr" ? plan.displayNameFr : plan.displayNameEn}</h3>
                <PlanBadge plan={plan.name} showTooltip={false} />
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.priceMonthly ? `${plan.priceMonthly}€/mo` : "Free"} · {i18n.language === "fr" ? plan.descriptionFr : plan.descriptionEn}
              </p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
