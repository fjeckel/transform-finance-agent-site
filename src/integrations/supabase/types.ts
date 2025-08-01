export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      download_tokens: {
        Row: {
          created_at: string | null
          download_count: number | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_accessed_at: string | null
          max_downloads: number | null
          purchase_id: string | null
          token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_accessed_at?: string | null
          max_downloads?: number | null
          purchase_id?: string | null
          token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_accessed_at?: string | null
          max_downloads?: number | null
          purchase_id?: string | null
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_tokens_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      downloadable_pdfs: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          download_count: number | null
          file_size: number | null
          file_url: string
          id: string
          image_url: string | null
          is_premium: boolean | null
          is_public: boolean | null
          price: number | null
          status: string | null
          stripe_price_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_public?: boolean | null
          price?: number | null
          status?: string | null
          stripe_price_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_public?: boolean | null
          price?: number | null
          status?: string | null
          stripe_price_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloadable_pdfs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_guests: {
        Row: {
          created_at: string | null
          episode_id: string
          guest_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          episode_id: string
          guest_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          episode_id?: string
          guest_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_guests_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_guests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_platforms: {
        Row: {
          created_at: string | null
          episode_id: string
          id: string
          platform_name: string
          platform_url: string
        }
        Insert: {
          created_at?: string | null
          episode_id: string
          id?: string
          platform_name: string
          platform_url: string
        }
        Update: {
          created_at?: string | null
          episode_id?: string
          id?: string
          platform_name?: string
          platform_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_platforms_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: string | null
          episode_number: number
          id: string
          image_url: string | null
          publish_date: string | null
          season: number | null
          series: Database["public"]["Enums"]["podcast_series"] | null
          slug: string
          status: Database["public"]["Enums"]["episode_status"] | null
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          episode_number: number
          id?: string
          image_url?: string | null
          publish_date?: string | null
          season?: number | null
          series?: Database["public"]["Enums"]["podcast_series"] | null
          slug: string
          status?: Database["public"]["Enums"]["episode_status"] | null
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          episode_number?: number
          id?: string
          image_url?: string | null
          publish_date?: string | null
          season?: number | null
          series?: Database["public"]["Enums"]["podcast_series"] | null
          slug?: string
          status?: Database["public"]["Enums"]["episode_status"] | null
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          book_author: string | null
          book_isbn: string | null
          book_publication_year: number | null
          book_title: string | null
          category: string | null
          category_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          insight_type: Database["public"]["Enums"]["insight_type"]
          keywords: string[] | null
          published_at: string | null
          reading_time_minutes: number | null
          slug: string
          status: Database["public"]["Enums"]["insight_status"]
          subtitle: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          book_author?: string | null
          book_isbn?: string | null
          book_publication_year?: number | null
          book_title?: string | null
          category?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          insight_type?: Database["public"]["Enums"]["insight_type"]
          keywords?: string[] | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          status?: Database["public"]["Enums"]["insight_status"]
          subtitle?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          book_author?: string | null
          book_isbn?: string | null
          book_publication_year?: number | null
          book_title?: string | null
          category?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          insight_type?: Database["public"]["Enums"]["insight_type"]
          keywords?: string[] | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["insight_status"]
          subtitle?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "insights_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      main_page_sections: {
        Row: {
          background_color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          section_key: string
          section_type: string
          sort_order: number | null
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          section_key: string
          section_type?: string
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          section_type?: string
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_visit_logs: {
        Row: {
          id: string
          page: string
          user_id: string | null
          visited_at: string | null
        }
        Insert: {
          id?: string
          page: string
          user_id?: string | null
          visited_at?: string | null
        }
        Update: {
          id?: string
          page?: string
          user_id?: string | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_visit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_analytics: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processing_time_ms: number | null
          purchase_id: string | null
          session_id: string | null
          success: boolean | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processing_time_ms?: number | null
          purchase_id?: string | null
          session_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processing_time_ms?: number | null
          purchase_id?: string | null
          session_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          conversion_source: string | null
          created_at: string | null
          currency: string | null
          customer_country: string | null
          failed_attempts: number | null
          id: string
          payment_method_types: string[] | null
          pdf_id: string | null
          processing_time_ms: number | null
          purchased_at: string | null
          refunded_at: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          conversion_source?: string | null
          created_at?: string | null
          currency?: string | null
          customer_country?: string | null
          failed_attempts?: number | null
          id?: string
          payment_method_types?: string[] | null
          pdf_id?: string | null
          processing_time_ms?: number | null
          purchased_at?: string | null
          refunded_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          conversion_source?: string | null
          created_at?: string | null
          currency?: string | null
          customer_country?: string | null
          failed_attempts?: number | null
          id?: string
          payment_method_types?: string[] | null
          pdf_id?: string | null
          processing_time_ms?: number | null
          purchased_at?: string | null
          refunded_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "downloadable_pdfs"
            referencedColumns: ["id"]
          },
        ]
      }
      section_configurations: {
        Row: {
          config_key: string
          config_value: string
          created_at: string
          id: string
          section_id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string
          id?: string
          section_id: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string
          id?: string
          section_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_configurations_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "main_page_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      section_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string
          created_at: string
          id: string
          metadata: Json | null
          section_id: string
          updated_at: string
        }
        Insert: {
          content_key: string
          content_type: string
          content_value: string
          created_at?: string
          id?: string
          metadata?: Json | null
          section_id: string
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          section_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_content_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "main_page_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      section_links: {
        Row: {
          color: string | null
          created_at: string
          display_text: string | null
          icon: string | null
          id: string
          link_type: string
          platform_name: string
          section_id: string
          sort_order: number | null
          updated_at: string
          url: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_text?: string | null
          icon?: string | null
          id?: string
          link_type: string
          platform_name: string
          section_id: string
          sort_order?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_text?: string | null
          icon?: string | null
          id?: string
          link_type?: string
          platform_name?: string
          section_id?: string
          sort_order?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_links_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "main_page_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      show_notes: {
        Row: {
          content: string | null
          created_at: string | null
          episode_id: string
          id: string
          sort_order: number | null
          timestamp: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          episode_id: string
          id?: string
          sort_order?: number | null
          timestamp: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          episode_id?: string
          id?: string
          sort_order?: number | null
          timestamp?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_notes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_name: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          retry_count: number | null
          status: string
          stripe_event_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          retry_count?: number | null
          status?: string
          stripe_event_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          retry_count?: number | null
          status?: string
          stripe_event_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_download_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { pdf_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member" | "guest"
      episode_status: "draft" | "published" | "archived" | "scheduled"
      insight_status: "draft" | "published" | "archived" | "scheduled"
      insight_type: "book_summary" | "blog_article" | "guide" | "case_study"
      podcast_series: "wtf" | "finance_transformers" | "cfo_memo"
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
      app_role: ["admin", "member", "guest"],
      episode_status: ["draft", "published", "archived", "scheduled"],
      insight_status: ["draft", "published", "archived", "scheduled"],
      insight_type: ["book_summary", "blog_article", "guide", "case_study"],
      podcast_series: ["wtf", "finance_transformers", "cfo_memo"],
    },
  },
} as const
