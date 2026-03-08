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
      attendance: {
        Row: {
          class_id: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          scheduled_session_id: string | null
          school_id: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          scheduled_session_id?: string | null
          school_id: string
          status: string
          student_id: string
        }
        Update: {
          class_id?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          scheduled_session_id?: string | null
          school_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          school_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          school_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          school_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_students: number
          name: string
          name_localized: Json
          schedule: Json | null
          school_id: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          name: string
          name_localized?: Json
          schedule?: Json | null
          school_id: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          name?: string
          name_localized?: Json
          schedule?: Json | null
          school_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memorization_assignments: {
        Row: {
          assigned_by: string
          assignment_type: string
          completed_at: string | null
          created_at: string
          due_date: string
          from_ayah: number
          id: string
          notes: string | null
          recitation_id: string | null
          school_id: string
          status: string
          student_id: string
          surah_number: number
          to_ayah: number
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assignment_type: string
          completed_at?: string | null
          created_at?: string
          due_date: string
          from_ayah: number
          id?: string
          notes?: string | null
          recitation_id?: string | null
          school_id: string
          status?: string
          student_id: string
          surah_number: number
          to_ayah: number
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assignment_type?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string
          from_ayah?: number
          id?: string
          notes?: string | null
          recitation_id?: string | null
          school_id?: string
          status?: string
          student_id?: string
          surah_number?: number
          to_ayah?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorization_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorization_assignments_recitation_id_fkey"
            columns: ["recitation_id"]
            isOneToOne: false
            referencedRelation: "recitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorization_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorization_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      memorization_progress: {
        Row: {
          avg_accuracy: number | null
          avg_fluency: number | null
          avg_tajweed: number | null
          created_at: string
          ease_factor: number
          first_memorized_at: string | null
          from_ayah: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_date: string | null
          review_count: number
          school_id: string
          status: string
          student_id: string
          surah_number: number
          to_ayah: number
          updated_at: string
        }
        Insert: {
          avg_accuracy?: number | null
          avg_fluency?: number | null
          avg_tajweed?: number | null
          created_at?: string
          ease_factor?: number
          first_memorized_at?: string | null
          from_ayah: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string | null
          review_count?: number
          school_id: string
          status?: string
          student_id: string
          surah_number: number
          to_ayah: number
          updated_at?: string
        }
        Update: {
          avg_accuracy?: number | null
          avg_fluency?: number | null
          avg_tajweed?: number | null
          created_at?: string
          ease_factor?: number
          first_memorized_at?: string | null
          from_ayah?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string | null
          review_count?: number
          school_id?: string
          status?: string
          student_id?: string
          surah_number?: number
          to_ayah?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorization_progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorization_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          achievement_unlocked: boolean
          attendance_marked: boolean
          created_at: string
          daily_summary: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          session_completed: boolean
          sticker_awarded: boolean
          student_alert: boolean
          trophy_earned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_unlocked?: boolean
          attendance_marked?: boolean
          created_at?: string
          daily_summary?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          session_completed?: boolean
          sticker_awarded?: boolean
          student_alert?: boolean
          trophy_earned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_unlocked?: boolean
          attendance_marked?: boolean
          created_at?: string
          daily_summary?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          session_completed?: boolean
          sticker_awarded?: boolean
          student_alert?: boolean
          trophy_earned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          name_localized: Json
          phone: string | null
          preferred_language: string
          role: string
          school_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          name_localized?: Json
          phone?: string | null
          preferred_language?: string
          role: string
          school_id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          name_localized?: Json
          phone?: string | null
          preferred_language?: string
          role?: string
          school_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_rub_reference: {
        Row: {
          end_ayah: number
          end_surah: number
          hizb_number: number
          juz_number: number
          quarter_in_hizb: number
          rub_number: number
          start_ayah: number
          start_surah: number
        }
        Insert: {
          end_ayah: number
          end_surah: number
          hizb_number: number
          juz_number: number
          quarter_in_hizb: number
          rub_number: number
          start_ayah: number
          start_surah: number
        }
        Update: {
          end_ayah?: number
          end_surah?: number
          hizb_number?: number
          juz_number?: number
          quarter_in_hizb?: number
          rub_number?: number
          start_ayah?: number
          start_surah?: number
        }
        Relationships: []
      }
      recitations: {
        Row: {
          accuracy_score: number | null
          created_at: string
          fluency_score: number | null
          from_ayah: number
          id: string
          mistake_notes: string | null
          needs_repeat: boolean
          recitation_date: string
          recitation_type: string
          school_id: string
          session_id: string
          student_id: string
          surah_number: number
          tajweed_score: number | null
          teacher_id: string
          to_ayah: number
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          fluency_score?: number | null
          from_ayah: number
          id?: string
          mistake_notes?: string | null
          needs_repeat?: boolean
          recitation_date?: string
          recitation_type: string
          school_id: string
          session_id: string
          student_id: string
          surah_number: number
          tajweed_score?: number | null
          teacher_id: string
          to_ayah: number
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          fluency_score?: number | null
          from_ayah?: number
          id?: string
          mistake_notes?: string | null
          needs_repeat?: boolean
          recitation_date?: string
          recitation_type?: string
          school_id?: string
          session_id?: string
          student_id?: string
          surah_number?: number
          tajweed_score?: number | null
          teacher_id?: string
          to_ayah?: number
        }
        Relationships: [
          {
            foreignKeyName: "recitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recitations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recitations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recitations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_sessions: {
        Row: {
          cancelled_reason: string | null
          class_id: string | null
          class_schedule_id: string | null
          completed_at: string | null
          created_at: string
          end_time: string
          evaluation_session_id: string | null
          id: string
          notes: string | null
          school_id: string
          session_date: string
          session_type: string
          start_time: string
          status: string
          student_id: string | null
          teacher_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          cancelled_reason?: string | null
          class_id?: string | null
          class_schedule_id?: string | null
          completed_at?: string | null
          created_at?: string
          end_time: string
          evaluation_session_id?: string | null
          id?: string
          notes?: string | null
          school_id: string
          session_date: string
          session_type: string
          start_time: string
          status?: string
          student_id?: string | null
          teacher_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_reason?: string | null
          class_id?: string | null
          class_schedule_id?: string | null
          completed_at?: string | null
          created_at?: string
          end_time?: string
          evaluation_session_id?: string | null
          id?: string
          notes?: string | null
          school_id?: string
          session_date?: string
          session_type?: string
          start_time?: string
          status?: string
          student_id?: string | null
          teacher_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_evaluation_session_id_fkey"
            columns: ["evaluation_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          geofence_radius_meters: number
          id: string
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          name_localized: Json
          owner_id: string | null
          phone: string | null
          settings: Json | null
          slug: string
          timezone: string
          updated_at: string
          verification_logic: string
          verification_mode: string
          wifi_ssid: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          geofence_radius_meters?: number
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          name_localized?: Json
          owner_id?: string | null
          phone?: string | null
          settings?: Json | null
          slug: string
          timezone?: string
          updated_at?: string
          verification_logic?: string
          verification_mode?: string
          wifi_ssid?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          geofence_radius_meters?: number
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          name_localized?: Json
          owner_id?: string | null
          phone?: string | null
          settings?: Json | null
          slug?: string
          timezone?: string
          updated_at?: string
          verification_logic?: string
          verification_mode?: string
          wifi_ssid?: string | null
        }
        Relationships: []
      }
      session_recitation_plans: {
        Row: {
          assignment_id: string | null
          created_at: string
          end_ayah: number
          end_surah: number
          hizb_number: number | null
          id: string
          juz_number: number | null
          notes: string | null
          recitation_type: string
          rub_number: number | null
          scheduled_session_id: string
          school_id: string
          selection_mode: string
          set_by: string
          source: string
          start_ayah: number
          start_surah: number
          student_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          end_ayah: number
          end_surah: number
          hizb_number?: number | null
          id?: string
          juz_number?: number | null
          notes?: string | null
          recitation_type?: string
          rub_number?: number | null
          scheduled_session_id: string
          school_id: string
          selection_mode?: string
          set_by: string
          source?: string
          start_ayah: number
          start_surah: number
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          end_ayah?: number
          end_surah?: number
          hizb_number?: number | null
          id?: string
          juz_number?: number | null
          notes?: string | null
          recitation_type?: string
          rub_number?: number | null
          scheduled_session_id?: string
          school_id?: string
          selection_mode?: string
          set_by?: string
          source?: string
          start_ayah?: number
          start_surah?: number
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recitation_plans_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "memorization_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recitation_plans_rub_number_fkey"
            columns: ["rub_number"]
            isOneToOne: false
            referencedRelation: "quran_rub_reference"
            referencedColumns: ["rub_number"]
          },
          {
            foreignKeyName: "session_recitation_plans_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recitation_plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recitation_plans_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recitation_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          memorization_score: number | null
          notes: string | null
          recitation_quality: number | null
          scheduled_session_id: string | null
          school_id: string
          session_date: string
          student_id: string
          tajweed_score: number | null
          teacher_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          memorization_score?: number | null
          notes?: string | null
          recitation_quality?: number | null
          scheduled_session_id?: string | null
          school_id: string
          session_date?: string
          student_id: string
          tajweed_score?: number | null
          teacher_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          memorization_score?: number | null
          notes?: string | null
          recitation_quality?: number | null
          scheduled_session_id?: string | null
          school_id?: string
          session_date?: string
          student_id?: string
          tajweed_score?: number | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      stickers: {
        Row: {
          created_at: string
          id: string
          image_path: string
          is_active: boolean
          name_ar: string
          name_en: string
          tier: string
        }
        Insert: {
          created_at?: string
          id: string
          image_path: string
          is_active?: boolean
          name_ar: string
          name_en: string
          tier?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          tier?: string
        }
        Relationships: []
      }
      student_rub_certifications: {
        Row: {
          certified_at: string
          certified_by: string
          created_at: string
          dormant_since: string | null
          id: string
          last_reviewed_at: string
          review_count: number
          rub_number: number
          student_id: string
          updated_at: string
        }
        Insert: {
          certified_at?: string
          certified_by: string
          created_at?: string
          dormant_since?: string | null
          id?: string
          last_reviewed_at?: string
          review_count?: number
          rub_number: number
          student_id: string
          updated_at?: string
        }
        Update: {
          certified_at?: string
          certified_by?: string
          created_at?: string
          dormant_since?: string | null
          id?: string
          last_reviewed_at?: string
          review_count?: number
          rub_number?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_rub_certifications_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_rub_certifications_rub_number_fkey"
            columns: ["rub_number"]
            isOneToOne: false
            referencedRelation: "quran_rub_reference"
            referencedColumns: ["rub_number"]
          },
          {
            foreignKeyName: "student_rub_certifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_stickers: {
        Row: {
          awarded_at: string
          awarded_by: string
          id: string
          is_new: boolean
          reason: string | null
          sticker_id: string
          student_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by: string
          id?: string
          is_new?: boolean
          reason?: string | null
          sticker_id: string
          student_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string
          id?: string
          is_new?: boolean
          reason?: string | null
          sticker_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_stickers_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_stickers_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_stickers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          can_self_assign: boolean
          class_id: string | null
          current_level: number
          current_streak: number
          date_of_birth: string | null
          enrollment_date: string
          id: string
          is_active: boolean
          longest_streak: number
          parent_id: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          can_self_assign?: boolean
          class_id?: string | null
          current_level?: number
          current_streak?: number
          date_of_birth?: string | null
          enrollment_date?: string
          id: string
          is_active?: boolean
          longest_streak?: number
          parent_id?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          can_self_assign?: boolean
          class_id?: string | null
          current_level?: number
          current_streak?: number
          date_of_birth?: string | null
          enrollment_date?: string
          id?: string
          is_active?: boolean
          longest_streak?: number
          parent_id?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_checkins: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          checkin_distance_meters: number | null
          checkin_latitude: number | null
          checkin_longitude: number | null
          checkin_wifi_ssid: string | null
          checkout_distance_meters: number | null
          checkout_latitude: number | null
          checkout_longitude: number | null
          checkout_wifi_ssid: string | null
          class_id: string | null
          date: string
          id: string
          is_verified: boolean
          notes: string | null
          override_reason: string | null
          school_id: string
          teacher_id: string
          verification_method: string
          verified_by: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          checkin_distance_meters?: number | null
          checkin_latitude?: number | null
          checkin_longitude?: number | null
          checkin_wifi_ssid?: string | null
          checkout_distance_meters?: number | null
          checkout_latitude?: number | null
          checkout_longitude?: number | null
          checkout_wifi_ssid?: string | null
          class_id?: string | null
          date?: string
          id?: string
          is_verified?: boolean
          notes?: string | null
          override_reason?: string | null
          school_id: string
          teacher_id: string
          verification_method?: string
          verified_by?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          checkin_distance_meters?: number | null
          checkin_latitude?: number | null
          checkin_longitude?: number | null
          checkin_wifi_ssid?: string | null
          checkout_distance_meters?: number | null
          checkout_latitude?: number | null
          checkout_longitude?: number | null
          checkout_wifi_ssid?: string | null
          class_id?: string | null
          date?: string
          id?: string
          is_verified?: boolean
          notes?: string | null
          override_reason?: string | null
          school_id?: string
          teacher_id?: string
          verification_method?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_checkins_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_checkins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_checkins_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_checkins_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_work_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          school_id: string
          start_time: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          school_id: string
          start_time: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          school_id?: string
          start_time?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_work_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_work_schedules_teacher_id_fkey"
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
      get_attendance_trend: {
        Args: {
          p_class_id?: string
          p_end_date: string
          p_granularity: string
          p_school_id: string
          p_start_date: string
        }
        Returns: {
          absent_count: number
          attendance_rate: number
          bucket_date: string
          excused_count: number
          late_count: number
          present_count: number
        }[]
      }
      get_child_score_trend: {
        Args: {
          p_class_id: string
          p_end_date: string
          p_granularity: string
          p_start_date: string
          p_student_id: string
        }
        Returns: {
          avg_memorization: number
          avg_recitation: number
          avg_tajweed: number
          bucket_date: string
          class_avg_memorization: number
          class_avg_recitation: number
          class_avg_tajweed: number
        }[]
      }
      get_period_comparison: {
        Args: {
          p_class_id?: string
          p_current_end: string
          p_current_start: string
          p_previous_end: string
          p_previous_start: string
          p_school_id: string
        }
        Returns: {
          current_attendance_rate: number
          current_avg_memorization: number
          current_avg_recitation: number
          current_avg_tajweed: number
          current_stickers: number
          previous_attendance_rate: number
          previous_avg_memorization: number
          previous_avg_recitation: number
          previous_avg_tajweed: number
          previous_stickers: number
        }[]
      }
      get_score_trend: {
        Args: {
          p_class_id?: string
          p_end_date: string
          p_granularity: string
          p_school_id: string
          p_start_date: string
        }
        Returns: {
          avg_memorization: number
          avg_recitation: number
          avg_tajweed: number
          bucket_date: string
        }[]
      }
      get_session_completion_stats: {
        Args: { p_end_date: string; p_school_id: string; p_start_date: string }
        Returns: {
          cancelled_count: number
          completed_count: number
          completion_rate: number
          full_name: string
          missed_count: number
          teacher_id: string
          total_scheduled: number
        }[]
      }
      get_student_memorization_stats: {
        Args: { p_student_id: string }
        Returns: {
          avg_overall_accuracy: number
          items_needing_review: number
          quran_percentage: number
          surahs_completed: number
          surahs_started: number
          total_ayahs_in_progress: number
          total_ayahs_memorized: number
          total_recitations: number
        }[]
      }
      get_student_revision_schedule: {
        Args: { p_date?: string; p_student_id: string }
        Returns: {
          avg_accuracy: number
          avg_fluency: number
          avg_tajweed: number
          ease_factor: number
          first_memorized_at: string
          from_ayah: number
          last_reviewed_at: string
          next_review_date: string
          progress_id: string
          review_count: number
          review_type: string
          status: string
          surah_number: number
          to_ayah: number
        }[]
      }
      get_students_needing_attention: {
        Args: { p_class_id: string; p_end_date?: string; p_start_date?: string }
        Returns: {
          avatar_url: string
          current_avg: number
          decline_amount: number
          flag_reason: string
          full_name: string
          previous_avg: number
          student_id: string
        }[]
      }
      get_teacher_activity: {
        Args: { p_end_date: string; p_school_id: string; p_start_date: string }
        Returns: {
          avatar_url: string
          full_name: string
          last_active_date: string
          sessions_logged: number
          stickers_awarded: number
          teacher_id: string
          unique_students: number
        }[]
      }
      get_teacher_attendance_kpis: {
        Args: { p_end_date: string; p_school_id: string; p_start_date: string }
        Returns: {
          avatar_url: string
          avg_hours_per_day: number
          days_late: number
          days_on_time: number
          days_present: number
          full_name: string
          punctuality_rate: number
          teacher_id: string
          total_hours_worked: number
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      get_user_school_id: { Args: never; Returns: string }
      increment_review_count: { Args: { cert_id: string }; Returns: undefined }
      resolve_localized_name: {
        Args: { fallback: string; lang: string; localized: Json }
        Returns: string
      }
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

