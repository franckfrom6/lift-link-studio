import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HelpCircle } from "lucide-react";
import KBArticleRenderer from "@/components/kb/KBArticleRenderer";

interface ContextualHelpProps {
  slug: string;
  className?: string;
}

const ContextualHelp = ({ slug, className }: ContextualHelpProps) => {
  const { t, i18n } = useTranslation("support");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [article, setArticle] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const { data } = await db.from("kb_articles").select("*").eq("slug", slug).eq("is_published", true).single();
      setArticle(data);
    };
    fetch();
  }, [slug, open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-full ${className}`}>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{article ? (lang === "fr" ? article.title_fr : article.title_en) : "..."}</SheetTitle>
        </SheetHeader>
        {article ? (
          <div className="mt-4">
            <KBArticleRenderer content={lang === "fr" ? article.content_fr : article.content_en} />
            <div className="mt-6 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); navigate("/support/new"); }}>
                {t("kb_still_issue")} {t("kb_create_ticket")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">{t("kb_no_results")}</p>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ContextualHelp;
