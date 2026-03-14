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
      adaptation_logs: {
        Row: {
          adaptations_applied: Json | null
          ai_response: Json
          coach_id: string
          created_at: string
          id: string
          program_id: string
          student_id: string
          week_number: number
        }
        Insert: {
          adaptations_applied?: Json | null
          ai_response: Json
          coach_id: string
          created_at?: string
          id?: string
          program_id: string
          student_id: string
          week_number: number
        }
        Update: {
          adaptations_applied?: Json | null
          ai_response?: Json
          coach_id?: string
          created_at?: string
          id?: string
          program_id?: string
          student_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "adaptation_logs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          context_page: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context_page?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context_page?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_tokens: number | null
          output_tokens: number | null
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string
          date: string
          hips_cm: number | null
          id: string
          notes: string | null
          student_id: string
          thigh_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          date: string
          hips_cm?: number | null
          id?: string
          notes?: string | null
          student_id: string
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          date?: string
          hips_cm?: number | null
          id?: string
          notes?: string | null
          student_id?: string
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      coach_contact_requests: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          student_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          student_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      coach_invite_tokens: {
        Row: {
          coach_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          token: string
          uses_count: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          token: string
          uses_count?: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          token?: string
          uses_count?: number
        }
        Relationships: []
      }
      coach_notifications: {
        Row: {
          coach_id: string
          id: string
          message: string
          sent_at: string | null
          student_id: string
        }
        Insert: {
          coach_id: string
          id?: string
          message: string
          sent_at?: string | null
          student_id: string
        }
        Update: {
          coach_id?: string
          id?: string
          message?: string
          sent_at?: string | null
          student_id?: string
        }
        Relationships: []
      }
      coach_nutrition_recommendations: {
        Row: {
          category: string
          coach_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          priority: number
          student_id: string | null
          title: string
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          coach_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          student_id?: string | null
          title: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          student_id?: string | null
          title?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coach_profiles_public: {
        Row: {
          avg_rating: number | null
          bio_en: string | null
          bio_fr: string | null
          client_count: number
          coach_id: string
          created_at: string
          id: string
          is_accepting_clients: boolean
          is_featured: boolean
          location_area: string | null
          location_city: string | null
          price_range: string | null
          specialties: string[] | null
          training_locations: string[] | null
        }
        Insert: {
          avg_rating?: number | null
          bio_en?: string | null
          bio_fr?: string | null
          client_count?: number
          coach_id: string
          created_at?: string
          id?: string
          is_accepting_clients?: boolean
          is_featured?: boolean
          location_area?: string | null
          location_city?: string | null
          price_range?: string | null
          specialties?: string[] | null
          training_locations?: string[] | null
        }
        Update: {
          avg_rating?: number | null
          bio_en?: string | null
          bio_fr?: string | null
          client_count?: number
          coach_id?: string
          created_at?: string
          id?: string
          is_accepting_clients?: boolean
          is_featured?: boolean
          location_area?: string | null
          location_city?: string | null
          price_range?: string | null
          specialties?: string[] | null
          training_locations?: string[] | null
        }
        Relationships: []
      }
      coach_recommendations: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          match_reasons: string[] | null
          match_score: number
          status: string
          student_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          match_score?: number
          status?: string
          student_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          match_score?: number
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      coach_recovery_recommendations: {
        Row: {
          category: string
          coach_id: string
          content: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          priority: number
          student_id: string | null
          title: string
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string
          coach_id: string
          content: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          priority?: number
          student_id?: string | null
          title: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          coach_id?: string
          content?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          priority?: number
          student_id?: string | null
          title?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
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
          duration_seconds: number | null
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
          duration_seconds?: number | null
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
          duration_seconds?: number | null
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
      daily_nutrition_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          coach_comment: string | null
          created_at: string
          date: string
          description: string
          fat_g: number | null
          id: string
          meal_type: string
          notes: string | null
          photo_url: string | null
          protein_g: number | null
          student_id: string
          water_goal_ml: number | null
          water_ml: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          coach_comment?: string | null
          created_at?: string
          date: string
          description?: string
          fat_g?: number | null
          id?: string
          meal_type: string
          notes?: string | null
          photo_url?: string | null
          protein_g?: number | null
          student_id: string
          water_goal_ml?: number | null
          water_ml?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          coach_comment?: string | null
          created_at?: string
          date?: string
          description?: string
          fat_g?: number | null
          id?: string
          meal_type?: string
          notes?: string | null
          photo_url?: string | null
          protein_g?: number | null
          student_id?: string
          water_goal_ml?: number | null
          water_ml?: number | null
        }
        Relationships: []
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
          name_en: string | null
          public_cible: string | null
          secondary_muscle: string | null
          tracking_type: string | null
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
          name_en?: string | null
          public_cible?: string | null
          secondary_muscle?: string | null
          tracking_type?: string | null
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
          name_en?: string | null
          public_cible?: string | null
          secondary_muscle?: string | null
          tracking_type?: string | null
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
      feature_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          feature_key: string
          id: string
          is_enabled: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          feature_key: string
          id?: string
          is_enabled?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          feature_key?: string
          id?: string
          is_enabled?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kb_articles: {
        Row: {
          category: string
          content_en: string
          content_fr: string
          created_at: string
          id: string
          is_published: boolean
          role_target: string
          slug: string
          sort_order: number
          tags: string[] | null
          title_en: string
          title_fr: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category: string
          content_en: string
          content_fr: string
          created_at?: string
          id?: string
          is_published?: boolean
          role_target?: string
          slug: string
          sort_order?: number
          tags?: string[] | null
          title_en: string
          title_fr: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category?: string
          content_en?: string
          content_fr?: string
          created_at?: string
          id?: string
          is_published?: boolean
          role_target?: string
          slug?: string
          sort_order?: number
          tags?: string[] | null
          title_en?: string
          title_fr?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      nutrition_profiles: {
        Row: {
          activity_multiplier: number | null
          age: number | null
          allergies: string[] | null
          bmr: number | null
          calorie_target: number | null
          carbs_g: number | null
          dietary_restrictions: string[] | null
          fat_g: number | null
          height_cm: number | null
          id: string
          objective: string | null
          protein_g: number | null
          sex: string | null
          student_id: string
          tdee: number | null
          updated_at: string
          updated_by: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_multiplier?: number | null
          age?: number | null
          allergies?: string[] | null
          bmr?: number | null
          calorie_target?: number | null
          carbs_g?: number | null
          dietary_restrictions?: string[] | null
          fat_g?: number | null
          height_cm?: number | null
          id?: string
          objective?: string | null
          protein_g?: number | null
          sex?: string | null
          student_id: string
          tdee?: number | null
          updated_at?: string
          updated_by?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_multiplier?: number | null
          age?: number | null
          allergies?: string[] | null
          bmr?: number | null
          calorie_target?: number | null
          carbs_g?: number | null
          dietary_restrictions?: string[] | null
          fat_g?: number | null
          height_cm?: number | null
          id?: string
          objective?: string | null
          protein_g?: number | null
          sex?: string | null
          student_id?: string
          tdee?: number | null
          updated_at?: string
          updated_by?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          coach_id: string
          created_at: string
          email: string
          id: string
          status: string
          student_name: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          email: string
          id?: string
          status?: string
          student_name?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          email?: string
          id?: string
          status?: string
          student_name?: string | null
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          feature_key: string
          id: string
          is_enabled: boolean
          limit_type: string | null
          limit_value: number | null
          plan_id: string
        }
        Insert: {
          feature_key: string
          id?: string
          is_enabled?: boolean
          limit_type?: string | null
          limit_value?: number | null
          plan_id: string
        }
        Update: {
          feature_key?: string
          id?: string
          is_enabled?: boolean
          limit_type?: string | null
          limit_value?: number | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description_en: string
          description_fr: string
          display_name_en: string
          display_name_fr: string
          id: string
          is_active: boolean
          name: string
          price_monthly: number | null
          price_yearly: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_en?: string
          description_fr?: string
          display_name_en: string
          display_name_fr: string
          id?: string
          is_active?: boolean
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_en?: string
          description_fr?: string
          display_name_en?: string
          display_name_fr?: string
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          display_mode: string | null
          full_name: string
          goal: string | null
          height: number | null
          id: string
          is_admin: boolean
          level: string | null
          notif_coach_messages: boolean | null
          notif_session_reminder: boolean | null
          notif_session_reminder_time: string | null
          notif_streak_motivation: boolean | null
          notif_water_end_time: string | null
          notif_water_interval_hours: number | null
          notif_water_reminder: boolean | null
          notif_water_start_time: string | null
          onboarding_completed: boolean
          onboarding_steps: Json | null
          push_subscription: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          specialty: string | null
          unit_preference: string | null
          updated_at: string
          user_id: string
          water_goal_ml: number | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_mode?: string | null
          full_name: string
          goal?: string | null
          height?: number | null
          id?: string
          is_admin?: boolean
          level?: string | null
          notif_coach_messages?: boolean | null
          notif_session_reminder?: boolean | null
          notif_session_reminder_time?: string | null
          notif_streak_motivation?: boolean | null
          notif_water_end_time?: string | null
          notif_water_interval_hours?: number | null
          notif_water_reminder?: boolean | null
          notif_water_start_time?: string | null
          onboarding_completed?: boolean
          onboarding_steps?: Json | null
          push_subscription?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          specialty?: string | null
          unit_preference?: string | null
          updated_at?: string
          user_id: string
          water_goal_ml?: number | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_mode?: string | null
          full_name?: string
          goal?: string | null
          height?: number | null
          id?: string
          is_admin?: boolean
          level?: string | null
          notif_coach_messages?: boolean | null
          notif_session_reminder?: boolean | null
          notif_session_reminder_time?: string | null
          notif_streak_motivation?: boolean | null
          notif_water_end_time?: string | null
          notif_water_interval_hours?: number | null
          notif_water_reminder?: boolean | null
          notif_water_start_time?: string | null
          onboarding_completed?: boolean
          onboarding_steps?: Json | null
          push_subscription?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          specialty?: string | null
          unit_preference?: string | null
          updated_at?: string
          user_id?: string
          water_goal_ml?: number | null
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
          coach_id: string | null
          created_at: string
          id: string
          is_ai_generated: boolean | null
          name: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          name: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          name?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          category: string
          created_at: string
          date: string
          id: string
          notes: string | null
          photo_url: string
          student_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          photo_url: string
          student_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          photo_url?: string
          student_id?: string
        }
        Relationships: []
      }
      recommendation_templates: {
        Row: {
          category: string
          content_en: string
          content_fr: string
          duration_minutes: number | null
          id: string
          sort_order: number
          title_en: string
          title_fr: string
          trigger_config: Json | null
          trigger_type: string | null
          type: string
        }
        Insert: {
          category: string
          content_en: string
          content_fr: string
          duration_minutes?: number | null
          id?: string
          sort_order?: number
          title_en: string
          title_fr: string
          trigger_config?: Json | null
          trigger_type?: string | null
          type: string
        }
        Update: {
          category?: string
          content_en?: string
          content_fr?: string
          duration_minutes?: number | null
          id?: string
          sort_order?: number
          title_en?: string
          title_fr?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          type?: string
        }
        Relationships: []
      }
      recovery_recommendations: {
        Row: {
          activity_type: string | null
          content_en: string
          content_fr: string
          id: string
          muscle_groups: string[] | null
          priority: number
          recommendation_type: string
          title_en: string
          title_fr: string
          trigger_type: string
        }
        Insert: {
          activity_type?: string | null
          content_en: string
          content_fr: string
          id?: string
          muscle_groups?: string[] | null
          priority?: number
          recommendation_type: string
          title_en: string
          title_fr: string
          trigger_type: string
        }
        Update: {
          activity_type?: string | null
          content_en?: string
          content_fr?: string
          id?: string
          muscle_groups?: string[] | null
          priority?: number
          recommendation_type?: string
          title_en?: string
          title_fr?: string
          trigger_type?: string
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
      session_feedback: {
        Row: {
          completed_session_id: string
          created_at: string
          energy_post: number | null
          exercises_pain: string[] | null
          exercises_too_easy: string[] | null
          exercises_too_hard: string[] | null
          free_comment: string | null
          id: string
          joint_discomfort: boolean
          joint_discomfort_details: string | null
          joint_discomfort_location: string[] | null
          mood_after: string | null
          muscle_pump: number | null
          overall_rating: number
          user_id: string
          would_repeat: boolean | null
        }
        Insert: {
          completed_session_id: string
          created_at?: string
          energy_post?: number | null
          exercises_pain?: string[] | null
          exercises_too_easy?: string[] | null
          exercises_too_hard?: string[] | null
          free_comment?: string | null
          id?: string
          joint_discomfort?: boolean
          joint_discomfort_details?: string | null
          joint_discomfort_location?: string[] | null
          mood_after?: string | null
          muscle_pump?: number | null
          overall_rating: number
          user_id: string
          would_repeat?: boolean | null
        }
        Update: {
          completed_session_id?: string
          created_at?: string
          energy_post?: number | null
          exercises_pain?: string[] | null
          exercises_too_easy?: string[] | null
          exercises_too_hard?: string[] | null
          free_comment?: string | null
          id?: string
          joint_discomfort?: boolean
          joint_discomfort_details?: string | null
          joint_discomfort_location?: string[] | null
          mood_after?: string | null
          muscle_pump?: number | null
          overall_rating?: number
          user_id?: string
          would_repeat?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: true
            referencedRelation: "completed_sessions"
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
          created_by: string | null
          day_of_week: number
          free_session_date: string | null
          id: string
          is_free_session: boolean
          name: string
          notes: string | null
          week_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week: number
          free_session_date?: string | null
          id?: string
          is_free_session?: boolean
          name: string
          notes?: string | null
          week_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          free_session_date?: string | null
          id?: string
          is_free_session?: boolean
          name?: string
          notes?: string | null
          week_id?: string | null
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
      shared_sessions: {
        Row: {
          completed_session_id: string
          created_at: string
          id: string
          shared_completed_session_id: string | null
          shared_with_user_id: string
          status: string
        }
        Insert: {
          completed_session_id: string
          created_at?: string
          id?: string
          shared_completed_session_id?: string | null
          shared_with_user_id: string
          status?: string
        }
        Update: {
          completed_session_id?: string
          created_at?: string
          id?: string
          shared_completed_session_id?: string | null
          shared_with_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_sessions_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "completed_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_sessions_shared_completed_session_id_fkey"
            columns: ["shared_completed_session_id"]
            isOneToOne: false
            referencedRelation: "completed_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skipped_exercises: {
        Row: {
          completed_session_id: string
          created_at: string
          id: string
          reason: string | null
          reason_detail: string | null
          session_exercise_id: string
        }
        Insert: {
          completed_session_id: string
          created_at?: string
          id?: string
          reason?: string | null
          reason_detail?: string | null
          session_exercise_id: string
        }
        Update: {
          completed_session_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          reason_detail?: string | null
          session_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skipped_exercises_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "completed_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skipped_exercises_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          app_page: string | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          device_info: string | null
          id: string
          priority: string
          resolved_at: string | null
          screenshot_urls: string[] | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_page?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          device_info?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          screenshot_urls?: string[] | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_page?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          device_info?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          screenshot_urls?: string[] | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachment_urls: string[] | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
