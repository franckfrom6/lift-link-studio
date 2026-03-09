import { supabase } from "@/integrations/supabase/client";
import { ProgramData } from "@/types/coach";
import { toast } from "sonner";

export interface SaveProgramResult {
  programId: string;
}

export async function saveProgram(
  program: ProgramData,
  coachId: string | null,
  studentId: string
): Promise<SaveProgramResult | null> {
  try {
    // 1. Upsert program
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

    // 2. Get existing week IDs for this program
    const { data: existingWeeks } = await supabase
      .from("program_weeks")
      .select("id")
      .eq("program_id", programId);
    const existingWeekIds = new Set((existingWeeks || []).map((w) => w.id));
    const newWeekIds = new Set(program.weeks.map((w) => w.id));

    // 3. Delete removed weeks (cascade will handle sessions, sections, exercises)
    const weeksToDelete = [...existingWeekIds].filter((id) => !newWeekIds.has(id));
    if (weeksToDelete.length > 0) {
      const { error } = await supabase
        .from("program_weeks")
        .delete()
        .in("id", weeksToDelete);
      if (error) throw error;
    }

    // 4. Upsert weeks and their children
    for (const week of program.weeks) {
      const { data: weekRow, error: weekError } = await supabase
        .from("program_weeks")
        .upsert({
          id: week.id,
          program_id: programId,
          week_number: week.weekNumber,
        })
        .select()
        .single();

      if (weekError) throw weekError;
      const weekId = weekRow.id;

      // Get existing sessions for this week
      const { data: existingSessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("week_id", weekId);
      const existingSessionIds = new Set((existingSessions || []).map((s) => s.id));
      const newSessionIds = new Set(week.sessions.map((s) => s.id));

      // Delete removed sessions
      const sessionsToDelete = [...existingSessionIds].filter((id) => !newSessionIds.has(id));
      if (sessionsToDelete.length > 0) {
        const { error } = await supabase.from("sessions").delete().in("id", sessionsToDelete);
        if (error) throw error;
      }

      // Upsert sessions
      for (const session of week.sessions) {
        const { data: sessionRow, error: sessionError } = await supabase
          .from("sessions")
          .upsert({
            id: session.id,
            week_id: weekId,
            name: session.name,
            day_of_week: session.dayOfWeek,
            notes: session.notes || null,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        const sessionId = sessionRow.id;

        // Get existing sections for this session
        const { data: existingSections } = await supabase
          .from("session_sections")
          .select("id")
          .eq("session_id", sessionId);
        const existingSectionIds = new Set((existingSections || []).map((s) => s.id));
        const newSectionIds = new Set((session.sections || []).map((s) => s.id));

        // Delete removed sections (cascade deletes their exercises)
        const sectionsToDelete = [...existingSectionIds].filter((id) => !newSectionIds.has(id));
        if (sectionsToDelete.length > 0) {
          const { error } = await supabase.from("session_sections").delete().in("id", sectionsToDelete);
          if (error) throw error;
        }

        // Get existing exercises for this session
        const { data: existingExercises } = await supabase
          .from("session_exercises")
          .select("id")
          .eq("session_id", sessionId);
        const existingExerciseIds = new Set((existingExercises || []).map((e) => e.id));

        // Collect all exercise IDs from current state
        const allNewExerciseIds = new Set<string>();
        for (const section of session.sections || []) {
          for (const ex of section.exercises) {
            allNewExerciseIds.add(ex.id);
          }
        }
        for (const ex of session.exercises) {
          allNewExerciseIds.add(ex.id);
        }

        // Delete removed exercises
        const exercisesToDelete = [...existingExerciseIds].filter((id) => !allNewExerciseIds.has(id));
        if (exercisesToDelete.length > 0) {
          const { error } = await supabase.from("session_exercises").delete().in("id", exercisesToDelete);
          if (error) throw error;
        }

        // Upsert sections and their exercises
        for (const section of session.sections || []) {
          const { data: sectionRow, error: sectionError } = await supabase
            .from("session_sections")
            .upsert({
              id: section.id,
              session_id: sessionId,
              name: section.name,
              icon: section.icon || null,
              sort_order: section.sortOrder,
              duration_estimate: section.durationEstimate || null,
              notes: section.notes || null,
            })
            .select()
            .single();

          if (sectionError) throw sectionError;

          for (const ex of section.exercises) {
            const { error: exError } = await supabase
              .from("session_exercises")
              .upsert({
                id: ex.id,
                session_id: sessionId,
                section_id: sectionRow.id,
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
              });

            if (exError) throw exError;
          }
        }

        // Upsert unsectioned exercises
        for (const ex of session.exercises) {
          const { error: exError } = await supabase
            .from("session_exercises")
            .upsert({
              id: ex.id,
              session_id: sessionId,
              section_id: null,
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
            });

          if (exError) throw exError;
        }
      }
    }

    // 5. Save progression if exists
    if (program.progression && program.progression.length > 0) {
      const { error: delProgError } = await supabase.from("program_progression").delete().eq("program_id", programId);
      if (delProgError) throw delProgError;
      for (const phase of program.progression) {
        const { error: insProgError } = await supabase.from("program_progression").insert({
          program_id: programId,
          week_label: phase.weekLabel,
          description: phase.description,
          week_start: phase.weekStart,
          week_end: phase.weekEnd,
          is_deload: phase.isDeload,
          sort_order: phase.order,
        });
        if (insProgError) throw insProgError;
      }
    }

    return { programId };
  } catch (e: any) {
    console.error("saveProgram error:", e);
    toast.error("Erreur lors de la sauvegarde : " + (e.message || "Erreur inconnue"));
    return null;
  }
}
