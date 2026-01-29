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
      follow_up_questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          inquiry_id: string
          question: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          inquiry_id: string
          question: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_questions_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_assistant_id: string | null
          brand: string | null
          category: Database["public"]["Enums"]["item_category"] | null
          color: string | null
          confidence_score: number | null
          created_at: string
          date_lost: string | null
          description: string
          distinguishing_features: string | null
          id: string
          image_urls: string[] | null
          location_lost: string | null
          number_of_matches: number | null
          rate_limit_count: number | null
          status: Database["public"]["Enums"]["inquiry_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_assistant_id?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"] | null
          color?: string | null
          confidence_score?: number | null
          created_at?: string
          date_lost?: string | null
          description: string
          distinguishing_features?: string | null
          id?: string
          image_urls?: string[] | null
          location_lost?: string | null
          number_of_matches?: number | null
          rate_limit_count?: number | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_assistant_id?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"] | null
          color?: string | null
          confidence_score?: number | null
          created_at?: string
          date_lost?: string | null
          description?: string
          distinguishing_features?: string | null
          id?: string
          image_urls?: string[] | null
          location_lost?: string | null
          number_of_matches?: number | null
          rate_limit_count?: number | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_items: {
        Row: {
          added_by: string | null
          brand: string | null
          category: Database["public"]["Enums"]["item_category"]
          color: string | null
          created_at: string
          date_found: string | null
          description: string | null
          distinguishing_features: string | null
          id: string
          image_urls: string[] | null
          is_claimed: boolean | null
          location_found: string | null
          name: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string | null
          created_at?: string
          date_found?: string | null
          description?: string | null
          distinguishing_features?: string | null
          id?: string
          image_urls?: string[] | null
          is_claimed?: boolean | null
          location_found?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string | null
          created_at?: string
          date_found?: string | null
          description?: string | null
          distinguishing_features?: string | null
          id?: string
          image_urls?: string[] | null
          is_claimed?: boolean | null
          location_found?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          inquiry_id: string
          lost_item_id: string
          match_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          inquiry_id: string
          lost_item_id: string
          match_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          inquiry_id?: string
          lost_item_id?: string
          match_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_lost_item_id_fkey"
            columns: ["lost_item_id"]
            isOneToOne: false
            referencedRelation: "lost_items"
            referencedColumns: ["id"]
          },
        ]
      }
      potential_matches: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          inquiry_id: string
          is_approved: boolean | null
          lost_item_id: string
          match_reasons: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          inquiry_id: string
          is_approved?: boolean | null
          lost_item_id: string
          match_reasons?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          inquiry_id?: string
          is_approved?: boolean | null
          lost_item_id?: string
          match_reasons?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "potential_matches_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_matches_lost_item_id_fkey"
            columns: ["lost_item_id"]
            isOneToOne: false
            referencedRelation: "lost_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "assistant" | "admin"
      inquiry_status:
        | "submitted"
        | "under_review"
        | "matched"
        | "resolved"
        | "rejected"
      item_category:
        | "electronics"
        | "clothing"
        | "accessories"
        | "documents"
        | "keys"
        | "bags"
        | "other"
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
      app_role: ["user", "assistant", "admin"],
      inquiry_status: [
        "submitted",
        "under_review",
        "matched",
        "resolved",
        "rejected",
      ],
      item_category: [
        "electronics",
        "clothing",
        "accessories",
        "documents",
        "keys",
        "bags",
        "other",
      ],
    },
  },
} as const
