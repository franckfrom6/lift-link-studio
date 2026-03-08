import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  category: string;
}

interface KBSidebarProps {
  articles: Article[];
  activeSlug?: string;
  onSelect?: () => void;
}

const CATEGORIES = [
  { key: "getting_started", icon: "🚀" },
  { key: "programs", icon: "📋" },
  { key: "sessions", icon: "🏋️" },
  { key: "nutrition", icon: "🍽" },
  { key: "calendar", icon: "📅" },
  { key: "account", icon: "⚙️" },
  { key: "troubleshooting", icon: "🔧" },
];

const KBSidebar = ({ articles, activeSlug, onSelect }: KBSidebarProps) => {
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.key),
  })).filter((cat) => cat.articles.length > 0);

  return (
    <nav className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {grouped.map((cat) => (
          <Collapsible key={cat.key} defaultOpen={cat.articles.some((a) => a.slug === activeSlug)}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 rounded-md transition-colors">
              <span>{cat.icon}</span>
              <span className="flex-1 text-left">{t(`kb_categories.${cat.key}`)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 border-l border-border pl-2 space-y-0.5 py-1">
                {cat.articles.map((article) => {
                  const isActive = article.slug === activeSlug;
                  const title = lang === "fr" ? article.title_fr : article.title_en;
                  return (
                    <button
                      key={article.id}
                      onClick={() => {
                        navigate(`/support/help/${article.slug}`);
                        onSelect?.();
                      }}
                      className={cn(
                        "block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium border-l-2 border-accent-foreground -ml-[1px]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <div className="border-t border-border p-4">
        <button
          onClick={() => {
            navigate("/support/new");
            onSelect?.();
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t("kb_still_issue")} {t("kb_create_ticket")}</span>
        </button>
      </div>
    </nav>
  );
};

export default KBSidebar;
