import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";

const KBArticle = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [article, setArticle] = useState<any>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("kb_articles").select("*").eq("slug", slug).single();
      if (data) {
        setArticle(data);
        // Increment view count
        await supabase.from("kb_articles").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);
      }
    };
    fetch();
  }, [slug]);

  if (!article) return null;

  const title = lang === "fr" ? article.title_fr : article.title_en;
  const content = lang === "fr" ? article.content_fr : article.content_en;

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(2)}</h2>;
      if (line.startsWith("## ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h3>;
      if (line.startsWith("### ")) return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h4>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.slice(2)}</li>;
      if (line.match(/^\d+\./)) return <li key={i} className="ml-4 text-sm text-muted-foreground list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <Card>
        <CardContent className="p-6 prose prose-sm max-w-none">
          {renderContent(content)}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t("kb_helpful")}</span>
          <Button
            variant={helpful === true ? "default" : "outline"}
            size="sm"
            onClick={() => setHelpful(true)}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            variant={helpful === false ? "default" : "outline"}
            size="sm"
            onClick={() => setHelpful(false)}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/support/new`)}>
          {t("kb_still_issue")} {t("kb_create_ticket")}
        </Button>
      </div>
    </div>
  );
};

export default KBArticle;
