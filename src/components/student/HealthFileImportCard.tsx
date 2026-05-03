import { useRef, useState } from "react";
import { Upload, Loader2, FileUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HealthFileImportCard = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".fit") && !name.endsWith(".json")) {
      toast.error("Format non supporté. Utilise un fichier .fit ou .json.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 20 Mo).");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data, error } = await supabase.functions.invoke(
        "import-fit-file",
        { body: formData },
      );
      if (error) {
        const status = (error as any)?.context?.response?.status;
        let body: any = null;
        try { body = await (error as any)?.context?.response?.json?.(); } catch {}
        toast.error(body?.error ?? `Erreur d'import (${status ?? "?"})`);
        return;
      }
      const imported = data?.imported ?? 0;
      const skipped = data?.skipped ?? 0;
      if (imported === 0 && skipped === 0) {
        toast.warning("Aucune séance détectée dans le fichier.");
      } else {
        toast.success(
          `${imported} séance${imported > 1 ? "s" : ""} importée${imported > 1 ? "s" : ""}` +
          (skipped > 0 ? `, ${skipped} déjà existante${skipped > 1 ? "s" : ""}` : ""),
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur d'import");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="glass p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <FileUp className="w-6 h-6 text-accent-foreground" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">Import manuel (.fit / Apple Health)</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Importe un fichier <code>.fit</code> (Garmin) ou un export JSON Health Auto Export (iOS).
          </p>
        </div>
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="mt-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors min-h-[120px]"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".fit,.json,application/json"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {busy ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Import en cours…</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">Glisse un fichier ou clique pour parcourir</span>
            <span className="text-xs text-muted-foreground">.fit · .json — 20 Mo max</span>
          </>
        )}
      </label>

      <a
        href="https://www.healthexport.app/"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Comment exporter depuis Apple Health ?
      </a>
    </div>
  );
};

export default HealthFileImportCard;