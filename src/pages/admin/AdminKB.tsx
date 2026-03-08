import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminKB = () => {
  const { t, i18n } = useTranslation("support");
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [articles, setArticles] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title_fr: "", title_en: "", content_fr: "", content_en: "",
    category: "getting_started", role_target: "both", tags: "", is_published: false, slug: "",
  });

  const fetchArticles = async () => {
    const { data } = await supabase.from("kb_articles").select("*").order("sort_order");
    setArticles(data || []);
  };

  useEffect(() => { fetchArticles(); }, []);

  const openEditor = (article?: any) => {
    if (article) {
      setForm({
        title_fr: article.title_fr, title_en: article.title_en,
        content_fr: article.content_fr, content_en: article.content_en,
        category: article.category, role_target: article.role_target,
        tags: (article.tags || []).join(", "), is_published: article.is_published,
        slug: article.slug,
      });
      setEditing(article);
    } else {
      setForm({ title_fr: "", title_en: "", content_fr: "", content_en: "", category: "getting_started", role_target: "both", tags: "", is_published: false, slug: "" });
      setEditing({});
    }
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    const slug = form.slug || form.title_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      title_fr: form.title_fr, title_en: form.title_en,
      content_fr: form.content_fr, content_en: form.content_en,
      category: form.category, role_target: form.role_target,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_published: publish, slug,
    };

    if (editing?.id) {
      await supabase.from("kb_articles").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("kb_articles").insert(payload);
    }
    setSaving(false);
    toast.success(t("admin_article_saved"));
    setEditing(null);
    fetchArticles();
  };

  const categories = ["getting_started", "programs", "sessions", "nutrition", "recovery", "calendar", "account", "billing", "troubleshooting"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <h1 className="text-2xl font-bold">{t("admin_kb")}</h1>
        </div>
        <Button onClick={() => openEditor()} className="gap-2"><Plus className="w-4 h-4" />{t("admin_new_article")}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("admin_target")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("admin_views")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((a) => (
            <TableRow key={a.id} className="cursor-pointer hover:bg-accent/50" onClick={() => openEditor(a)}>
              <TableCell className="font-medium">{lang === "fr" ? a.title_fr : a.title_en}</TableCell>
              <TableCell><Badge variant="secondary">{t(`kb_categories.${a.category}`)}</Badge></TableCell>
              <TableCell>{a.role_target === "both" ? t("admin_target_both") : a.role_target === "coach" ? "Coach" : t("admin_target_athlete")}</TableCell>
              <TableCell><Badge variant={a.is_published ? "default" : "outline"}>{a.is_published ? t("admin_published") : t("admin_draft")}</Badge></TableCell>
              <TableCell>{a.view_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("admin_edit_article") : t("admin_new_article")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin_title_fr")} *</Label>
                <Input value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin_title_en")} *</Label>
                <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{t(`kb_categories.${c}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("admin_target")}</Label>
                <RadioGroup value={form.role_target} onValueChange={(v) => setForm({ ...form, role_target: v })} className="flex gap-4">
                  <div className="flex items-center gap-1"><RadioGroupItem value="coach" id="t-coach" /><Label htmlFor="t-coach">Coach</Label></div>
                  <div className="flex items-center gap-1"><RadioGroupItem value="athlete" id="t-ath" /><Label htmlFor="t-ath">{t("admin_target_athlete")}</Label></div>
                  <div className="flex items-center gap-1"><RadioGroupItem value="both" id="t-both" /><Label htmlFor="t-both">{t("admin_target_both")}</Label></div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("admin_content_fr")} *</Label>
              <Textarea value={form.content_fr} onChange={(e) => setForm({ ...form, content_fr: e.target.value })} rows={8} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>{t("admin_content_en")} *</Label>
              <Textarea value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} rows={8} className="font-mono text-sm" />
            </div>

            <div className="space-y-2">
              <Label>{t("admin_tags")}</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2, tag3" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin_save_draft")}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin_publish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKB;
