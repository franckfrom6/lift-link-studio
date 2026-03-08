import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, BookOpen } from "lucide-react";

const KBHome = () => {
  const { t, i18n } = useTranslation("support");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const categoryFilter = searchParams.get("category");

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from("kb_articles").select("*").eq("is_published", true).order("sort_order");
      if (categoryFilter) query = query.eq("category", categoryFilter);
      const { data } = await query;
      setArticles(data || []);
    };
    fetch();
  }, [categoryFilter]);

  const filtered = search
    ? articles.filter((a) => {
        const title = lang === "fr" ? a.title_fr : a.title_en;
        const content = lang === "fr" ? a.content_fr : a.content_en;
        const q = search.toLowerCase();
        return title.toLowerCase().includes(q) || content.toLowerCase().includes(q);
      })
    : articles;

  const categoryIcons: Record<string, string> = {
    getting_started: "🚀", programs: "📋", sessions: "🏋️", nutrition: "🍽",
    recovery: "🧊", calendar: "📅", account: "⚙️", billing: "💳", troubleshooting: "🔧",
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{categoryFilter ? t(`kb_categories.${categoryFilter}`) : t("kb_title")}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t("kb_search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">{t("kb_no_results")}</p>
            <Button variant="link" onClick={() => navigate("/support/new")}>{t("kb_no_results_desc")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/support/help/${article.slug}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{categoryIcons[article.category] || "📄"}</span>
                  <span className="font-medium text-sm">{lang === "fr" ? article.title_fr : article.title_en}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{t(`kb_categories.${article.category}`)}</Badge>
                  {article.role_target !== "both" && (
                    <Badge variant="outline" className="text-xs">{article.role_target === "coach" ? "Coach" : t("admin_target_athlete")}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KBHome;
