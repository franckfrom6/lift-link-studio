import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, Check, X, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const AdminPilotRequests = () => {
  const { t } = useTranslation("admin");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["pilot-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pilot_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const filtered = filter === "all" ? requests : requests.filter((r: any) => r.status === filter);

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from("pilot_requests" as any)
      .update({ status: "rejected" } as any)
      .eq("id", id);
    setProcessingId(null);
    if (error) {
      toast.error("Error");
    } else {
      toast.success(t("pilot_rejected", "Request rejected"));
      queryClient.invalidateQueries({ queryKey: ["pilot-requests"] });
    }
  };

  const openCreateModal = (req: any) => {
    setCreateModal(req);
    // Generate a random temp password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setTempPassword(pw);
  };

  const handleCreateAccount = async () => {
    if (!createModal || !tempPassword) return;
    setCreating(true);

    try {
      // Use edge function to create user (admin can't call signUp for others without service role)
      const { data, error } = await supabase.functions.invoke("create-pilot-user", {
        body: {
          email: createModal.email,
          password: tempPassword,
          full_name: `${createModal.first_name} ${createModal.last_name}`,
          role: createModal.role === "coach" ? "coach" : "student",
        },
      });

      if (error) throw error;

      // Mark pilot request as accepted
      await supabase
        .from("pilot_requests" as any)
        .update({ status: "accepted" } as any)
        .eq("id", createModal.id);

      toast.success(t("pilot_accepted", "Account created ✓"));
      queryClient.invalidateQueries({ queryKey: ["pilot-requests"] });
      setCreateModal(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error creating account");
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">{t("pilot_title", "Pilot Requests")}</h1>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-xs">{pendingCount}</Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`pilot_filter_${f}`, f.charAt(0).toUpperCase() + f.slice(1))}
            {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass p-8 text-center text-muted-foreground">
          {t("pilot_no_requests", "No requests")}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((req: any) => (
          <div key={req.id} className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {req.first_name} {req.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{req.email}</p>
              {req.objective && (
                <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{req.objective}"</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[10px]">
                {req.role === "coach" ? "Coach" : "Athlète"}
              </Badge>
              <Badge
                variant={req.status === "pending" ? "secondary" : req.status === "accepted" ? "default" : "destructive"}
                className="text-[10px]"
              >
                {req.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {new Date(req.created_at).toLocaleDateString()}
              </span>

              {req.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreateModal(req)}
                    disabled={processingId === req.id}
                    className="gap-1 h-7 text-xs"
                  >
                    <UserPlus className="w-3 h-3" />
                    {t("pilot_accept", "Accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                    className="gap-1 h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create account modal */}
      <Dialog open={!!createModal} onOpenChange={(open) => { if (!open) setCreateModal(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pilot_create_account", "Create account")}</DialogTitle>
          </DialogHeader>
          {createModal && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("pilot_first_name", "First name")}</Label>
                  <Input value={createModal.first_name} readOnly className="bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("pilot_last_name", "Last name")}</Label>
                  <Input value={createModal.last_name} readOnly className="bg-muted" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={createModal.email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("role", "Role")}</Label>
                <Input value={createModal.role === "coach" ? "Coach" : "Athlete"} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("pilot_temp_password", "Temporary password")}</Label>
                <Input
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateAccount}
                disabled={creating || !tempPassword}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {t("pilot_create_button", "Create & Accept")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPilotRequests;
