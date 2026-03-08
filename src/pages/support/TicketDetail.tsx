import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  waiting_response: "bg-orange-500/10 text-orange-600",
  resolved: "bg-green-500/10 text-green-600",
  closed: "bg-muted text-muted-foreground",
};

const TicketDetail = () => {
  const { ticketId } = useParams();
  const { t } = useTranslation("support");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!ticketId) return;
    const { data: t } = await supabase.from("support_tickets").select("*").eq("id", ticketId).single();
    setTicket(t);
    const { data: m } = await supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
    setMessages(m || []);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !ticketId) return;
    setSending(true);
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message: newMessage.trim(),
    });
    setSending(false);
    if (error) toast.error(error.message);
    else {
      setNewMessage("");
      toast.success(t("message_sent"));
    }
  };

  if (!ticket) return null;

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            <Badge variant="outline" className={statusColors[ticket.status] || ""}>{t(`statuses.${ticket.status}`)}</Badge>
          </div>
          <h1 className="text-lg font-bold truncate">{ticket.subject}</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="secondary">{t(`categories.${ticket.category}`)}</Badge>
            <Badge variant="outline">{t(`priorities.${ticket.priority}`)}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <p className="whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEnd} />
      </div>

      {ticket.status !== "closed" && ticket.status !== "resolved" && (
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("type_message")}
            rows={2}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon" className="self-end">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
