import { supabase } from "@/integrations/supabase/client";
import { ProgramData, SessionExerciseData } from "@/types/coach";
import { toast } from "sonner";
import i18next from "i18next";

export interface SaveProgramResult {
  programId: string;
}

function buildExerciseRow(
  ex: SessionExerciseData,
  sessionId: string,
  sectionId: string | null
) {
  return {
    id: ex.id,
    session_id: sessionId,
    section_id: sectionId,
    exercise_id: ex.exercise.id,
    sort_order: ex.sortOrder,
    sets: ex.sets,
    reps_min: ex.repsMin,
    reps_max: ex.repsMax,
    rest_seconds: ex.restSeconds,
    suggested_weight: ex.suggestedWeight || null,
    coach_notes: ex.coachNotes || null,
    tempo: ex.tempo || null,
    rpe_target: ex.rpeTarget || null,
    video_url: ex.videoUrl || null,
    video_search_query: ex.videoSearchQuery || null,
  };
}

export async function saveProgram(
  program: ProgramData,
  coachId: string | null,
  studentId: string,
  onProgress?: (step: number, total: number) => void
): Promise<SaveProgramResult | null> {
  const t = i18next.t.bind(i18next);
  const totalSteps = 6;
  const report = (step: number) => onProgress?.(step, totalSteps);

  try {
    // Step 1: Upsert program
    report(1);
    const { data: programRow, error: programError } = await supabase
      .from("programs")
      .upsert({
        id: program.id,
        name: program.name,
        coach_id: coachId,
        student_id: studentId,
        status: program.status,
      })
      .select()
      .single();

    if (programError) throw programError;
    const programId = programRow.id;

    // Step 2: Handle weeks (batch)
    report(2);
    const { data: existingWeeks } = await supabase
      .from("program_weeks")
      .select("id")
      .eq("program_id", programId);
    const existingWeekIds = new Set((existingWeeks || []).map((w) => w.id));
    const newWeekIds = new Set(program.weeks.map((w) => w.id));

    const weeksToDelete = [...existingWeekIds].filter((id) => !newWeekIds.has(id));
    if (weeksToDelete.length > 0) {
      const { error } = await supabase
        .from("program_weeks")
        .delete()
        .in("id", weeksToDelete);
      if (error) throw error;
    }

    // Batch upsert all weeks
    const allWeekRows = program.weeks.map((w) => ({
      id: w.id,
      program_id: programId,
      week_number: w.weekNumber,
    }));
    if (allWeekRows.length > 0) {
      const { error: weekError } = await supabase
        .from("program_weeks")
        .upsert(allWeekRows);
      if (weekError) throw weekError;
    }

    // Step 3: Handle sessions (batch)
    report(3);
    const weekIds = program.weeks.map((w) => w.id);
    const { data: existingSessions } = await supabase
      .from("sessions")
      .select("id")
      .in("week_id", weekIds.length > 0 ? weekIds : ["__none__"]);
    const existingSessionIds = new Set((existingSessions || []).map((s) => s.id));

    const allNewSessionIds = new Set<string>();
    const allSessionRows: any[] = [];
    for (const week of program.weeks) {
      for (const session of week.sessions) {
        allNewSessionIds.add(session.id);
        allSessionRows.push({
          id: session.id,
          week_id: week.id,
          name: session.name,
          day_of_week: session.dayOfWeek,
          notes: session.notes || null,
        });
      }
    }

    const sessionsToDelete = [...existingSessionIds].filter((id) => !allNewSessionIds.has(id));
    if (sessionsToDelete.length > 0) {
      const { error } = await supabase.from("sessions").delete().in("id", sessionsToDelete);
      if (error) throw error;
    }

    if (allSessionRows.length > 0) {
      const { error: sessionError } = await supabase
        .from("sessions")
        .upsert(allSessionRows);
      if (sessionError) throw sessionError;
    }

    // Step 4: Handle sections (batch)
    report(4);
    const sessionIds = [...allNewSessionIds];
    const { data: existingSections } = await supabase
      .from("session_sections")
      .select("id")
      .in("session_id", sessionIds.length > 0 ? sessionIds : ["__none__"]);
    const existingSectionIds = new Set((existingSections || []).map((s) => s.id));

    const allNewSectionIds = new Set<string>();
    const allSectionRows: any[] = [];
    for (const week of program.weeks) {
      for (const session of week.sessions) {
        for (const section of session.sections || []) {
          allNewSectionIds.add(section.id);
          allSectionRows.push({
            id: section.id,
            session_id: session.id,
            name: section.name,
            icon: section.icon || null,
            sort_order: section.sortOrder,
            duration_estimate: section.durationEstimate || null,
            notes: section.notes || null,
          });
        }
      }
    }

    const sectionsToDelete = [...existingSectionIds].filter((id) => !allNewSectionIds.has(id));
    if (sectionsToDelete.length > 0) {
      const { error } = await supabase.from("session_sections").delete().in("id", sectionsToDelete);
      if (error) throw error;
    }

    if (allSectionRows.length > 0) {
      const { error: sectionError } = await supabase
        .from("session_sections")
        .upsert(allSectionRows);
      if (sectionError) throw sectionError;
    }

    // Step 5: Handle exercises (batch)
    report(5);
    const { data: existingExercises } = await supabase
      .from("session_exercises")
      .select("id")
      .in("session_id", sessionIds.length > 0 ? sessionIds : ["__none__"]);
    const existingExerciseIds = new Set((existingExercises || []).map((e) => e.id));

    const allExerciseRows: any[] = [];
    const allNewExerciseIds = new Set<string>();

    for (const week of program.weeks) {
      for (const session of week.sessions) {
        // Sectioned exercises
        for (const section of session.sections || []) {
          for (const ex of section.exercises) {
            allNewExerciseIds.add(ex.id);
            allExerciseRows.push(buildExerciseRow(ex, session.id, section.id));
          }
        }
        // Unsectioned exercises
        for (const ex of session.exercises) {
          allNewExerciseIds.add(ex.id);
          allExerciseRows.push(buildExerciseRow(ex, session.id, null));
        }
      }
    }

    const exercisesToDelete = [...existingExerciseIds].filter((id) => !allNewExerciseIds.has(id));
    if (exercisesToDelete.length > 0) {
      const { error } = await supabase.from("session_exercises").delete().in("id", exercisesToDelete);
      if (error) throw error;
    }

    if (allExerciseRows.length > 0) {
      // Batch in chunks of 500 to avoid payload limits
      for (let i = 0; i < allExerciseRows.length; i += 500) {
        const chunk = allExerciseRows.slice(i, i + 500);
        const { error: exError } = await supabase
          .from("session_exercises")
          .upsert(chunk);
        if (exError) throw exError;
      }
    }

    // Step 6: Save progression
    report(6);
    if (program.progression && program.progression.length > 0) {
      const { error: delProgError } = await supabase
        .from("program_progression")
        .delete()
        .eq("program_id", programId);
      if (delProgError) throw delProgError;

      const progressionRows = program.progression.map((phase) => ({
        program_id: programId,
        week_label: phase.weekLabel,
        description: phase.description,
        week_start: phase.weekStart,
        week_end: phase.weekEnd,
        is_deload: phase.isDeload,
        sort_order: phase.order,
      }));

      const { error: insProgError } = await supabase
        .from("program_progression")
        .insert(progressionRows);
      if (insProgError) throw insProgError;
    }

    return { programId };
  } catch (e: any) {
    console.error("saveProgram error:", e);
    toast.error(t("common:save_error") + ": " + (e.message || t("common:error")));
    return null;
  }
}
