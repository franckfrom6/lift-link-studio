import { supabase } from "@/integrations/supabase/client";
import { ProgramData, WeekData, SessionData, SessionExerciseData, SessionSectionData } from "@/types/coach";
import { toast } from "sonner";

export interface SaveProgramResult {
  programId: string;
}

export async function saveProgram(
  program: ProgramData,
  coachId: string,
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

    // 2. Delete existing weeks (cascade deletes sessions, exercises, sections)
    await supabase.from("program_weeks").delete().eq("program_id", programId);

    // 3. Insert weeks
    for (const week of program.weeks) {
      const { data: weekRow, error: weekError } = await supabase
        .from("program_weeks")
        .insert({ program_id: programId, week_number: week.weekNumber })
        .select()
        .single();

      if (weekError) throw weekError;

      // 4. Insert sessions
      for (const session of week.sessions) {
        const { data: sessionRow, error: sessionError } = await supabase
          .from("sessions")
          .insert({
            week_id: weekRow.id,
            name: session.name,
            day_of_week: session.dayOfWeek,
            notes: session.notes || null,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // 5. Insert sections
        const sectionIdMap: Record<string, string> = {};
        for (const section of session.sections || []) {
          const { data: sectionRow, error: sectionError } = await supabase
            .from("session_sections")
            .insert({
              session_id: sessionRow.id,
              name: section.name,
              icon: section.icon || null,
              sort_order: section.sortOrder,
              duration_estimate: section.durationEstimate || null,
              notes: section.notes || null,
            })
            .select()
            .single();

          if (sectionError) throw sectionError;
          sectionIdMap[section.id] = sectionRow.id;

          // 6. Insert section exercises
          for (const ex of section.exercises) {
            const { error: exError } = await supabase
              .from("session_exercises")
              .insert({
                session_id: sessionRow.id,
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

        // 7. Insert unsectioned exercises
        for (const ex of session.exercises) {
          const { error: exError } = await supabase
            .from("session_exercises")
            .insert({
              session_id: sessionRow.id,
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

    // 8. Save progression if exists
    if (program.progression && program.progression.length > 0) {
      await supabase.from("program_progression").delete().eq("program_id", programId);
      for (const phase of program.progression) {
        await supabase.from("program_progression").insert({
          program_id: programId,
          week_label: phase.weekLabel,
          description: phase.description,
          week_start: phase.weekStart,
          week_end: phase.weekEnd,
          is_deload: phase.isDeload,
          sort_order: phase.order,
        });
      }
    }

    return { programId };
  } catch (e: any) {
    console.error("saveProgram error:", e);
    toast.error("Erreur lors de la sauvegarde : " + (e.message || "Erreur inconnue"));
    return null;
  }
}
