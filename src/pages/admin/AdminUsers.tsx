import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/providers/PlanProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Search, Trash2, Plus, Users, ChevronLeft, ChevronRight } from "lucide-react";
import PlanBadge from "@/components/plans/PlanBadge";
import { format } from "date-fns";

interface UserRow {
  user_id: string;
  full_name: string;
  role: string;
  created_at: string;
  is_admin: boolean;
  plan_name?: string;
  plan_id?: string;
  subscription_id?: string;
  subscription_status?: string;
  client_count?: number;
}

const PAGE_SIZE = 25;

const AdminUsers = () => {
  const { t, i18n } = useTranslation("admin");
  const { user } = useAuth();
  const { allPlans, refetch } = usePlan();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Override form
  const [newKey, setNewKey] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [newReason, setNewReason] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, created_at, is_admin")
      .order("created_at", { ascending: false });

    const { data: subs } = await supabase.from("user_subscriptions").select("user_id, plan_id, id, status");
    const { data: plans } = await supabase.from("plans").select("id, name");
    const { data: coachStudents } = await supabase.from("coach_students").select("coach_id").eq("status", "active");

    const planMap = new Map((plans || []).map((p: any) => [p.id, p.name]));
    const subMap = new Map((subs || []).map((s: any) => [s.user_id, s]));
    const clientCounts = new Map<string, number>();
    (coachStudents || []).forEach((cs: any) => {
      clientCounts.set(cs.coach_id, (clientCounts.get(cs.coach_id) || 0) + 1);
    });

    setUsers(
      (profiles || []).map((p: any) => {
        const sub = subMap.get(p.user_id);
        return {
          ...p,
          plan_name: sub ? planMap.get(sub.plan_id) || "free" : "free",
          plan_id: sub?.plan_id,
          subscription_id: sub?.id,
          subscription_status: sub?.status || "active",
          client_count: clientCounts.get(p.user_id) || 0,
        };
      })
    );
  };

  const filtered = users
    .filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()))
    .filter((u) => filterRole === "all" || u.role === filterRole)
    .filter((u) => filterPlan === "all" || u.plan_name === filterPlan);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openUser = async (u: UserRow) => {
    setSelectedUser(u);
    setSheetOpen(true);
    const { data } = await supabase
      .from("feature_overrides")
      .select("*")
      .eq("user_id", u.user_id)
      .order("created_at", { ascending: false });
    setOverrides(data || []);
  };

  const handleChangePlan = async (newPlanName: string) => {
    if (!selectedUser) return;
    const plan = allPlans.find((p: any) => p.name === newPlanName);
    if (!plan) return;

    if (selectedUser.subscription_id) {
      await supabase.from("user_subscriptions").update({ plan_id: plan.id }).eq("id", selectedUser.subscription_id);
    } else {
      await supabase.from("user_subscriptions").insert({ user_id: selectedUser.user_id, plan_id: plan.id, status: "active" });
    }
    toast.success(t("plan_updated"));
    fetchUsers();
    refetch();
  };

  const addOverride = async () => {
    if (!selectedUser || !newKey) return;
    await supabase.from("feature_overrides").insert({
      user_id: selectedUser.user_id,
      feature_key: newKey,
      is_enabled: newEnabled,
      reason: newReason || null,
      created_by: user?.id,
    });
    toast.success(t("override_added"));
    setNewKey("");
    setNewReason("");
    openUser(selectedUser);
  };

  const deleteOverride = async (id: string) => {
    await supabase.from("feature_overrides").delete().eq("id", id);
    toast.success(t("override_deleted"));
    if (selectedUser) openUser(selectedUser);
  };

  const featureKeys = Object.keys(
    (i18n.getResourceBundle(i18n.language, "admin") as any)?.features || {}
  );

  const getFeatureLabel = (key: string) => t(`features.${key}`, { defaultValue: key });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("users")}</h1>
        <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("search_users")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setPage(0); }}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter_all")}</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
            <SelectItem value="student">{i18n.language === "fr" ? "Élève" : "Student"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={(v) => { setFilterPlan(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter_all")}</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="essential">Essential</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">{t("name")}</th>
                <th className="text-left p-3 font-medium">{t("role")}</th>
                <th className="text-left p-3 font-medium">{t("plan")}</th>
                <th className="text-left p-3 font-medium">{t("status")}</th>
                <th className="text-left p-3 font-medium">{t("registered")}</th>
                <th className="text-left p-3 font-medium">{t("clients")}</th>
                <th className="text-right p-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((u) => (
                <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        {u.is_admin && <Badge variant="destructive" className="text-[9px] px-1 py-0">Admin</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  </td>
                  <td className="p-3"><PlanBadge plan={u.plan_name || "free"} showTooltip={false} /></td>
                  <td className="p-3">
                    <Badge variant={u.subscription_status === "active" ? "default" : "secondary"} className="text-xs">
                      {t(`status_${u.subscription_status}`)}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{format(new Date(u.created_at), "dd/MM/yyyy")}</td>
                  <td className="p-3 text-center">{u.role === "coach" ? u.client_count : "—"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openUser(u)}>{t("view")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* User detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedUser.full_name}
                  {selectedUser.is_admin && <Badge variant="destructive" className="text-[9px]">Admin</Badge>}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-4">
                {/* Profile */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{t("profile")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t("role")}</span>
                    <Badge variant="outline">{selectedUser.role}</Badge>
                    <span className="text-muted-foreground">{t("registered")}</span>
                    <span>{format(new Date(selectedUser.created_at), "dd/MM/yyyy")}</span>
                    {selectedUser.role === "coach" && (
                      <>
                        <span className="text-muted-foreground">{t("clients")}</span>
                        <span>{selectedUser.client_count}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Subscription */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{t("subscription")}</h3>
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={selectedUser.plan_name || "free"} showTooltip={false} />
                    <Badge variant={selectedUser.subscription_status === "active" ? "default" : "secondary"}>
                      {t(`status_${selectedUser.subscription_status}`)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs">{t("change_plan")}</Label>
                    <Select
                      value={selectedUser.plan_name || "free"}
                      onValueChange={handleChangePlan}
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
                </div>

                {/* Overrides */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{t("feature_overrides")}</h3>
                  {overrides.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("no_overrides")}</p>
                  ) : (
                    <div className="space-y-1">
                      {overrides.map((o: any) => (
                        <div key={o.id} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                          <span className="flex-1 font-medium">{getFeatureLabel(o.feature_key)}</span>
                          <Badge variant={o.is_enabled ? "default" : "secondary"}>
                            {o.is_enabled ? "ON" : "OFF"}
                          </Badge>
                          {o.reason && <span className="text-muted-foreground truncate max-w-[80px]">{o.reason}</span>}
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteOverride(o.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 border-t border-border pt-3">
                    <Label className="text-xs font-semibold">{t("add_override")}</Label>
                    <Select value={newKey} onValueChange={setNewKey}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder={t("feature_key")} /></SelectTrigger>
                      <SelectContent>
                        {featureKeys.map((key) => (
                          <SelectItem key={key} value={key}>{getFeatureLabel(key)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Select value={newEnabled ? "on" : "off"} onValueChange={(v) => setNewEnabled(v === "on")}>
                        <SelectTrigger className="w-20 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on">{t("enable")}</SelectItem>
                          <SelectItem value="off">{t("disable")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={t("override_reason")}
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        className="text-xs flex-1"
                      />
                    </div>
                    <Button size="sm" onClick={addOverride} disabled={!newKey}>
                      <Plus className="w-3 h-3 mr-1" /> {t("create_override")}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminUsers;