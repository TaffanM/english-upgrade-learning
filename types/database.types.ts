export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          source_level: string | null;
          target_level: string | null;
          start_date: string;
          end_date: string;
          total_days: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          source_level?: string | null;
          target_level?: string | null;
          start_date: string;
          end_date: string;
          total_days: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          source_level?: string | null;
          target_level?: string | null;
          start_date?: string;
          end_date?: string;
          total_days?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      phases: {
        Row: {
          id: string;
          challenge_id: string;
          phase_number: number;
          title: string;
          focus: string | null;
          start_day: number;
          end_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          phase_number: number;
          title: string;
          focus?: string | null;
          start_day: number;
          end_day: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          phase_number?: number;
          title?: string;
          focus?: string | null;
          start_day?: number;
          end_day?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "phases_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          }
        ];
      };
      challenge_days: {
        Row: {
          id: string;
          challenge_id: string;
          phase_id: string | null;
          day_number: number;
          scheduled_date: string;
          title: string | null;
          intro: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          phase_id?: string | null;
          day_number: number;
          scheduled_date: string;
          title?: string | null;
          intro?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          phase_id?: string | null;
          day_number?: number;
          scheduled_date?: string;
          title?: string | null;
          intro?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_days_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_days_phase_id_fkey";
            columns: ["phase_id"];
            isOneToOne: false;
            referencedRelation: "phases";
            referencedColumns: ["id"];
          }
        ];
      };
      activities: {
        Row: {
          id: string;
          challenge_day_id: string;
          activity_type: "speaking" | "writing";
          title: string;
          prompt: string;
          instructions: string | null;
          target_duration_minutes: number;
          target_word_count: number | null;
          minimum_word_count: number | null;
          maximum_word_count: number | null;
          sort_order: number;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_day_id: string;
          activity_type: "speaking" | "writing";
          title: string;
          prompt: string;
          instructions?: string | null;
          target_duration_minutes?: number;
          target_word_count?: number | null;
          minimum_word_count?: number | null;
          maximum_word_count?: number | null;
          sort_order?: number;
          is_required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_day_id?: string;
          activity_type?: "speaking" | "writing";
          title?: string;
          prompt?: string;
          instructions?: string | null;
          target_duration_minutes?: number;
          target_word_count?: number | null;
          minimum_word_count?: number | null;
          maximum_word_count?: number | null;
          sort_order?: number;
          is_required?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_challenge_day_id_fkey";
            columns: ["challenge_day_id"];
            isOneToOne: false;
            referencedRelation: "challenge_days";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_items: {
        Row: {
          id: string;
          challenge_day_id: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_day_id: string;
          label: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_day_id?: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_items_challenge_day_id_fkey";
            columns: ["challenge_day_id"];
            isOneToOne: false;
            referencedRelation: "challenge_days";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_submissions: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          attempt_number: number;
          status: "draft" | "submitted";
          text_content: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          mime_type: string | null;
          file_size_bytes: number | null;
          duration_seconds: number | null;
          word_count: number | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: string;
          attempt_number: number;
          status: "draft" | "submitted";
          text_content?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          word_count?: number | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string;
          attempt_number?: number;
          status?: "draft" | "submitted";
          text_content?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          word_count?: number | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_submissions_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_progress: {
        Row: {
          id: string;
          user_id: string;
          challenge_day_id: string;
          speaking_completed_at: string | null;
          writing_completed_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_day_id: string;
          speaking_completed_at?: string | null;
          writing_completed_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_day_id?: string;
          speaking_completed_at?: string | null;
          writing_completed_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_progress_challenge_day_id_fkey";
            columns: ["challenge_day_id"];
            isOneToOne: false;
            referencedRelation: "challenge_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_completions: {
        Row: {
          id: string;
          user_id: string;
          checklist_item_id: string;
          is_completed: boolean;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checklist_item_id: string;
          is_completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          checklist_item_id?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_completions_checklist_item_id_fkey";
            columns: ["checklist_item_id"];
            isOneToOne: false;
            referencedRelation: "checklist_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_completions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      self_assessments: {
        Row: {
          id: string;
          user_id: string;
          challenge_day_id: string;
          activity_type: "speaking" | "writing" | null;
          fluency_score: number | null;
          grammar_score: number | null;
          vocabulary_score: number | null;
          organization_score: number | null;
          confidence_score: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_day_id: string;
          activity_type?: "speaking" | "writing" | null;
          fluency_score?: number | null;
          grammar_score?: number | null;
          vocabulary_score?: number | null;
          organization_score?: number | null;
          confidence_score?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_day_id?: string;
          activity_type?: "speaking" | "writing" | null;
          fluency_score?: number | null;
          grammar_score?: number | null;
          vocabulary_score?: number | null;
          organization_score?: number | null;
          confidence_score?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "self_assessments_challenge_day_id_fkey";
            columns: ["challenge_day_id"];
            isOneToOne: false;
            referencedRelation: "challenge_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "self_assessments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      weekly_reviews: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          phase_id: string;
          review_prompt: string | null;
          reflection: string | null;
          fluency_score: number | null;
          grammar_score: number | null;
          vocabulary_score: number | null;
          organization_score: number | null;
          confidence_score: number | null;
          evidence_notes: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          phase_id: string;
          review_prompt?: string | null;
          reflection?: string | null;
          fluency_score?: number | null;
          grammar_score?: number | null;
          vocabulary_score?: number | null;
          organization_score?: number | null;
          confidence_score?: number | null;
          evidence_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          phase_id?: string;
          review_prompt?: string | null;
          reflection?: string | null;
          fluency_score?: number | null;
          grammar_score?: number | null;
          vocabulary_score?: number | null;
          organization_score?: number | null;
          confidence_score?: number | null;
          evidence_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_reviews_phase_id_fkey";
            columns: ["phase_id"];
            isOneToOne: false;
            referencedRelation: "phases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
