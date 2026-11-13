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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      diagnostic_keywords: {
        Row: {
          created_at: string
          id: string
          keyword: string
          questionnaire_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          questionnaire_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          questionnaire_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_keywords_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          language: string
          last_name: string | null
          license_number: string | null
          notify_submissions: boolean
          postal_code: string | null
          professional_declaration_at: string | null
          profile_completed: boolean
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id: string
          language?: string
          last_name?: string | null
          license_number?: string | null
          notify_submissions?: boolean
          postal_code?: string | null
          professional_declaration_at?: string | null
          profile_completed?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          language?: string
          last_name?: string | null
          license_number?: string | null
          notify_submissions?: boolean
          postal_code?: string | null
          professional_declaration_at?: string | null
          profile_completed?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          language: string
          message: string
          name: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          language?: string
          message: string
          name?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          language?: string
          message?: string
          name?: string | null
        }
        Relationships: []
      }
      interpretations: {
        Row: {
          category: string
          color: string | null
          created_at: string
          description: string
          id: string
          max_score: number
          min_score: number
          questionnaire_id: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          description: string
          id?: string
          max_score: number
          min_score: number
          questionnaire_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          description?: string
          id?: string
          max_score?: number
          min_score?: number
          questionnaire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interpretations_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invitations: {
        Row: {
          completed_at: string | null
          created_at: string
          doctor_id: string
          expires_at: string
          id: string
          label: string
          questionnaire_slug: string
          response_id: string | null
          token: string
          variant: string | null
        }
        Insert: {
          doctor_id?: string
          expires_at?: string
          label: string
          questionnaire_slug: string
          variant?: string | null
        }
        Update: {
          expires_at?: string
        }
        Relationships: []
      }
      patient_responses: {
        Row: {
          answers: number[]
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          doctor_id: string
          id: string
          label: string | null
          questionnaire_name: string | null
          questionnaire_slug: string
          seen: boolean
          source: string
          total_score: number
        }
        Insert: {
          answers?: number[]
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          doctor_id: string
          id?: string
          label?: string | null
          questionnaire_name?: string | null
          questionnaire_slug: string
          seen?: boolean
          source?: string
          total_score?: number
        }
        Update: {
          answers?: number[]
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          id?: string
          label?: string | null
          questionnaire_name?: string | null
          questionnaire_slug?: string
          seen?: boolean
          source?: string
          total_score?: number
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          label: string
          order_index: number
          question_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order_index?: number
          question_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order_index?: number
          question_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_score: number | null
          name: string
          reference: string | null
          scoring_type: string
          slug: string
          specialty_id: string | null
          structure: Json | null
          subspecialty_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_score?: number | null
          name: string
          reference?: string | null
          scoring_type?: string
          slug: string
          specialty_id?: string | null
          structure?: Json | null
          subspecialty_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_score?: number | null
          name?: string
          reference?: string | null
          scoring_type?: string
          slug?: string
          specialty_id?: string | null
          structure?: Json | null
          subspecialty_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaires_subspecialty_id_fkey"
            columns: ["subspecialty_id"]
            isOneToOne: false
            referencedRelation: "subspecialties"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          order_index: number
          question_type: string
          questionnaire_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          order_index?: number
          question_type?: string
          questionnaire_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          order_index?: number
          question_type?: string
          questionnaire_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          config: Json
          created_at: string
          id: string
          questionnaire_id: string
          rule_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          questionnaire_id: string
          rule_type?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          questionnaire_id?: string
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_rules_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      subspecialties: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subspecialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invitation: {
        Args: { _token: string }
        Returns: {
          questionnaire_slug: string
          status: string
          variant: string | null
        }[]
      }
      submit_invited_response: {
        Args: { _answers: number[]; _token: string }
        Returns: number
      }
      calculate_questionnaire_score: {
        Args: { answers: number[]; questionnaire_slug: string }
        Returns: {
          category: string
          color: string
          description: string
          total_score: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
