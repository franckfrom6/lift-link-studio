import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, Brain, Dumbbell, Apple, Heart, MessageSquare, FileText, Pencil, Save } from "lucide-react";

export interface BilanData {
  summary: string;
  highlights: string[];
  areas_to_improve: string[];
  strength_progress: { assessment: string; detail: string };
  nutrition_assessment: { adherence: string; detail: string };
  recovery_assessment: { detail: string };
  next_cycle_recommendations: string[];
  suggested_program_adjustments: string;
  coach_talking_points: string[];
}

export interface BilanRawData {
  student_name: string;
  student_level: string;
  student_goal: string;
  date_start: string;
  date_end: string;
  weeks: number;
  sessions_completed: number;
  sessions_programmed: number;
  adherence_rate: number;
  external_count: number;
  external_breakdown: Record<string, number>;
  total_volume: number;
  swaps_count: number;
  weight_start?: number;
  weight_end?: number;
  days_logged: number;
  total_days: number;
  avg_macros: { protein: number; carbs: number; fat: number };
  target_macros: { protein?: number; carbs?: number; fat?: number };
  avg_energy: string;
  avg_sleep: string;
  avg_stress: string;
  avg_soreness: string;
}

interface AIBilanViewProps {
  bilan: BilanData;
  rawData: BilanRawData;
  onBilanChange: (bilan: BilanData) => void;
  onGeneratePDF: () => void;
}

const AIBilanView = ({ bilan, rawData, onBilanChange, onGeneratePDF }: AIBilanViewProps) => {
  const { t } = useTranslation("bilan");
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const assessmentColor = (val: string) => {
    if (["excellent"].includes(val)) return "text-green-600 bg-green-50 border-green-200";
    if (["bon"].includes(val)) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const EditableText = ({ field, value }: { field: string; value: string }) => {
    const isEditing = editingSection === field;
    return (
      <div className="relative group">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => onBilanChange({ ...bilan, [field]: e.target.value })}
              className="min-h-[80px]"
            />
            <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
              <Save className="w-3 h-3 mr-1" /> {t("save")}
            </Button>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={() => setEditingSection(field)}>
            <p className="text-sm text-foreground">{value}</p>
            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 absolute top-0 right-0 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  const EditableList = ({ field, items }: { field: string; items: string[] }) => {
    const isEditing = editingSection === field;
    return (
      <div className="relative group">
        {isEditing ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <Textarea
                key={i}
                value={item}
                onChange={(e) => {
                  const updated = [...items];
                  updated[i] = e.target.value;
                  onBilanChange({ ...bilan, [field]: updated });
                }}
                className="min-h-[40px]"
              />
            ))}
            <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
              <Save className="w-3 h-3 mr-1" /> {t("save")}
            </Button>
          </div>
        ) : (
          <ul className="space-y-1 cursor-pointer" onClick={() => setEditingSection(field)}>
            {items.map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 absolute top-0 right-0 transition-opacity" />
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {rawData.student_name} · {rawData.date_start} → {rawData.date_end} ({rawData.weeks} {t("weeks")})
          </p>
        </div>
        <Button onClick={onGeneratePDF} size="sm">
          <FileText className="w-4 h-4 mr-1" /> {t("generate_pdf")}
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText field="summary" value={bilan.summary} />
        </CardContent>
      </Card>

      {/* Highlights + Areas to improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> {t("highlights")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableList field="highlights" items={bilan.highlights} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> {t("areas_to_improve")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableList field="areas_to_improve" items={bilan.areas_to_improve} />
          </CardContent>
        </Card>
      </div>

      {/* Strength */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> {t("strength")}
            <Badge variant="outline" className={assessmentColor(bilan.strength_progress.assessment)}>
              {bilan.strength_progress.assessment}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText field="strength_detail" value={bilan.strength_progress.detail} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="glass p-2 text-center">
              <p className="font-semibold text-foreground">{rawData.sessions_completed}/{rawData.sessions_programmed}</p>
              <p>{t("sessions")}</p>
            </div>
            <div className="glass p-2 text-center">
              <p className="font-semibold text-foreground">{rawData.adherence_rate}%</p>
              <p>{t("adherence")}</p>
            </div>
            <div className="glass p-2 text-center">
              <p className="font-semibold text-foreground">{Math.round(rawData.total_volume).toLocaleString()} kg</p>
              <p>{t("volume")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Apple className="w-4 h-4" /> {t("nutrition")}
            <Badge variant="outline" className={assessmentColor(bilan.nutrition_assessment.adherence)}>
              {bilan.nutrition_assessment.adherence}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText field="nutrition_detail" value={bilan.nutrition_assessment.detail} />
          <div className="mt-2 text-xs text-muted-foreground">
            <p>{t("days_logged")}: {rawData.days_logged}/{rawData.total_days}</p>
            <p>{t("avg_macros")}: P {rawData.avg_macros.protein}g / C {rawData.avg_macros.carbs}g / L {rawData.avg_macros.fat}g</p>
          </div>
        </CardContent>
      </Card>

      {/* Recovery */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" /> {t("recovery")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText field="recovery_detail" value={bilan.recovery_assessment.detail} />
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="text-center">
              <p className="font-semibold text-foreground">⚡ {rawData.avg_energy}</p>
              <p>{t("energy")}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">😴 {rawData.avg_sleep}</p>
              <p>{t("sleep")}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">😰 {rawData.avg_stress}</p>
              <p>{t("stress")}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">💪 {rawData.avg_soreness}</p>
              <p>{t("soreness")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("recommendations")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EditableList field="next_cycle_recommendations" items={bilan.next_cycle_recommendations} />
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t("program_adjustments")}</p>
            <EditableText field="suggested_program_adjustments" value={bilan.suggested_program_adjustments} />
          </div>
        </CardContent>
      </Card>

      {/* Coach talking points */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> {t("talking_points")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList field="coach_talking_points" items={bilan.coach_talking_points} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AIBilanView;
