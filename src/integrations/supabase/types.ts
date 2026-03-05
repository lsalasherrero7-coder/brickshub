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
      buyer_profiles: {
        Row: {
          bathrooms_min: number | null
          bedrooms_min: number | null
          budget_max: number | null
          budget_min: number | null
          contact_id: string
          created_at: string
          garage: string | null
          id: string
          preferred_floor: string | null
          preferred_zones: string[] | null
          property_type: string | null
          updated_at: string
        }
        Insert: {
          bathrooms_min?: number | null
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id: string
          created_at?: string
          garage?: string | null
          id?: string
          preferred_floor?: string | null
          preferred_zones?: string[] | null
          property_type?: string | null
          updated_at?: string
        }
        Update: {
          bathrooms_min?: number | null
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id?: string
          created_at?: string
          garage?: string | null
          id?: string
          preferred_floor?: string | null
          preferred_zones?: string[] | null
          property_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tasks: {
        Row: {
          contact_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          agent_id: string | null
          contact_type: string
          created_at: string
          email: string | null
          id: string
          last_name: string | null
          lead_id: string | null
          lead_status: string
          name: string
          phone: string | null
          property_id: string | null
          source_portal: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          last_name?: string | null
          lead_id?: string | null
          lead_status?: string
          name: string
          phone?: string | null
          property_id?: string | null
          source_portal?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          last_name?: string | null
          lead_id?: string | null
          lead_status?: string
          name?: string
          phone?: string | null
          property_id?: string | null
          source_portal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string
          advertiser_type: string
          agent_id: string | null
          created_at: string
          external_portal_id: string | null
          id: string
          lead_status: string
          listing_url: string | null
          name: string | null
          phone: string | null
          property_id: string | null
          source_portal: string
          updated_at: string
        }
        Insert: {
          address: string
          advertiser_type?: string
          agent_id?: string | null
          created_at?: string
          external_portal_id?: string | null
          id?: string
          lead_status?: string
          listing_url?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          source_portal?: string
          updated_at?: string
        }
        Update: {
          address?: string
          advertiser_type?: string
          agent_id?: string | null
          created_at?: string
          external_portal_id?: string | null
          id?: string
          lead_status?: string
          listing_url?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          source_portal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
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
      marketing_lead_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          lead_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          lead_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          lead_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "marketing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          assigned_agent_id: string | null
          campaign_id: string
          contact_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          next_action_date: string | null
          next_action_note: string | null
          next_action_type: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          campaign_id: string
          contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          next_action_date?: string | null
          next_action_note?: string | null
          next_action_type?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          campaign_id?: string
          contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          next_action_date?: string | null
          next_action_note?: string | null
          next_action_type?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          commission_pct: number | null
          created_at: string
          floor: string | null
          id: string
          listing_price: number | null
          min_price: number | null
          notes: string | null
          owner_dni: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          property_type: string
          status: string
          surface_area: number | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          commission_pct?: number | null
          created_at?: string
          floor?: string | null
          id?: string
          listing_price?: number | null
          min_price?: number | null
          notes?: string | null
          owner_dni?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          property_type?: string
          status?: string
          surface_area?: number | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          commission_pct?: number | null
          created_at?: string
          floor?: string | null
          id?: string
          listing_price?: number | null
          min_price?: number | null
          notes?: string | null
          owner_dni?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          property_type?: string
          status?: string
          surface_area?: number | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          custom_name: string | null
          document_type: string
          file_name: string
          file_url: string
          id: string
          property_id: string
          uploaded_at: string
        }
        Insert: {
          custom_name?: string | null
          document_type: string
          file_name: string
          file_url: string
          id?: string
          property_id: string
          uploaded_at?: string
        }
        Update: {
          custom_name?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          property_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          file_name: string
          file_url: string
          id: string
          property_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          property_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          property_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          client_first_name: string
          client_last_name: string
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          property_id: string
          status: string
          visit_date: string
        }
        Insert: {
          client_first_name: string
          client_last_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          status?: string
          visit_date: string
        }
        Update: {
          client_first_name?: string
          client_last_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          status?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
