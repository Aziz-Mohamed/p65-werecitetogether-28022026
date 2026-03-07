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
      certifications: {
        Row: {
          certificate_number: string | null
          chain_of_narration: string | null
          created_at: string
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json
          notes: string | null
          program_id: string
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_id: string
          teacher_id: string
          title: string
          title_ar: string | null
          track_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          chain_of_narration?: string | null
          created_at?: string
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          metadata?: Json
          notes?: string | null
          program_id: string
          review_notes?: string | null
          reviewed_by?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          student_id: string
          teacher_id: string
          title: string
          title_ar?: string | null
          track_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          chain_of_narration?: string | null
          created_at?: string
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          metadata?: Json
          notes?: string | null
          program_id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
          title?: string
          title_ar?: string | null
          track_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "program_tracks"
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
          teacher_id: string
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
          teacher_id: string
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
          teacher_id?: string
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
      daily_session_counts: {
        Row: {
          created_at: string
          id: string
          program_id: string
          session_count: number
          session_date: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          session_count?: number
          session_date: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          session_count?: number
          session_date?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_session_counts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_session_counts_student_id_fkey"
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
      himam_events: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string
          event_date: string
          id: string
          program_id: string
          registration_deadline: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          event_date: string
          id?: string
          program_id: string
          registration_deadline: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          event_date?: string
          id?: string
          program_id?: string
          registration_deadline?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "himam_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "himam_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      himam_progress: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          juz_number: number
          notes: string | null
          registration_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          juz_number: number
          notes?: string | null
          registration_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          juz_number?: number
          notes?: string | null
          registration_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "himam_progress_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "himam_progress_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "himam_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      himam_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          partner_id: string | null
          selected_juz: number[]
          status: string
          student_id: string
          time_slots: Json
          track: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          partner_id?: string | null
          selected_juz: number[]
          status?: string
          student_id: string
          time_slots?: Json
          track: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          partner_id?: string | null
          selected_juz?: number[]
          status?: string
          student_id?: string
          time_slots?: Json
          track?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "himam_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "himam_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "himam_registrations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "himam_registrations_student_id_fkey"
            columns: ["student_id"]
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
      milestone_badges: {
        Row: {
          category: string
          created_at: string
          description_ar: string
          description_en: string
          icon: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          threshold: number
        }
        Insert: {
          category: string
          created_at?: string
          description_ar: string
          description_en: string
          icon: string
          id: string
          name_ar: string
          name_en: string
          sort_order?: number
          threshold: number
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string
          description_en?: string
          icon?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          threshold?: number
        }
        Relationships: []
      }
      mutoon_progress: {
        Row: {
          certified_at: string | null
          certified_by: string | null
          created_at: string
          current_line: number
          id: string
          last_reviewed_at: string | null
          notes: string | null
          program_id: string
          review_count: number
          status: string
          student_id: string
          total_lines: number
          track_id: string
          updated_at: string
        }
        Insert: {
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          current_line?: number
          id?: string
          last_reviewed_at?: string | null
          notes?: string | null
          program_id: string
          review_count?: number
          status?: string
          student_id: string
          total_lines?: number
          track_id: string
          updated_at?: string
        }
        Update: {
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          current_line?: number
          id?: string
          last_reviewed_at?: string | null
          notes?: string | null
          program_id?: string
          review_count?: number
          status?: string
          student_id?: string
          total_lines?: number
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutoon_progress_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutoon_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutoon_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutoon_progress_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "program_tracks"
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
          draft_expired: boolean | null
          flagged_review_alert: boolean
          low_rating_alert: boolean
          queue_available: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rating_prompt: boolean
          recovered_alert: boolean
          session_completed: boolean
          sticker_awarded: boolean
          student_alert: boolean
          teacher_demand: boolean
          trophy_earned: boolean
          updated_at: string
          user_id: string
          voice_memo_received: boolean | null
        }
        Insert: {
          achievement_unlocked?: boolean
          attendance_marked?: boolean
          created_at?: string
          daily_summary?: boolean
          draft_expired?: boolean | null
          flagged_review_alert?: boolean
          low_rating_alert?: boolean
          queue_available?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rating_prompt?: boolean
          recovered_alert?: boolean
          session_completed?: boolean
          sticker_awarded?: boolean
          student_alert?: boolean
          teacher_demand?: boolean
          trophy_earned?: boolean
          updated_at?: string
          user_id: string
          voice_memo_received?: boolean | null
        }
        Update: {
          achievement_unlocked?: boolean
          attendance_marked?: boolean
          created_at?: string
          daily_summary?: boolean
          draft_expired?: boolean | null
          flagged_review_alert?: boolean
          low_rating_alert?: boolean
          queue_available?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rating_prompt?: boolean
          recovered_alert?: boolean
          session_completed?: boolean
          sticker_awarded?: boolean
          student_alert?: boolean
          teacher_demand?: boolean
          trophy_earned?: boolean
          updated_at?: string
          user_id?: string
          voice_memo_received?: boolean | null
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
      platform_config: {
        Row: {
          default_meeting_platform: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          name_ar: string
          settings: Json
          updated_at: string
        }
        Insert: {
          default_meeting_platform?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          default_meeting_platform?: string | null
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
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          languages: string[] | null
          meeting_link: string | null
          meeting_platform: string | null
          name_localized: Json
          onboarding_completed: boolean
          phone: string | null
          preferred_language: string
          role: string
          school_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          languages?: string[] | null
          meeting_link?: string | null
          meeting_platform?: string | null
          name_localized?: Json
          onboarding_completed?: boolean
          phone?: string | null
          preferred_language?: string
          role: string
          school_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          languages?: string[] | null
          meeting_link?: string | null
          meeting_platform?: string | null
          name_localized?: Json
          onboarding_completed?: boolean
          phone?: string | null
          preferred_language?: string
          role?: string
          school_id?: string | null
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
      program_queue_entries: {
        Row: {
          claim_expires_at: string | null
          created_at: string
          expires_at: string
          id: string
          notified_at: string | null
          position: number
          program_id: string
          status: string
          student_id: string
        }
        Insert: {
          claim_expires_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          notified_at?: string | null
          position: number
          program_id: string
          status?: string
          student_id: string
        }
        Update: {
          claim_expires_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          notified_at?: string | null
          position?: number
          program_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_queue_entries_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_queue_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          profile_id: string
          program_id: string
          role: string
          supervisor_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          profile_id: string
          program_id: string
          role: string
          supervisor_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          program_id?: string
          role?: string
          supervisor_id?: string | null
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
          {
            foreignKeyName: "program_roles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          cohort_id: string
          created_at: string
          expires_at: string | null
          id: string
          notified_at: string | null
          position: number
          program_id: string
          status: string
          student_id: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          position?: number
          program_id: string
          status?: string
          student_id: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          position?: number
          program_id?: string
          status?: string
          student_id?: string
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
          daily_session_limit: number | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          queue_notification_threshold: number | null
          settings: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          daily_session_limit?: number | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          queue_notification_threshold?: number | null
          settings?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          daily_session_limit?: number | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          queue_notification_threshold?: number | null
          settings?: Json
          sort_order?: number
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
      rating_exclusion_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          rating_id: string
          reason: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          rating_id: string
          reason: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          rating_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_exclusion_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_exclusion_log_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "teacher_ratings"
            referencedColumns: ["id"]
          },
        ]
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
      session_voice_memos: {
        Row: {
          created_at: string
          duration_seconds: number
          expires_at: string
          file_size_bytes: number
          id: string
          is_expired: boolean
          session_id: string
          storage_path: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          expires_at: string
          file_size_bytes: number
          id?: string
          is_expired?: boolean
          session_id: string
          storage_path: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          file_size_bytes?: number
          id?: string
          is_expired?: boolean
          session_id?: string
          storage_path?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_voice_memos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
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
          class_id: string | null
          created_at: string
          id: string
          memorization_score: number | null
          notes: string | null
          program_id: string | null
          recitation_quality: number | null
          scheduled_session_id: string | null
          school_id: string
          session_date: string
          status: string | null
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
          program_id?: string | null
          recitation_quality?: number | null
          scheduled_session_id?: string | null
          school_id: string
          session_date?: string
          status?: string | null
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
          program_id?: string | null
          recitation_quality?: number | null
          scheduled_session_id?: string | null
          school_id?: string
          session_date?: string
          status?: string | null
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
            foreignKeyName: "sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
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
          program_id: string | null
          tier: string
        }
        Insert: {
          created_at?: string
          id: string
          image_path: string
          is_active?: boolean
          name_ar: string
          name_en: string
          program_id?: string | null
          tier?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          program_id?: string | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "stickers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          program_id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          program_id: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          program_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "milestone_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string | null
          id: string
          is_primary: boolean
          notes: string | null
          relationship: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guardian_email?: string | null
          guardian_name: string
          guardian_phone?: string | null
          id?: string
          is_primary?: boolean
          notes?: string | null
          relationship?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          is_primary?: boolean
          notes?: string | null
          relationship?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      teacher_availability: {
        Row: {
          active_student_count: number
          available_since: string | null
          created_at: string
          id: string
          is_available: boolean
          max_students: number
          program_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          active_student_count?: number
          available_since?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          max_students?: number
          program_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          active_student_count?: number
          available_since?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          max_students?: number
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
      teacher_rating_stats: {
        Row: {
          average_rating: number
          common_constructive_tags: string[] | null
          common_positive_tags: string[] | null
          last_30_days_avg: number | null
          prior_30_days_avg: number | null
          program_id: string
          star_distribution: Json
          teacher_id: string
          total_reviews: number
          trend_direction: string | null
          updated_at: string
        }
        Insert: {
          average_rating?: number
          common_constructive_tags?: string[] | null
          common_positive_tags?: string[] | null
          last_30_days_avg?: number | null
          prior_30_days_avg?: number | null
          program_id: string
          star_distribution?: Json
          teacher_id: string
          total_reviews?: number
          trend_direction?: string | null
          updated_at?: string
        }
        Update: {
          average_rating?: number
          common_constructive_tags?: string[] | null
          common_positive_tags?: string[] | null
          last_30_days_avg?: number | null
          prior_30_days_avg?: number | null
          program_id?: string
          star_distribution?: Json
          teacher_id?: string
          total_reviews?: number
          trend_direction?: string | null
          updated_at?: string
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
      teacher_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_excluded: boolean
          is_flagged: boolean
          program_id: string
          session_id: string | null
          star_rating: number
          student_id: string
          tags: string[] | null
          teacher_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_excluded?: boolean
          is_flagged?: boolean
          program_id: string
          session_id?: string | null
          star_rating: number
          student_id: string
          tags?: string[] | null
          teacher_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_excluded?: boolean
          is_flagged?: boolean
          program_id?: string
          session_id?: string | null
          star_rating?: number
          student_id?: string
          tags?: string[] | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_ratings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_ratings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
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
      assign_master_admin_role: {
        Args: { p_assigned_by: string; p_user_id: string }
        Returns: undefined
      }
      cancel_himam_event: { Args: { p_event_id: string }; Returns: undefined }
      cancel_himam_registration: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
      check_enrollment_duration_milestones: { Args: never; Returns: undefined }
      check_session_milestones: {
        Args: { p_program_id: string; p_student_id: string }
        Returns: undefined
      }
      check_streak_milestones: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      claim_queue_slot: { Args: { p_entry_id: string }; Returns: Json }
      create_himam_event: { Args: { p_event_date: string }; Returns: Json }
      enroll_student: {
        Args: {
          p_cohort_id?: string
          p_program_id: string
          p_track_id?: string
        }
        Returns: string
      }
      exclude_rating: {
        Args: { p_rating_id: string; p_reason: string }
        Returns: Json
      }
      generate_himam_pairings: { Args: { p_event_id: string }; Returns: Json }
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
      get_certification_pipeline: {
        Args: { p_program_id: string }
        Returns: Json
      }
      get_certification_queue: {
        Args: { p_program_id: string; p_role: string }
        Returns: {
          created_at: string
          id: string
          program_name: string
          status: string
          student_avatar: string
          student_name: string
          teacher_name: string
          title: string
          track_name: string
          type: string
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
      get_daily_session_count: { Args: { p_program_id: string }; Returns: Json }
      get_himam_event_stats: { Args: { p_event_id: string }; Returns: Json }
      get_master_admin_dashboard_stats: { Args: never; Returns: Json }
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
      get_program_admin_dashboard_stats: {
        Args: { p_program_id: string }
        Returns: Json
      }
      get_program_demand: { Args: { p_program_id: string }; Returns: Json }
      get_program_leaderboard: {
        Args: { p_limit?: number; p_program_id: string; p_student_id?: string }
        Returns: {
          avatar_url: string
          current_level: number
          full_name: string
          longest_streak: number
          rank: number
          student_id: string
        }[]
      }
      get_queue_status: { Args: { p_program_id: string }; Returns: Json }
      get_rewards_dashboard: { Args: { p_program_id: string }; Returns: Json }
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
      get_supervised_teachers: {
        Args: { p_supervisor_id: string }
        Returns: {
          avatar_url: string
          average_rating: number
          full_name: string
          is_active: boolean
          program_id: string
          program_name: string
          sessions_this_week: number
          student_count: number
          teacher_id: string
        }[]
      }
      get_supervisor_dashboard_stats: {
        Args: { p_supervisor_id: string }
        Returns: Json
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
      get_teacher_rating_stats: {
        Args: { p_program_id: string; p_teacher_id: string }
        Returns: Json
      }
      get_teacher_reviews: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_program_id: string
          p_teacher_id: string
        }
        Returns: Json
      }
      get_user_programs: { Args: never; Returns: string[] }
      get_user_role: { Args: never; Returns: string }
      get_user_school_id: { Args: never; Returns: string }
      get_voice_memo_url: { Args: { p_session_id: string }; Returns: Json }
      increment_review_count: { Args: { cert_id: string }; Returns: undefined }
      issue_certification: {
        Args: {
          p_action: string
          p_certification_id: string
          p_chain_of_narration?: string
          p_review_notes?: string
        }
        Returns: {
          certificate_number: string | null
          chain_of_narration: string | null
          created_at: string
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json
          notes: string | null
          program_id: string
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_id: string
          teacher_id: string
          title: string
          title_ar: string | null
          track_id: string | null
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "certifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      join_queue: { Args: { p_program_id: string }; Returns: Json }
      join_teacher_session: {
        Args: { p_availability_id: string }
        Returns: boolean
      }
      leave_queue: { Args: { p_program_id: string }; Returns: Json }
      mark_juz_complete: {
        Args: { p_juz_number: number; p_registration_id: string }
        Returns: Json
      }
      promote_from_waitlist: { Args: { p_cohort_id: string }; Returns: number }
      reassign_student: {
        Args: {
          p_enrollment_id: string
          p_new_teacher_id: string
          p_supervisor_id: string
        }
        Returns: undefined
      }
      recalculate_teacher_stats: {
        Args: { p_program_id: string; p_teacher_id: string }
        Returns: undefined
      }
      recommend_certification: {
        Args: {
          p_metadata?: Json
          p_notes?: string
          p_program_id: string
          p_student_id: string
          p_title?: string
          p_title_ar?: string
          p_track_id?: string
          p_type?: string
        }
        Returns: {
          certificate_number: string | null
          chain_of_narration: string | null
          created_at: string
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json
          notes: string | null
          program_id: string
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_id: string
          teacher_id: string
          title: string
          title_ar: string | null
          track_id: string | null
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "certifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      register_for_himam_event: {
        Args: {
          p_event_id: string
          p_selected_juz: number[]
          p_time_slots: Json
          p_track: string
        }
        Returns: Json
      }
      resolve_localized_name: {
        Args: { fallback: string; lang: string; localized: Json }
        Returns: string
      }
      restore_rating: {
        Args: { p_rating_id: string; p_reason: string }
        Returns: Json
      }
      resubmit_certification: {
        Args: {
          p_certification_id: string
          p_notes?: string
          p_title?: string
          p_title_ar?: string
        }
        Returns: {
          certificate_number: string | null
          chain_of_narration: string | null
          created_at: string
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json
          notes: string | null
          program_id: string
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_id: string
          teacher_id: string
          title: string
          title_ar: string | null
          track_id: string | null
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "certifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      review_certification: {
        Args: {
          p_action: string
          p_certification_id: string
          p_review_notes?: string
        }
        Returns: {
          certificate_number: string | null
          chain_of_narration: string | null
          created_at: string
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json
          notes: string | null
          program_id: string
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_id: string
          teacher_id: string
          title: string
          title_ar: string | null
          track_id: string | null
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "certifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      revoke_certification: {
        Args: { p_certification_id: string; p_revocation_reason: string }
        Returns: {
          certificate_number: string | null
          chain_of_narration: string | null
          created_at: string
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json
          notes: string | null
          program_id: string
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          student_id: string
          teacher_id: string
          title: string
          title_ar: string | null
          track_id: string | null
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "certifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      revoke_master_admin_role: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      search_users_for_role_assignment: {
        Args: { p_limit?: number; p_search_query: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          program_roles_data: Json
          role: string
        }[]
      }
      submit_rating: {
        Args: {
          p_comment?: string
          p_session_id: string
          p_star_rating: number
          p_tags?: string[]
        }
        Returns: Json
      }
      swap_himam_partners: {
        Args: { p_registration_id_a: string; p_registration_id_b: string }
        Returns: undefined
      }
      toggle_availability: {
        Args: {
          p_is_available: boolean
          p_max_students?: number
          p_program_id: string
        }
        Returns: {
          active_student_count: number
          available_since: string | null
          created_at: string
          id: string
          is_available: boolean
          max_students: number
          program_id: string
          teacher_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "teacher_availability"
          isOneToOne: false
          isSetofReturn: true
        }
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
