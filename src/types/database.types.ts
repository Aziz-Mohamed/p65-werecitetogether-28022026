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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cohorts: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          max_students: number
          meeting_link: string | null
          name: string
          program_id: string
          schedule: Json | null
          start_date: string | null
          status: string
          supervisor_id: string | null
          teacher_id: string | null
          track_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          max_students?: number
          meeting_link?: string | null
          name: string
          program_id: string
          schedule?: Json | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          teacher_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          max_students?: number
          meeting_link?: string | null
          name?: string
          program_id?: string
          schedule?: Json | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          teacher_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "program_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_session_count: {
        Row: {
          date: string
          id: string
          program_id: string
          session_count: number
          student_id: string
        }
        Insert: {
          date?: string
          id?: string
          program_id: string
          session_count?: number
          student_id: string
        }
        Update: {
          date?: string
          id?: string
          program_id?: string
          session_count?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_session_count_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_session_count_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          cohort_id: string | null
          completed_at: string | null
          created_at: string
          enrolled_at: string
          id: string
          program_id: string
          status: string
          student_id: string
          teacher_id: string | null
          track_id: string | null
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          program_id: string
          status?: string
          student_id: string
          teacher_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          program_id?: string
          status?: string
          student_id?: string
          teacher_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "program_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      free_program_queue: {
        Row: {
          expires_at: string
          id: string
          joined_at: string
          notified_at: string | null
          position: number
          program_id: string
          status: string
          student_id: string
        }
        Insert: {
          expires_at?: string
          id?: string
          joined_at?: string
          notified_at?: string | null
          position: number
          program_id: string
          status?: string
          student_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          joined_at?: string
          notified_at?: string | null
          position?: number
          program_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_program_queue_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_program_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          created_at: string
          enabled: boolean
          id: string
          profile_id: string
        }
        Insert: {
          category: string
          created_at?: string
          enabled?: boolean
          id?: string
          profile_id: string
        }
        Update: {
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          description: string | null
          id: string
          logo_url: string | null
          name: string
          name_ar: string
          settings: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          country: string
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          languages: string[] | null
          meeting_link: string | null
          meeting_platform: string | null
          onboarding_completed: boolean
          phone: string | null
          region: string | null
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id: string
          is_active?: boolean
          languages?: string[] | null
          meeting_link?: string | null
          meeting_platform?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          region?: string | null
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          languages?: string[] | null
          meeting_link?: string | null
          meeting_platform?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          region?: string | null
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      program_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          profile_id: string
          program_id: string
          role: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          profile_id: string
          program_id: string
          role: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          program_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_roles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_tracks: {
        Row: {
          created_at: string
          curriculum: Json | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          program_id: string
          sort_order: number
          track_type: string | null
        }
        Insert: {
          created_at?: string
          curriculum?: Json | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          program_id: string
          sort_order?: number
          track_type?: string | null
        }
        Update: {
          created_at?: string
          curriculum?: Json | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          program_id?: string
          sort_order?: number
          track_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_tracks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_waitlist: {
        Row: {
          cohort_id: string | null
          created_at: string
          id: string
          joined_at: string
          notes: string | null
          notified_at: string | null
          offer_expires_at: string | null
          position: number
          program_id: string
          status: string
          student_id: string
          teacher_id: string | null
          track_id: string | null
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          notes?: string | null
          notified_at?: string | null
          offer_expires_at?: string | null
          position: number
          program_id: string
          status?: string
          student_id: string
          teacher_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          notes?: string | null
          notified_at?: string | null
          offer_expires_at?: string | null
          position?: number
          program_id?: string
          status?: string
          student_id?: string
          teacher_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_waitlist_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_waitlist_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_waitlist_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_waitlist_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_waitlist_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "program_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          settings: Json
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          profile_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          score: number | null
          session_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          score?: number | null
          session_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          score?: number | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_schedules: {
        Row: {
          cohort_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          meeting_link: string | null
          program_id: string
          start_time: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          meeting_link?: string | null
          program_id: string
          start_time: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          meeting_link?: string | null
          program_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_schedules_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      session_voice_memos: {
        Row: {
          created_at: string
          duration_seconds: number
          expires_at: string
          file_size_bytes: number
          id: string
          program_id: string
          session_id: string
          storage_path: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          expires_at?: string
          file_size_bytes: number
          id?: string
          program_id: string
          session_id: string
          storage_path: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          file_size_bytes?: number
          id?: string
          program_id?: string
          session_id?: string
          storage_path?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_voice_memos_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_voice_memos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_voice_memos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_voice_memos_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          cohort_id: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_link_used: string | null
          notes: string | null
          program_id: string
          started_at: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_link_used?: string | null
          notes?: string | null
          program_id: string
          started_at?: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_link_used?: string | null
          notes?: string | null
          program_id?: string
          started_at?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability: {
        Row: {
          available_since: string | null
          current_session_count: number
          id: string
          is_available: boolean
          max_concurrent_students: number
          program_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          available_since?: string | null
          current_session_count?: number
          id?: string
          is_available?: boolean
          max_concurrent_students?: number
          program_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          available_since?: string | null
          current_session_count?: number
          id?: string
          is_available?: boolean
          max_concurrent_students?: number
          program_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_rating_stats: {
        Row: {
          average_rating: number
          common_constructive_tags: string[] | null
          common_positive_tags: string[] | null
          last_updated: string
          program_id: string
          rating_1_count: number
          rating_2_count: number
          rating_3_count: number
          rating_4_count: number
          rating_5_count: number
          teacher_id: string
          total_reviews: number
        }
        Insert: {
          average_rating?: number
          common_constructive_tags?: string[] | null
          common_positive_tags?: string[] | null
          last_updated?: string
          program_id: string
          rating_1_count?: number
          rating_2_count?: number
          rating_3_count?: number
          rating_4_count?: number
          rating_5_count?: number
          teacher_id: string
          total_reviews?: number
        }
        Update: {
          average_rating?: number
          common_constructive_tags?: string[] | null
          common_positive_tags?: string[] | null
          last_updated?: string
          program_id?: string
          rating_1_count?: number
          rating_2_count?: number
          rating_3_count?: number
          rating_4_count?: number
          rating_5_count?: number
          teacher_id?: string
          total_reviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_rating_stats_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_rating_stats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_reviews: {
        Row: {
          comment: string | null
          created_at: string
          excluded_by: string | null
          exclusion_reason: string | null
          id: string
          is_excluded: boolean
          is_flagged: boolean
          program_id: string
          rating: number
          session_id: string
          student_id: string
          tags: string[] | null
          teacher_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          excluded_by?: string | null
          exclusion_reason?: string | null
          id?: string
          is_excluded?: boolean
          is_flagged?: boolean
          program_id: string
          rating: number
          session_id: string
          student_id: string
          tags?: string[] | null
          teacher_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          excluded_by?: string | null
          exclusion_reason?: string | null
          id?: string
          is_excluded?: boolean
          is_flagged?: boolean
          program_id?: string
          rating?: number
          session_id?: string
          student_id?: string
          tags?: string[] | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_reviews_excluded_by_fkey"
            columns: ["excluded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_programs: { Args: never; Returns: string[] }
      get_user_role: { Args: never; Returns: string }
      is_master_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
