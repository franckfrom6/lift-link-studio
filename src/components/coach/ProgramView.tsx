import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FullProgram, ProgramExerciseDetail, ProgramSection } from "@/data/yana-program";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Clock, Target, Play, Dumbbell, MessageSquare, TrendingUp } from "lucide-react";

interface ProgramViewProps {
  program: FullProgram;
}

const ExerciseRow = ({ ex, idx }: { ex: ProgramExerciseDetail; idx: number }) => {
  const { t } = useTranslation(["session", "program"]);
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 py-3 px-1 text-left hover:bg-secondary/50 transition-colors rounded-lg"
      >
        <span className="text-accent-foreground font-bold text-sm min-w-[24px] mt-0.5">{idx + 1}.</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{ex.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ex.sets && <Tag label={t("session:sets")} value={ex.sets} type="sets" />}
            {ex.reps && <Tag label={t("session:reps")} value={ex.reps} type="sets" />}
            {ex.tempo && <Tag label="Tempo" value={ex.tempo} type="sets" />}
            {ex.rest && ex.rest !== "—" && <Tag label={t("common:rest")} value={ex.rest} type="rest" />}
            {ex.rpe && <Tag label="RPE" value={ex.rpe} type="rpe" />}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="ml-9 pb-3 space-y-2 animate-fade-in">
          {ex.load && (
            <div className="flex items-center gap-2 text-sm">
              <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-muted-foreground">{t("program:load_label")} :</span>
              <span className="font-medium">{ex.load}</span>
            </div>
          )}
          {ex.notes && (
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <span className="text-muted-foreground leading-relaxed">{ex.notes}</span>
            </div>
          )}
          {ex.video && (
            <a
              href={ex.video}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-tag-red/10 hover:bg-tag-red/20 text-tag-red px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mt-1"
            >
              <Play className="w-3 h-3" strokeWidth={1.5} />
              {t("session:video_label")} — {ex.channel}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const Tag = ({ label, value, type }: { label: string; value: string; type?: "sets" | "rest" | "rpe" }) => {
  const colorClass = type === "rest"
    ? "bg-tag-blue-bg text-tag-blue"
    : type === "rpe"
    ? "bg-tag-orange-bg text-tag-orange"
    : "bg-tag-violet-bg text-tag-violet";

  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${colorClass}`}>
      {label}: {value}
    </span>
  );
};

const SectionBlock = ({ section }: { section: ProgramSection }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="glass overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div>
          <h3 className="font-bold text-sm">{section.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            <span className="text-xs">{section.duration}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {section.notes && (
            <p className="text-xs text-muted-foreground italic leading-relaxed mb-3 border-l-2 border-accent-foreground/20 pl-3">
              {section.notes}
            </p>
          )}
          <div>
            {section.exercises.map((ex, i) => (
              <ExerciseRow key={i} ex={ex} idx={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProgramView = ({ program }: ProgramViewProps) => {
  const { t } = useTranslation(["program", "session", "common"]);
  const [showProgression, setShowProgression] = useState(false);

  const totalExercises = program.sections.reduce((acc, s) => acc + s.exercises.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="font-bold text-lg leading-tight">{program.title}</h2>
            <p className="text-xs text-muted-foreground">{program.client}</p>
          </div>
          <Badge variant={program.status === "active" ? "default" : "secondary"}>
            {t(`program:status.${program.status}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm text-muted-foreground">{program.objective}</span>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-xs font-semibold">{program.duration}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg">
            <Dumbbell className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-xs font-semibold">{totalExercises} {t("calendar:exercises")}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold">{t("program:blocks", { count: program.sections.length })}</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      {program.sections.map((section, i) => (
        <SectionBlock key={i} section={section} />
      ))}

      {/* Progression */}
      {program.progression.length > 0 && (
        <div className="glass overflow-hidden">
          <button
            onClick={() => setShowProgression(!showProgression)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="font-bold text-sm">{t("session:progression_plan")}</h3>
            </div>
            {showProgression ? <ChevronUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}
          </button>

          {showProgression && (
            <div className="px-4 pb-4 space-y-2">
              {program.progression.map((step, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coach note */}
      <div className="bg-accent border border-accent-foreground/10 rounded-xl p-4 text-center">
        <p className="text-xs text-accent-foreground leading-relaxed">
          💡 <strong>{t("program:coach_note")} :</strong> {program.coachNote || ""}
        </p>
      </div>
    </div>
  );
};

export default ProgramView;
