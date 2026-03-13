import { Exercise } from "./exercise";

export interface ProgressionPhaseData {
  weekLabel: string;
  description: string;
  weekStart: number;
  weekEnd: number;
  isDeload: boolean;
  order: number;
}

export interface ProgramData {
  id: string;
  name: string;
  studentId: string;
  status: "draft" | "active" | "completed";
  weeks: WeekData[];
  progression?: ProgressionPhaseData[];
}

export interface WeekData {
  id: string;
  weekNumber: number;
  sessions: SessionData[];
}

export interface SessionSectionData {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
  durationEstimate?: string;
  notes?: string;
  exercises: SessionExerciseData[];
}

export interface SessionData {
  id: string;
  dayOfWeek: number;
  name: string;
  notes?: string;
  sections: SessionSectionData[];
  exercises: SessionExerciseData[]; // exercises without a section (backwards compat)
}

export interface SessionExerciseData {
  id: string;
  exercise: Exercise;
  sortOrder: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  suggestedWeight?: number;
  coachNotes?: string;
  tempo?: string;
  rpeTarget?: string;
  videoUrl?: string;
  videoSearchQuery?: string;
  sectionId?: string;
}
