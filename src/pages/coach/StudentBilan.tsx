import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import AIBilanView, { BilanData, BilanRawData } from "@/components/coach/AIBilanView";
import { generateBilanPDF } from "@/lib/report-generator";

const StudentBilan = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("bilan");

  const today = new Date();
  const eightWeeksAgo = new Date(today.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [dateStart, setDateStart] = useState(eightWeeksAgo.toISOString().split("T")[0]);
  const [dateEnd, setDateEnd] = useState(today.toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [bilan, setBilan] = useState<BilanData | null>(null);
  const [rawData, setRawData] = useState<BilanRawData | null>(null);
  const [coachNotes, setCoachNotes] = useState("");

  const handleGenerate = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-bilan", {
        body: {
          student_id: studentId,
          date_start: dateStart,
          date_end: dateEnd,
          lang: i18n.language,
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error(t("rate_limit"));
        } else if (data.error.includes("Payment")) {
          toast.error(t("payment_required"));
        } else {
          toast.error(t("error"));
        }
        return;
      }

      setBilan(data.bilan);
      setRawData(data.raw_data);
    } catch (err) {
      console.error(err);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!bilan || !rawData) return;
    const doc = generateBilanPDF(bilan, rawData, coachNotes || undefined);
    doc.save(`bilan-${rawData.student_name.replace(/\s+/g, "-").toLowerCase()}-${dateEnd}.pdf`);
    toast.success(t("pdf_downloaded"));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          {t("title")}
        </h1>
      </div>

      {/* Date range selector */}
      {!bilan && (
        <div className="glass p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("date_start")}</Label>
              <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            </div>
            <div>
              <Label>{t("date_end")}</Label>
              <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                {t("generate")}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Bilan view */}
      {bilan && rawData && (
        <>
          <AIBilanView
            bilan={bilan}
            rawData={rawData}
            onBilanChange={setBilan}
            onGeneratePDF={handleGeneratePDF}
          />

          {/* Coach notes */}
          <div className="glass p-4 space-y-2">
            <Label>{t("coach_notes")}</Label>
            <Textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder={t("coach_notes_placeholder")}
              className="min-h-[80px]"
            />
          </div>

          {/* Reset */}
          <Button variant="outline" onClick={() => { setBilan(null); setRawData(null); }} className="w-full">
            {t("generate")} (nouveau)
          </Button>
        </>
      )}
    </div>
  );
};

export default StudentBilan;
