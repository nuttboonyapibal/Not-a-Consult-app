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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_requests: {
        Row: {
          cache_read_tokens: number
          created_at: string
          error: string | null
          id: number
          input_tokens: number
          kind: string
          model: string
          ok: boolean
          output_tokens: number
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          cache_read_tokens?: number
          created_at?: string
          error?: string | null
          id?: never
          input_tokens?: number
          kind: string
          model: string
          ok?: boolean
          output_tokens?: number
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          cache_read_tokens?: number
          created_at?: string
          error?: string | null
          id?: never
          input_tokens?: number
          kind?: string
          model?: string
          ok?: boolean
          output_tokens?: number
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          created_at: string
          data: Json
          framework_key: string
          id: string
          position: number
          project_id: string
          question_id: string
          status: Database["public"]["Enums"]["analysis_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          framework_key: string
          id?: string
          position?: number
          project_id: string
          question_id: string
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          framework_key?: string
          id?: string
          position?: number
          project_id?: string
          question_id?: string
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_revisions: {
        Row: {
          analysis_id: string
          changed_by: string | null
          client_link_id: string | null
          created_at: string
          field_key: string
          id: number
          project_id: string
          updated_at: string
          value_after: Json | null
          value_before: Json | null
        }
        Insert: {
          analysis_id: string
          changed_by?: string | null
          client_link_id?: string | null
          created_at?: string
          field_key: string
          id?: never
          project_id: string
          updated_at?: string
          value_after?: Json | null
          value_before?: Json | null
        }
        Update: {
          analysis_id?: string
          changed_by?: string | null
          client_link_id?: string | null
          created_at?: string
          field_key?: string
          id?: never
          project_id?: string
          updated_at?: string
          value_after?: Json | null
          value_before?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_revisions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_revisions_client_link_id_fkey"
            columns: ["client_link_id"]
            isOneToOne: false
            referencedRelation: "client_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          allowed_domains: string[]
          id: number
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[]
          id?: number
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[]
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          label: string | null
          message: string | null
          opened_at: string | null
          project_id: string
          revoked_at: string | null
          scope: Json
          submitted_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          message?: string | null
          opened_at?: string | null
          project_id: string
          revoked_at?: string | null
          scope?: Json
          submitted_at?: string | null
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          message?: string | null
          opened_at?: string | null
          project_id?: string
          revoked_at?: string | null
          scope?: Json
          submitted_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          username: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ai_enabled: boolean
          business_profile: Json
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          report_lang: string
          stage: Database["public"]["Enums"]["business_stage"]
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          business_profile?: Json
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          report_lang?: string
          stage?: Database["public"]["Enums"]["business_stage"]
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          business_profile?: Json
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          report_lang?: string
          stage?: Database["public"]["Enums"]["business_stage"]
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          position: number
          project_id: string
          text: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id: string
          text: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_publications: {
        Row: {
          id: string
          lang: string
          project_id: string
          published_at: string
          published_by: string | null
          revoked_at: string | null
          snapshot: Json
          token: string
        }
        Insert: {
          id?: string
          lang?: string
          project_id: string
          published_at?: string
          published_by?: string | null
          revoked_at?: string | null
          snapshot: Json
          token: string
        }
        Update: {
          id?: string
          lang?: string
          project_id?: string
          published_at?: string
          published_by?: string | null
          revoked_at?: string | null
          snapshot?: Json
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_publications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_publications_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          action_plan: Json
          decisions: Json
          exec_summary: Json
          project_id: string
          source: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_plan?: Json
          decisions?: Json
          exec_summary?: Json
          project_id: string
          source?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_plan?: Json
          decisions?: Json
          exec_summary?: Json
          project_id?: string
          source?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_updated_by_fkey"
            columns: ["updated_by"]
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
      ai_usage_summary: {
        Args: { since: string }
        Returns: {
          cache_read_tokens: number
          failed: number
          input_tokens: number
          model: string
          output_tokens: number
          requests: number
          user_id: string
        }[]
      }
      client_link_get: { Args: { link_token: string }; Returns: Json }
      client_link_save: {
        Args: { analysis_id: string; link_token: string; patch: Json }
        Returns: boolean
      }
      client_link_submit: { Args: { link_token: string }; Returns: boolean }
      patch_analysis: {
        Args: { aid: string; patch: Json }
        Returns: {
          created_at: string
          data: Json
          framework_key: string
          id: string
          position: number
          project_id: string
          question_id: string
          status: Database["public"]["Enums"]["analysis_status"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "analyses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      patch_business_profile: {
        Args: { patch: Json; pid: string }
        Returns: {
          ai_enabled: boolean
          business_profile: Json
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          report_lang: string
          stage: Database["public"]["Enums"]["business_stage"]
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      public_report_get: { Args: { report_token: string }; Returns: Json }
      resolve_client_link: {
        Args: { link_token: string }
        Returns: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          label: string | null
          message: string | null
          opened_at: string | null
          project_id: string
          revoked_at: string | null
          scope: Json
          submitted_at: string | null
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "client_links"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      analysis_status: "not_started" | "in_progress" | "waiting_client" | "done"
      app_role: "admin" | "consultant"
      business_stage: "startup" | "sme" | "enterprise"
      project_status: "draft" | "waiting_client" | "analyzing" | "summarized"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      analysis_status: ["not_started", "in_progress", "waiting_client", "done"],
      app_role: ["admin", "consultant"],
      business_stage: ["startup", "sme", "enterprise"],
      project_status: ["draft", "waiting_client", "analyzing", "summarized"],
    },
  },
} as const
