import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Plus, Search, BookOpen, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  waiting_response: "bg-orange-500/10 text-orange-600",
  resolved: "bg-green-500/10 text-green-600",
  closed: "bg-muted text-muted-foreground",
};

const SupportPage = () => {
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kbSearch, setKbSearch] = useState("");
  const [kbCategories, setKbCategories] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTickets(data || []);

      const { data: articles } = await supabase
        .from("kb_articles")
        .select("category")
        .eq("is_published", true);
      const counts: Record<string, number> = {};
      (articles || []).forEach((a: any) => {
        counts[a.category] = (counts[a.category] || 0) + 1;
      });
      setKbCategories(counts);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel("support-tickets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days} ${t("days")}`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours} ${t("hours")}`;
    return `${Math.floor(diff / 60000)} ${t("minutes")}`;
  };

  const categoryIcons: Record<string, string> = {
    getting_started: "🚀", programs: "📋", sessions: "🏋️", nutrition: "🍽",
    recovery: "🧊", calendar: "📅", account: "⚙️", billing: "💳", troubleshooting: "🔧",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">{t("support_title")}</h1>
        </div>
      </div>

      <Tabs defaultValue="help">
        <TabsList>
          <TabsTrigger value="help" className="gap-2"><BookOpen className="w-4 h-4" />{t("help_center")}</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2"><MessageSquare className="w-4 h-4" />{t("my_tickets")}</TabsTrigger>
        </TabsList>

        <TabsContent value="help" className="space-y-6 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("kb_search")}
              value={kbSearch}
              onChange={(e) => setKbSearch(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => { if (e.key === "Enter" && kbSearch) navigate(`/support/help?q=${encodeURIComponent(kbSearch)}`); }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(categoryIcons).map(([cat, icon]) => (
              <Card
                key={cat}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/support/help?category=${cat}`)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-medium text-sm">{t(`kb_categories.${cat}`)}</p>
                  <p className="text-xs text-muted-foreground">{t("kb_articles_count", { count: kbCategories[cat] || 0 })}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => navigate("/support/new")} className="gap-2">
              <Plus className="w-4 h-4" /> {t("new_ticket")}
            </Button>
          </div>

          {tickets.length === 0 && !loading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">{t("no_tickets")}</p>
                <p className="text-sm">{t("no_tickets_desc")}</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/support/ticket/${ticket.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                        <span className="text-sm font-medium truncate">{ticket.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={statusColors[ticket.status] || ""}>
                          {t(`statuses.${ticket.status}`)}
                        </Badge>
                        <Badge variant="secondary">{t(`categories.${ticket.category}`)}</Badge>
                        <span className="text-xs text-muted-foreground">{t("time_ago", { time: timeAgo(ticket.created_at) })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportPage;
