export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      collections: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          clerk_id: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          parent_id: string | null
          position: Json | null
          prototype_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          clerk_id?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          parent_id?: string | null
          position?: Json | null
          prototype_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          clerk_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          parent_id?: string | null
          position?: Json | null
          prototype_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          comment_replies: boolean
          comment_resolved: boolean
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          prototype_comments: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_replies?: boolean
          comment_resolved?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          prototype_comments?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_replies?: boolean
          comment_resolved?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          prototype_comments?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          clerk_id: string | null
          comment_id: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          prototype_id: string | null
          seen: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          clerk_id?: string | null
          comment_id?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prototype_id?: string | null
          seen?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          clerk_id?: string | null
          comment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prototype_id?: string | null
          seen?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          clerk_id: string | null
          created_at: string
          id: string
          name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          clerk_id?: string | null
          created_at?: string
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          clerk_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          clerk_id: string | null
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          clerk_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          clerk_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          role?: string
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
        ]
      }
      projects: {
        Row: {
          clerk_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          clerk_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          clerk_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      prototype_collections: {
        Row: {
          collection_id: string
          created_at: string
          prototype_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          prototype_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          prototype_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prototype_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_collections_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_feedback: {
        Row: {
          clerk_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          device_type: string | null
          element_metadata: Json | null
          element_selector: string | null
          element_xpath: string | null
          id: string
          position: Json | null
          prototype_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          device_type?: string | null
          element_metadata?: Json | null
          element_selector?: string | null
          element_xpath?: string | null
          id?: string
          position?: Json | null
          prototype_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          device_type?: string | null
          element_metadata?: Json | null
          element_selector?: string | null
          element_xpath?: string | null
          id?: string
          position?: Json | null
          prototype_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prototype_feedback_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_reactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          feedback_id: string | null
          id: string
          prototype_id: string | null
          reaction_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          feedback_id?: string | null
          id?: string
          prototype_id?: string | null
          reaction_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          feedback_id?: string | null
          id?: string
          prototype_id?: string | null
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "prototype_reactions_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "prototype_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_reactions_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_shares: {
        Row: {
          accessed_at: string | null
          clerk_id: string | null
          created_at: string
          email: string | null
          id: string
          is_link_share: boolean
          is_public: boolean
          permission: string
          prototype_id: string
          shared_by: string
        }
        Insert: {
          accessed_at?: string | null
          clerk_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_link_share?: boolean
          is_public?: boolean
          permission?: string
          prototype_id: string
          shared_by: string
        }
        Update: {
          accessed_at?: string | null
          clerk_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_link_share?: boolean
          is_public?: boolean
          permission?: string
          prototype_id?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "prototype_shares_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_tags: {
        Row: {
          clerk_id: string | null
          prototype_id: string
          tag_id: string
        }
        Insert: {
          clerk_id?: string | null
          prototype_id: string
          tag_id: string
        }
        Update: {
          clerk_id?: string | null
          prototype_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prototype_tags_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      prototypes: {
        Row: {
          bundle_path: string | null
          clerk_id: string | null
          created_at: string
          created_by: string
          deployment_metadata: Json | null
          deployment_provider: string | null
          deployment_status: string | null
          deployment_url: string | null
          figma_url: string | null
          file_path: string | null
          id: string
          name: string
          preview_description: string | null
          preview_image: string | null
          preview_title: string | null
          preview_url: string | null
          processed_at: string | null
          project_id: string | null
          sandbox_config: Json | null
          status: string | null
          type: string | null
          updated_at: string
          url: string
        }
        Insert: {
          bundle_path?: string | null
          clerk_id?: string | null
          created_at?: string
          created_by: string
          deployment_metadata?: Json | null
          deployment_provider?: string | null
          deployment_status?: string | null
          deployment_url?: string | null
          figma_url?: string | null
          file_path?: string | null
          id?: string
          name: string
          preview_description?: string | null
          preview_image?: string | null
          preview_title?: string | null
          preview_url?: string | null
          processed_at?: string | null
          project_id?: string | null
          sandbox_config?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          bundle_path?: string | null
          clerk_id?: string | null
          created_at?: string
          created_by?: string
          deployment_metadata?: Json | null
          deployment_provider?: string | null
          deployment_status?: string | null
          deployment_url?: string | null
          figma_url?: string | null
          file_path?: string | null
          id?: string
          name?: string
          preview_description?: string | null
          preview_image?: string | null
          preview_title?: string | null
          preview_url?: string | null
          processed_at?: string | null
          project_id?: string | null
          sandbox_config?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "prototypes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototypes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_project_with_owner: {
        Args: {
          p_name: string
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      get_clerk_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_clerk_user: {
        Args: {
          _table_clerk_id: string
        }
        Returns: boolean
      }
      get_current_user_clerk_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_profile_id_by_clerk_id: {
        Args: {
          _clerk_id: string
        }
        Returns: string
      }
      is_same_user_by_clerk_id: {
        Args: {
          _clerk_id: string
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
