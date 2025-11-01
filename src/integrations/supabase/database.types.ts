/* eslint-disable @typescript-eslint/no-empty-object-type */
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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      coffee_beans: {
        Row: {
          altitude: string | null
          brand: string
          created_at: string | null
          description: string | null
          flavor_notes: string[] | null
          harvest_date: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          origin: string | null
          price: number | null
          price_per_unit: string | null
          processing_method: string | null
          purchase_url: string | null
          region: string | null
          roast_date: string | null
          roast_level: string | null
          updated_at: string | null
          variety: string | null
        }
        Insert: {
          altitude?: string | null
          brand: string
          created_at?: string | null
          description?: string | null
          flavor_notes?: string[] | null
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          origin?: string | null
          price?: number | null
          price_per_unit?: string | null
          processing_method?: string | null
          purchase_url?: string | null
          region?: string | null
          roast_date?: string | null
          roast_level?: string | null
          updated_at?: string | null
          variety?: string | null
        }
        Update: {
          altitude?: string | null
          brand?: string
          created_at?: string | null
          description?: string | null
          flavor_notes?: string[] | null
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          origin?: string | null
          price?: number | null
          price_per_unit?: string | null
          processing_method?: string | null
          purchase_url?: string | null
          region?: string | null
          roast_date?: string | null
          roast_level?: string | null
          updated_at?: string | null
          variety?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          parent_id: string | null
          rating_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id?: string | null
          rating_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string | null
          rating_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          action_user_id: string
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string | null
          user_one_id: string
          user_two_id: string
        }
        Insert: {
          action_user_id: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string | null
          user_one_id: string
          user_two_id: string
        }
        Update: {
          action_user_id?: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string | null
          user_one_id?: string
          user_two_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          rating_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_likes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          acidity_rating: number | null
          aftertaste_rating: number | null
          aroma_rating: number | null
          balance_rating: number | null
          body_rating: number | null
          brew_ratio: string | null
          brewing_method: string | null
          coffee_bean_id: string | null
          created_at: string | null
          flavor_rating: number | null
          grind_size: string | null
          grinder: string | null
          id: string
          overall_rating: number
          review_text: string | null
          sweetness_rating: number | null
          updated_at: string | null
          user_id: string
          water_temp: number | null
        }
        Insert: {
          acidity_rating?: number | null
          aftertaste_rating?: number | null
          aroma_rating?: number | null
          balance_rating?: number | null
          body_rating?: number | null
          brew_ratio?: string | null
          brewing_method?: string | null
          coffee_bean_id?: string | null
          created_at?: string | null
          flavor_rating?: number | null
          grind_size?: string | null
          grinder?: string | null
          id?: string
          overall_rating: number
          review_text?: string | null
          sweetness_rating?: number | null
          updated_at?: string | null
          user_id: string
          water_temp?: number | null
        }
        Update: {
          acidity_rating?: number | null
          aftertaste_rating?: number | null
          aroma_rating?: number | null
          balance_rating?: number | null
          body_rating?: number | null
          brew_ratio?: string | null
          brewing_method?: string | null
          coffee_bean_id?: string | null
          created_at?: string | null
          flavor_rating?: number | null
          grind_size?: string | null
          grinder?: string | null
          id?: string
          overall_rating?: number
          review_text?: string | null
          sweetness_rating?: number | null
          updated_at?: string | null
          user_id?: string
          water_temp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ratings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_coffee_bean_id_fkey"
            columns: ["coffee_bean_id"]
            isOneToOne: false
            referencedRelation: "coffee_beans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          coffee_types: string[] | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          region: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          coffee_types?: string[] | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          region?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          coffee_types?: string[] | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          region?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          profile_image_url: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          profile_image_url?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_image_url?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: { Args: { p_user_id: string }; Returns: undefined }
      get_friends: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          friend_id: string
          friendship_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          user_id: string
          username: string
        }[]
      }
    }
    Enums: {
      friendship_status: "pending" | "accepted" | "blocked"
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
      friendship_status: ["pending", "accepted", "blocked"],
    },
  },
} as const
