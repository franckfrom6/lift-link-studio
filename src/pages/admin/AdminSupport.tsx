import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  waiting_response: "bg-orange-500/10 text-orange-600",
  resolved: "bg-green-500/10 text-green-600",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-yellow-600",
  high: "text-orange-600",
  urgent: "text-destructive",
};

const AdminSupport = () => {
  const { t } = useTranslation("support");
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    const { data } = await db.from("support_tickets").select("*").order("created_at", { ascending: false });
    setTickets(data || []);

    // Fetch user names
    const userIds = [...new Set((data || []).map((t: any) => t.user_id))];
    if (userIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p.full_name; });
      setProfiles(map);
    }
  };

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    const { data } = await db.from("ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const sendReply = async (isInternal = false) => {
    const msg = isInternal ? internalNote : reply;
    if (!msg.trim() || !user || !selectedTicket) return;
    setSending(true);
    await db.from("ticket_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      message: msg.trim(),
      is_internal: isInternal,
    });
    if (!isInternal) {
      await db.from("support_tickets").update({ status: "waiting_response" }).eq("id", selectedTicket.id);
    }
    setSending(false);
    isInternal ? setInternalNote("") : setReply("");
    toast.success(t("message_sent"));
    openTicket(selectedTicket);
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    await db.from("support_tickets").update({ 
      status, 
      ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
      ...(status === "in_progress" ? { assigned_to: user?.id } : {}),
    }).eq("id", selectedTicket.id);
    toast.success(t("ticket_updated"));
    setSelectedTicket({ ...selectedTicket, status });
    fetchTickets();
  };

  const filtered = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h1 className="text-2xl font-bold">{t("admin_support")}</h1>
          {openCount > 0 && <Badge variant="destructive">{openCount}</Badge>}
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "open", "in_progress", "waiting_response", "resolved", "closed"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "all" ? t("statuses.open") + " / " + t("statuses.in_progress") : t(`statuses.${s}`)}
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("subject")}</TableHead>
            <TableHead>User</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("priority")}</TableHead>
            <TableHead>{t("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((ticket) => (
            <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/50" onClick={() => openTicket(ticket)}>
              <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
              <TableCell className="font-medium">{ticket.subject}</TableCell>
              <TableCell className="text-muted-foreground">{profiles[ticket.user_id] || "—"}</TableCell>
              <TableCell><Badge variant="secondary">{t(`categories.${ticket.category}`)}</Badge></TableCell>
              <TableCell><span className={priorityColors[ticket.priority]}>{t(`priorities.${ticket.priority}`)}</span></TableCell>
              <TableCell><Badge variant="outline" className={statusColors[ticket.status]}>{t(`statuses.${ticket.status}`)}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedTicket.ticket_number}</span>
                  {selectedTicket.subject}
                </DialogTitle>
              </DialogHeader>

              <div className="flex gap-2 flex-wrap">
                <Select value={selectedTicket.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["open", "in_progress", "waiting_response", "resolved", "closed"].map((s) => (
                      <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => updateStatus("in_progress")}>
                  {t("admin_assign_to_me")}
                </Button>
              </div>

              <Card>
                <CardContent className="p-3 text-sm whitespace-pre-wrap">{selectedTicket.description}</CardContent>
              </Card>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.is_internal ? "bg-yellow-500/10 border border-yellow-500/30" : msg.sender_id === selectedTicket.user_id ? "bg-secondary" : "bg-primary/10"}`}>
                    {msg.is_internal && <span className="text-[10px] font-semibold text-yellow-600 block mb-1">🔒 {t("admin_internal_note")}</span>}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {profiles[msg.sender_id] || "Support"} · {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("reply_placeholder")} rows={2} className="flex-1" />
                  <Button onClick={() => sendReply(false)} disabled={sending || !reply.trim()} size="icon" className="self-end">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder={t("admin_internal_note_placeholder")} rows={2} className="flex-1 border-yellow-500/30" />
                  <Button variant="outline" onClick={() => sendReply(true)} disabled={sending || !internalNote.trim()} size="icon" className="self-end border-yellow-500/30">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
