import { WeekData, SessionData, DAY_NAMES } from "@/types/coach";
import { Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionEditor from "./SessionEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface WeekEditorProps {
  week: WeekData;
  onUpdate: (updated: WeekData) => void;
  onDuplicate: () => void;
}

const WeekEditor = ({ week, onUpdate, onDuplicate }: WeekEditorProps) => {
  const { t } = useTranslation('program');
  const [addDay, setAddDay] = useState<string>("");

  const usedDays = new Set(week.sessions.map((s) => s.dayOfWeek));
  const availableDays = Object.entries(DAY_NAMES).filter(([d]) => !usedDays.has(Number(d)));

  const addSession = (dayOfWeek: number) => {
    const newSession: SessionData = {
      id: crypto.randomUUID(),
      dayOfWeek,
      name: t('session_default_name', { day: t(`common:days.${DAY_NAMES[dayOfWeek]}`) }),
      sections: [],
      exercises: [],
    };
    const updated = [...week.sessions, newSession].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    onUpdate({ ...week, sessions: updated });
  };

  const updateSession = (index: number, updated: SessionData) => {
    const sessions = [...week.sessions];
    sessions[index] = updated;
    onUpdate({ ...week, sessions });
  };

  const removeSession = (index: number) => {
    onUpdate({ ...week, sessions: week.sessions.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg">{t('week_title', { number: week.weekNumber })}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-1" />
            {t('duplicate')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {week.sessions.map((session, i) => (
          <SessionEditor
            key={session.id}
            session={session}
            onUpdate={(u) => updateSession(i, u)}
            onRemove={() => removeSession(i)}
          />
        ))}
      </div>

      {availableDays.length > 0 && (
        <div className="flex gap-2">
          <Select value={addDay} onValueChange={(v) => { setAddDay(v); addSession(Number(v)); setAddDay(""); }}>
            <SelectTrigger className="bg-surface h-9 text-sm">
              <SelectValue placeholder={t('add_session_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {availableDays.map(([d, name]) => (
                <SelectItem key={d} value={d}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default WeekEditor;