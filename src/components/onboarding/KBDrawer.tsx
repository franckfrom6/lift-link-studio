import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ChevronLeft } from "lucide-react";
import KBArticleRenderer from "@/components/kb/KBArticleRenderer";

interface KBDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  onboarding: "🚀",
  session: "🏋️",
  program: "📋",
  nutrition: "🍽",
  coach: "👨‍🏫",
  technical: "⚙️",
  faq: "❓",
  getting_started: "🚀",
  programs: "📋",
  sessions: "🏋️",
  calendar: "📅",
  account: "⚙️",
  troubleshooting: "🔧",
  recovery: "💆",
};

const KBDrawer = ({ open, onClose }: KBDrawerProps) => {
  const { t, i18n } = useTranslation(["support", "common"]);
  const { role } = useAuth();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    const fetchArticles = async () => {
      // Fetch from both kb_articles (existing) and knowledge_base (new) tables
      const db = supabase as any;
      
      // Existing kb_articles
      const { data: kbData } = await db
        .from("kb_articles")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");

      setArticles(kbData || []);
    };
    fetchArticles();
  }, [open]);

  const filtered = articles.filter((a) => {
    // Role filter
    const target = a.role_target;
    if (role === "student" && target === "coach") return false;
    if (role === "coach" && target === "athlete") return false;

    // Search filter
    if (search) {
      const title = lang === "fr" ? a.title_fr : a.title_en;
      const content = lang === "fr" ? a.content_fr : a.content_en;
      const q = search.toLowerCase();
      return title?.toLowerCase().includes(q) || content?.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category
  const grouped = filtered.reduce((acc: Record<string, any[]>, a) => {
    const cat = a.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            {selectedArticle && (
              <button onClick={() => setSelectedArticle(null)} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <SheetTitle className="text-base">
              {selectedArticle
                ? (lang === "fr" ? selectedArticle.title_fr : selectedArticle.title_en)
                : t("support:help_center")}
            </SheetTitle>
          </div>
          {!selectedArticle && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("support:kb_search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {selectedArticle ? (
            <div className="p-4">
              <KBArticleRenderer
                content={lang === "fr" ? selectedArticle.content_fr : selectedArticle.content_en}
              />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {Object.keys(grouped).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("support:kb_no_results")}</p>
                </div>
              )}

              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{CATEGORY_ICONS[cat] || "📄"}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(`support:kb_categories.${cat}`, cat)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(items as any[]).map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
                      >
                        <p className="text-sm font-medium">
                          {lang === "fr" ? article.title_fr : article.title_en}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KBDrawer;
