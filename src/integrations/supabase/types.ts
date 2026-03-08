export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coach_students: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      completed_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration: number | null
          id: string
          session_id: string
          started_at: string
          student_id: string
          student_notes: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          session_id: string
          started_at?: string
          student_id: string
          student_notes?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          session_id?: string
          started_at?: string
          student_id?: string
          student_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_sets: {
        Row: {
          completed_session_id: string
          created_at: string
          id: string
          is_failure: boolean
          reps: number
          rpe_actual: number | null
          session_exercise_id: string
          set_number: number
          weight: number | null
        }
        Insert: {
          completed_session_id: string
          created_at?: string
          id?: string
          is_failure?: boolean
          reps: number
          rpe_actual?: number | null
          session_exercise_id: string
          set_number: number
          weight?: number | null
        }
        Update: {
          completed_session_id?: string
          created_at?: string
          id?: string
          is_failure?: boolean
          reps?: number
          rpe_actual?: number | null
          session_exercise_id?: string
          set_number?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_sets_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "completed_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          equipment: string
          id: string
          image_url: string | null
          is_default: boolean
          muscle_group: string
          name: string
          secondary_muscle: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment: string
          id?: string
          image_url?: string | null
          is_default?: boolean
          muscle_group: string
          name: string
          secondary_muscle?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string
          id?: string
          image_url?: string | null
          is_default?: boolean
          muscle_group?: string
          name?: string
          secondary_muscle?: string | null
          type?: string
        }
        Relationships: []
      }
      external_sessions: {
        Row: {
          activity_label: string | null
          activity_type: string
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          intensity_perceived: number | null
          location: string | null
          muscle_groups_involved: string[] | null
          notes: string | null
          provider: string | null
          student_id: string
          time_end: string | null
          time_start: string | null
        }
        Insert: {
          activity_label?: string | null
          activity_type?: string
          created_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          intensity_perceived?: number | null
          location?: string | null
          muscle_groups_involved?: string[] | null
          notes?: string | null
          provider?: string | null
          student_id: string
          time_end?: string | null
          time_start?: string | null
        }
        Update: {
          activity_label?: string | null
          activity_type?: string
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          intensity_perceived?: number | null
          location?: string | null
          muscle_groups_involved?: string[] | null
          notes?: string | null
          provider?: string | null
          student_id?: string
          time_end?: string | null
          time_start?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          full_name: string
          goal: string | null
          height: number | null
          id: string
          level: string | null
          role: Database["public"]["Enums"]["app_role"]
          specialty: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          goal?: string | null
          height?: number | null
          id?: string
          level?: string | null
          role: Database["public"]["Enums"]["app_role"]
          specialty?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          goal?: string | null
          height?: number | null
          id?: string
          level?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          specialty?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      program_progression: {
        Row: {
          created_at: string
          description: string
          id: string
          is_deload: boolean
          program_id: string
          sort_order: number
          week_end: number
          week_label: string
          week_start: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_deload?: boolean
          program_id: string
          sort_order?: number
          week_end: number
          week_label: string
          week_start: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_deload?: boolean
          program_id?: string
          sort_order?: number
          week_end?: number
          week_label?: string
          week_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_progression_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string
          id: string
          program_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          name: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          name: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          coach_notes: string | null
          created_at: string
          exercise_id: string
          id: string
          reps_max: number
          reps_min: number
          rest_seconds: number
          rpe_target: string | null
          section_id: string | null
          session_id: string
          sets: number
          sort_order: number
          suggested_weight: number | null
          tempo: string | null
          video_search_query: string | null
          video_url: string | null
        }
        Insert: {
          coach_notes?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          rpe_target?: string | null
          section_id?: string | null
          session_id: string
          sets?: number
          sort_order: number
          suggested_weight?: number | null
          tempo?: string | null
          video_search_query?: string | null
          video_url?: string | null
        }
        Update: {
          coach_notes?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          rpe_target?: string | null
          section_id?: string | null
          session_id?: string
          sets?: number
          sort_order?: number
          suggested_weight?: number | null
          tempo?: string | null
          video_search_query?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "session_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_sections: {
        Row: {
          created_at: string
          duration_estimate: string | null
          icon: string | null
          id: string
          name: string
          notes: string | null
          session_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          duration_estimate?: string | null
          icon?: string | null
          id?: string
          name: string
          notes?: string | null
          session_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          duration_estimate?: string | null
          icon?: string | null
          id?: string
          name?: string
          notes?: string | null
          session_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_sections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_swaps: {
        Row: {
          created_at: string
          id: string
          new_date: string
          new_day: number
          original_date: string
          original_day: number
          reason: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_date: string
          new_day: number
          original_date: string
          original_day: number
          reason?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_date?: string
          new_day?: number
          original_date?: string
          original_day?: number
          reason?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_swaps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          name: string
          notes: string | null
          week_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          name: string
          notes?: string | null
          week_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          name?: string
          notes?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          availability_notes: string | null
          created_at: string
          energy_level: number
          general_notes: string | null
          id: string
          muscle_soreness: number
          sleep_quality: number
          soreness_location: string[] | null
          stress_level: number
          student_id: string
          week_start: string
        }
        Insert: {
          availability_notes?: string | null
          created_at?: string
          energy_level: number
          general_notes?: string | null
          id?: string
          muscle_soreness: number
          sleep_quality: number
          soreness_location?: string[] | null
          stress_level: number
          student_id: string
          week_start: string
        }
        Update: {
          availability_notes?: string | null
          created_at?: string
          energy_level?: number
          general_notes?: string | null
          id?: string
          muscle_soreness?: number
          sleep_quality?: number
          soreness_location?: string[] | null
          stress_level?: number
          student_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "coach" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coach", "student"],
    },
  },
} as const
