import { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Menu, ArrowLeft, ChevronRight } from "lucide-react";
import KBSidebar from "@/components/kb/KBSidebar";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const KBLayout = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await db
        .from("kb_articles")
        .select("id, slug, title_fr, title_en, category, content_fr, content_en, role_target, sort_order, view_count")
        .eq("is_published", true)
        .order("sort_order");
      setArticles(data || []);
    };
    fetchArticles();
  }, []);

  const filteredArticles = search
    ? articles.filter((a) => {
        const title = lang === "fr" ? a.title_fr : a.title_en;
        const content = lang === "fr" ? a.content_fr : a.content_en;
        const q = search.toLowerCase();
        return title.toLowerCase().includes(q) || content.toLowerCase().includes(q);
      })
    : articles;

  // Find active article for breadcrumb
  const activeArticle = slug ? articles.find((a) => a.slug === slug) : null;
  const activeCategory = activeArticle?.category;

  const CATEGORY_LABELS: Record<string, string> = {
    getting_started: t("kb_categories.getting_started"),
    programs: t("kb_categories.programs"),
    sessions: t("kb_categories.sessions"),
    nutrition: t("kb_categories.nutrition"),
    calendar: t("kb_categories.calendar"),
    account: t("kb_categories.account"),
    troubleshooting: t("kb_categories.troubleshooting"),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("kb_search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>
              <KBSidebar articles={filteredArticles} activeSlug={slug} onSelect={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <button onClick={() => navigate("/support/help")} className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold text-sm text-foreground hidden sm:inline">{t("kb_title")}</span>
          </button>

          <div className="flex-1" />

          {/* Desktop search */}
          <div className="hidden lg:block relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("kb_search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <LanguageSwitcher />

          <Button variant="ghost" size="sm" onClick={() => navigate("/support")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("support_title")}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0 border-r border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <KBSidebar articles={filteredArticles} activeSlug={slug} />
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          {/* Mobile breadcrumb */}
          {slug && activeArticle && (
            <div className="lg:hidden flex items-center gap-1 px-4 py-2 text-xs text-muted-foreground border-b border-border">
              <button onClick={() => navigate("/support/help")} className="hover:text-foreground">
                {t("help_center")}
              </button>
              <ChevronRight className="w-3 h-3" />
              {activeCategory && (
                <>
                  <span>{CATEGORY_LABELS[activeCategory] || activeCategory}</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-foreground truncate">
                {lang === "fr" ? activeArticle.title_fr : activeArticle.title_en}
              </span>
            </div>
          )}

          <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet context={{ articles: filteredArticles, search, setSearch }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default KBLayout;
