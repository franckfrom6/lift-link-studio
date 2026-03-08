import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";

const CATEGORIES = [
  { key: "getting_started", icon: "🚀" },
  { key: "programs", icon: "📋" },
  { key: "sessions", icon: "🏋️" },
  { key: "nutrition", icon: "🍽" },
  { key: "calendar", icon: "📅" },
  { key: "account", icon: "⚙️" },
  { key: "troubleshooting", icon: "🔧" },
];

const KBHome = () => {
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const { articles, search, setSearch } = useOutletContext<any>();

  const categoryGroups = CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a: any) => a.category === cat.key),
  })).filter((cat) => cat.articles.length > 0);

  // Popular articles (top 5 by view_count)
  const popular = [...articles].sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);

  // If searching, show flat list
  if (search) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("kb_search")}</h1>
        {articles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">{t("kb_no_results")}</p>
              <Button variant="link" onClick={() => navigate("/support/new")}>{t("kb_no_results_desc")}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {articles.map((article: any) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/support/help/${article.slug}`)}
              >
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{lang === "fr" ? article.title_fr : article.title_en}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {(lang === "fr" ? article.content_fr : article.content_en).replace(/[#*>\-]/g, "").slice(0, 150)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{t("kb_title")}</h1>
        {/* Mobile search */}
        <div className="lg:hidden relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("kb_search")}
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categoryGroups.map((cat) => (
          <Card
            key={cat.key}
            className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
            onClick={() => {
              const first = cat.articles[0];
              if (first) navigate(`/support/help/${first.slug}`);
            }}
          >
            <CardContent className="p-4 text-center">
              <span className="text-2xl block mb-2">{cat.icon}</span>
              <p className="font-semibold text-sm">{t(`kb_categories.${cat.key}`)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("kb_articles_count", { count: cat.articles.length })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular articles */}
      {popular.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{lang === "fr" ? "Articles populaires" : "Popular articles"}</h2>
          <div className="space-y-2">
            {popular.map((article: any) => (
              <button
                key={article.id}
                onClick={() => navigate(`/support/help/${article.slug}`)}
                className="block w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <p className="text-sm font-medium">{lang === "fr" ? article.title_fr : article.title_en}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KBHome;
