import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import KBArticleRenderer from "@/components/kb/KBArticleRenderer";

const KBArticle = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const { articles } = useOutletContext<any>();
  const [article, setArticle] = useState<any>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data } = await db.from("kb_articles").select("*").eq("slug", slug).single();
      if (data) {
        setArticle(data);
        await db.from("kb_articles").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);
      }
    };
    fetchArticle();
  }, [slug]);

  if (!article) {
    return <div className="py-12 text-center text-muted-foreground">{t("kb_no_results")}</div>;
  }

  const content = lang === "fr" ? article.content_fr : article.content_en;

  // Related articles (same category, excluding current)
  const related = articles
    ?.filter((a: any) => a.category === article.category && a.slug !== slug)
    ?.slice(0, 3) || [];

  return (
    <div className="animate-fade-in">
      {/* Article content */}
      <article className="kb-article">
        <KBArticleRenderer content={content} />
      </article>

      {/* Helpful */}
      <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <Button variant="outline" size="sm" onClick={() => navigate("/support/new")}>
          {t("kb_still_issue")} {t("kb_create_ticket")}
        </Button>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{t("kb_related")}</h3>
          <div className="space-y-2">
            {related.map((a: any) => (
              <button
                key={a.id}
                onClick={() => navigate(`/support/help/${a.slug}`)}
                className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/50 transition-colors text-foreground"
              >
                • {lang === "fr" ? a.title_fr : a.title_en}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KBArticle;
