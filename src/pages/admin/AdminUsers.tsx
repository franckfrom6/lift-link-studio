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
import { Search, Trash2, Plus, Users, ChevronLeft, ChevronRight, Link2, Unlink } from "lucide-react";
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

interface CoachStudentRow {
  id: string;
  coach_id: string;
  student_id: string;
  status: string;
  created_at: string;
  coach_name?: string;
  student_name?: string;
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
  const [newKey, setNewKey] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [newReason, setNewReason] = useState("");
  const [coachAssignments, setCoachAssignments] = useState<CoachStudentRow[]>([]);
  const [assignCoachId, setAssignCoachId] = useState("");
  const [assignStudentId, setAssignStudentId] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, role, created_at, is_admin").order("created_at", { ascending: false });
    const { data: subs } = await supabase.from("user_subscriptions").select("user_id, plan_id, id, status");
    const { data: plans } = await supabase.from("plans").select("id, name");
    const { data: coachStudents } = await supabase.from("coach_students").select("coach_id").eq("status", "active");
    const planMap = new Map((plans || []).map((p: any) => [p.id, p.name]));
    const subMap = new Map((subs || []).map((s: any) => [s.user_id, s]));
    const clientCounts = new Map<string, number>();
    (coachStudents || []).forEach((cs: any) => { clientCounts.set(cs.coach_id, (clientCounts.get(cs.coach_id) || 0) + 1); });
    setUsers((profiles || []).map((p: any) => {
      const sub = subMap.get(p.user_id);
      return { ...p, plan_name: sub ? planMap.get(sub.plan_id) || "free" : "free", plan_id: sub?.plan_id, subscription_id: sub?.id, subscription_status: sub?.status || "active", client_count: clientCounts.get(p.user_id) || 0 };
    }));
  };

  const filtered = users.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase())).filter((u) => filterRole === "all" || u.role === filterRole).filter((u) => filterPlan === "all" || u.plan_name === filterPlan);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const coaches = users.filter(u => u.role === "coach");
  const studentsList = users.filter(u => u.role === "student");

  const fetchAssignments = async (userId: string, role: string) => {
    if (role === "student") {
      const { data } = await supabase.from("coach_students").select("*").eq("student_id", userId).order("created_at", { ascending: false });
      setCoachAssignments((data || []).map(cs => ({ ...cs, coach_name: users.find(u => u.user_id === cs.coach_id)?.full_name || cs.coach_id, student_name: "" })));
    } else if (role === "coach") {
      const { data } = await supabase.from("coach_students").select("*").eq("coach_id", userId).order("created_at", { ascending: false });
      setCoachAssignments((data || []).map(cs => ({ ...cs, student_name: users.find(u => u.user_id === cs.student_id)?.full_name || cs.student_id, coach_name: "" })));
    }
  };

  const openUser = async (u: UserRow) => {
    setSelectedUser(u); setSheetOpen(true); setAssignCoachId(""); setAssignStudentId("");
    const { data } = await supabase.from("feature_overrides").select("*").eq("user_id", u.user_id).order("created_at", { ascending: false });
    setOverrides(data || []);
    await fetchAssignments(u.user_id, u.role);
  };

  const handleChangePlan = async (newPlanName: string) => {
    if (!selectedUser) return;
    const plan = allPlans.find((p: any) => p.name === newPlanName);
    if (!plan) return;
    if (selectedUser.subscription_id) { await supabase.from("user_subscriptions").update({ plan_id: plan.id }).eq("id", selectedUser.subscription_id); }
    else { await supabase.from("user_subscriptions").insert({ user_id: selectedUser.user_id, plan_id: plan.id, status: "active" }); }
    toast.success(t("plan_updated")); fetchUsers(); refetch();
  };

  const addOverride = async () => {
    if (!selectedUser || !newKey) return;
    await supabase.from("feature_overrides").insert({ user_id: selectedUser.user_id, feature_key: newKey, is_enabled: newEnabled, reason: newReason || null, created_by: user?.id });
    toast.success(t("override_added")); setNewKey(""); setNewReason(""); openUser(selectedUser);
  };

  const deleteOverride = async (id: string) => {
    await supabase.from("feature_overrides").delete().eq("id", id);
    toast.success(t("override_deleted")); if (selectedUser) openUser(selectedUser);
  };

  const handleAssignCoach = async () => {
    if (!selectedUser || !assignCoachId) return;
    // Deactivate any current active coach
    const existing = coachAssignments.find(cs => cs.status === "active");
    if (existing) await supabase.from("coach_students").update({ status: "inactive" }).eq("id", existing.id);
    // Check if there's already an inactive row for this pair — reactivate it
    const { data: existingPair } = await supabase.from("coach_students").select("id").eq("coach_id", assignCoachId).eq("student_id", selectedUser.user_id).eq("status", "inactive").maybeSingle();
    let error;
    if (existingPair) {
      ({ error } = await supabase.from("coach_students").update({ status: "active" }).eq("id", existingPair.id));
    } else {
      ({ error } = await supabase.from("coach_students").insert({ coach_id: assignCoachId, student_id: selectedUser.user_id, status: "active" }));
    }
    if (error) { toast.error(t("assign_error", "Erreur")); console.error("assign error", error); return; }
    toast.success(t("coach_assigned", "Coach associé")); setAssignCoachId(""); fetchUsers(); await fetchAssignments(selectedUser.user_id, selectedUser.role);
  };

  const handleAssignStudent = async () => {
    if (!selectedUser || !assignStudentId) return;
    const { error } = await supabase.from("coach_students").insert({ coach_id: selectedUser.user_id, student_id: assignStudentId, status: "active" });
    if (error) { toast.error(t("assign_error", "Erreur")); return; }
    toast.success(t("student_assigned", "Athlète associé")); setAssignStudentId(""); fetchUsers(); await fetchAssignments(selectedUser.user_id, selectedUser.role);
  };

  const handleDissociate = async (csId: string) => {
    await supabase.from("coach_students").update({ status: "inactive" }).eq("id", csId);
    toast.success(t("dissociated", "Dissocié"));
    if (selectedUser) { fetchUsers(); await fetchAssignments(selectedUser.user_id, selectedUser.role); }
  };

  const featureKeys = Object.keys((i18n.getResourceBundle(i18n.language, "admin") as any)?.features || {});
  const getFeatureLabel = (key: string) => t(`features.${key}`, { defaultValue: key });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold">{t("users")}</h1>
        <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("search_users")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter_all")}</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="student">{i18n.language === "fr" ? "Élève" : "Student"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPlan} onValueChange={(v) => { setFilterPlan(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter_all")}</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="essential">Essential</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">{t("name")}</th>
                <th className="text-left p-3 font-medium">{t("role")}</th>
                <th className="text-left p-3 font-medium">{t("plan")}</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">{t("status")}</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">{t("registered")}</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">{t("clients")}</th>
                <th className="text-right p-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((u) => (
                <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">{u.full_name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.full_name}</p>
                        {u.is_admin && <Badge variant="destructive" className="text-[9px] px-1 py-0">Admin</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                  <td className="p-3"><PlanBadge plan={u.plan_name || "free"} showTooltip={false} /></td>
                  <td className="p-3 hidden md:table-cell"><Badge variant={u.subscription_status === "active" ? "default" : "secondary"} className="text-xs">{t(`status_${u.subscription_status}`)}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{format(new Date(u.created_at), "dd/MM/yyyy")}</td>
                  <td className="p-3 text-center hidden lg:table-cell">{u.role === "coach" ? u.client_count : "—"}</td>
                  <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => openUser(u)}>{t("view")}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {paged.map((u) => (
          <button key={u.user_id} onClick={() => openUser(u)} className="w-full glass p-3 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">{u.full_name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">{u.full_name}</p>
                {u.is_admin && <Badge variant="destructive" className="text-[9px] px-1 py-0">Admin</Badge>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1 py-0">{u.role}</Badge>
                <PlanBadge plan={u.plan_name || "free"} showTooltip={false} />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
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
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{t("profile")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t("role")}</span>
                    <Badge variant="outline">{selectedUser.role}</Badge>
                    <span className="text-muted-foreground">{t("registered")}</span>
                    <span>{format(new Date(selectedUser.created_at), "dd/MM/yyyy")}</span>
                    {selectedUser.role === "coach" && (<><span className="text-muted-foreground">{t("clients")}</span><span>{selectedUser.client_count}</span></>)}
                  </div>
                </div>

                {/* Coach/Student Assignment */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    {selectedUser.role === "student" ? t("coach_assignment", "Association coach") : t("student_assignment", "Athlètes associés")}
                  </h3>
                  {coachAssignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{selectedUser.role === "student" ? t("no_coach_assigned", "Aucun coach associé") : t("no_students_assigned", "Aucun athlète associé")}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {coachAssignments.map((cs) => (
                        <div key={cs.id} className="flex items-center gap-2 text-xs bg-muted/50 p-2.5 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {(selectedUser.role === "student" ? cs.coach_name : cs.student_name)?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="flex-1 font-medium truncate">{selectedUser.role === "student" ? cs.coach_name : cs.student_name}</span>
                          <Badge variant={cs.status === "active" ? "default" : "secondary"} className="text-[9px]">{cs.status === "active" ? t("active") : t("status_expired")}</Badge>
                          <span className="text-muted-foreground text-[10px]">{format(new Date(cs.created_at), "dd/MM/yy")}</span>
                          {cs.status === "active" && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => handleDissociate(cs.id)}>
                              <Unlink className="w-3 h-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser.role === "student" ? (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-[10px] uppercase">{t("assign_coach", "Associer un coach")}</Label>
                        <Select value={assignCoachId} onValueChange={setAssignCoachId}>
                          <SelectTrigger className="text-xs mt-1"><SelectValue placeholder={t("select_coach", "Choisir un coach")} /></SelectTrigger>
                          <SelectContent>{coaches.map((c) => (<SelectItem key={c.user_id} value={c.user_id}>{c.full_name}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={handleAssignCoach} disabled={!assignCoachId}><Link2 className="w-3 h-3 mr-1" /> {t("assign", "Associer")}</Button>
                    </div>
                  ) : selectedUser.role === "coach" ? (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-[10px] uppercase">{t("assign_student", "Associer un athlète")}</Label>
                        <Select value={assignStudentId} onValueChange={setAssignStudentId}>
                          <SelectTrigger className="text-xs mt-1"><SelectValue placeholder={t("select_student", "Choisir un athlète")} /></SelectTrigger>
                          <SelectContent>{studentsList.map((s) => (<SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={handleAssignStudent} disabled={!assignStudentId}><Link2 className="w-3 h-3 mr-1" /> {t("assign", "Associer")}</Button>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{t("subscription")}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlanBadge plan={selectedUser.plan_name || "free"} showTooltip={false} />
                    <Badge variant={selectedUser.subscription_status === "active" ? "default" : "secondary"}>{t(`status_${selectedUser.subscription_status}`)}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs">{t("change_plan")}</Label>
                    <Select value={selectedUser.plan_name || "free"} onValueChange={handleChangePlan}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{allPlans.map((p: any) => (<SelectItem key={p.name} value={p.name}>{i18n.language === "fr" ? p.displayNameFr : p.displayNameEn}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{t("feature_overrides")}</h3>
                  {overrides.length === 0 ? (<p className="text-xs text-muted-foreground">{t("no_overrides")}</p>) : (
                    <div className="space-y-1">
                      {overrides.map((o: any) => (
                        <div key={o.id} className="flex items-center gap-2 text-xs bg-muted p-2 rounded flex-wrap">
                          <span className="flex-1 font-medium min-w-0 truncate">{getFeatureLabel(o.feature_key)}</span>
                          <Badge variant={o.is_enabled ? "default" : "secondary"}>{o.is_enabled ? "ON" : "OFF"}</Badge>
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => deleteOverride(o.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 border-t border-border pt-3">
                    <Label className="text-xs font-semibold">{t("add_override")}</Label>
                    <Select value={newKey} onValueChange={setNewKey}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder={t("feature_key")} /></SelectTrigger>
                      <SelectContent>{featureKeys.map((key) => (<SelectItem key={key} value={key}>{getFeatureLabel(key)}</SelectItem>))}</SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Select value={newEnabled ? "on" : "off"} onValueChange={(v) => setNewEnabled(v === "on")}>
                        <SelectTrigger className="w-20 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="on">{t("enable")}</SelectItem><SelectItem value="off">{t("disable")}</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder={t("override_reason")} value={newReason} onChange={(e) => setNewReason(e.target.value)} className="text-xs flex-1" />
                    </div>
                    <Button size="sm" onClick={addOverride} disabled={!newKey}><Plus className="w-3 h-3 mr-1" /> {t("create_override")}</Button>
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
