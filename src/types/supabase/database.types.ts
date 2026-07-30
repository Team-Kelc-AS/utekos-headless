export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  marketing: {
    Tables: {
      attribution_events: {
        Row: {
          anonymous_id: string | null
          campaign: string | null
          content: string | null
          created_at: string
          id: string
          landing_path: string | null
          lead_id: string | null
          medium: string | null
          metadata: Json
          referrer: string | null
          source: string | null
          term: string | null
          user_agent: string | null
        }
        Insert: {
          anonymous_id?: string | null
          campaign?: string | null
          content?: string | null
          created_at?: string
          id?: string
          landing_path?: string | null
          lead_id?: string | null
          medium?: string | null
          metadata?: Json
          referrer?: string | null
          source?: string | null
          term?: string | null
          user_agent?: string | null
        }
        Update: {
          anonymous_id?: string | null
          campaign?: string | null
          content?: string | null
          created_at?: string
          id?: string
          landing_path?: string | null
          lead_id?: string | null
          medium?: string | null
          metadata?: Json
          referrer?: string | null
          source?: string | null
          term?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attribution_events_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      consent_snapshots: {
        Row: {
          anonymous_id: string | null
          categories: Json
          created_at: string
          external_id: string | null
          id: string
          occurred_at: string
          source: string
        }
        Insert: {
          anonymous_id?: string | null
          categories?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          occurred_at?: string
          source?: string
        }
        Update: {
          anonymous_id?: string | null
          categories?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          occurred_at?: string
          source?: string
        }
        Relationships: []
      }
      event_ledger: {
        Row: {
          anonymous_id: string | null
          consent: Json
          created_at: string
          event_id: string
          event_name: string
          external_id: string | null
          id: string
          idempotency_key: string
          occurred_at: string
          payload: Json
          source_url: string | null
          user_data_quality: Json
        }
        Insert: {
          anonymous_id?: string | null
          consent?: Json
          created_at?: string
          event_id: string
          event_name: string
          external_id?: string | null
          id?: string
          idempotency_key: string
          occurred_at: string
          payload?: Json
          source_url?: string | null
          user_data_quality?: Json
        }
        Update: {
          anonymous_id?: string | null
          consent?: Json
          created_at?: string
          event_id?: string
          event_name?: string
          external_id?: string | null
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payload?: Json
          source_url?: string | null
          user_data_quality?: Json
        }
        Relationships: []
      }
      canonical_event_source_evidence: {
        Row: {
          canonical_event_id: string
          canonical_event_name: string
          canonical_idempotency_key: string
          created_at: string
          id: string
          observation_count: number
          observation_key: string
          source_api_version: string
          source_delivery_id: string | null
          source_event_id: string | null
          source_method: string
          source_object_id: string
          source_object_type: string
          source_observed_at: string
          source_system: string
          source_topic: string
          source_triggered_at: string
          updated_at: string
        }
        Insert: {
          canonical_event_id: string
          canonical_event_name: string
          canonical_idempotency_key: string
          created_at?: string
          id?: string
          observation_count?: number
          observation_key: string
          source_api_version: string
          source_delivery_id?: string | null
          source_event_id?: string | null
          source_method: string
          source_object_id: string
          source_object_type: string
          source_observed_at: string
          source_system: string
          source_topic: string
          source_triggered_at: string
          updated_at?: string
        }
        Update: {
          canonical_event_id?: string
          canonical_event_name?: string
          canonical_idempotency_key?: string
          created_at?: string
          id?: string
          observation_count?: number
          observation_key?: string
          source_api_version?: string
          source_delivery_id?: string | null
          source_event_id?: string | null
          source_method?: string
          source_object_id?: string
          source_object_type?: string
          source_observed_at?: string
          source_system?: string
          source_topic?: string
          source_triggered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'canonical_event_source_evidence_ledger_fkey'
            columns: ['canonical_idempotency_key']
            isOneToOne: false
            referencedRelation: 'event_ledger'
            referencedColumns: ['idempotency_key']
          }
        ]
      }
      leads: {
        Row: {
          campaign: string | null
          consent_marketing: boolean
          consent_source: string | null
          consented_at: string | null
          content: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          medium: string | null
          metadata: Json
          phone: string | null
          source: string
          term: string | null
          updated_at: string
        }
        Insert: {
          campaign?: string | null
          consent_marketing?: boolean
          consent_source?: string | null
          consented_at?: string | null
          content?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          medium?: string | null
          metadata?: Json
          phone?: string | null
          source?: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          campaign?: string | null
          consent_marketing?: boolean
          consent_source?: string | null
          consented_at?: string | null
          content?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          medium?: string | null
          metadata?: Json
          phone?: string | null
          source?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meta_quality_snapshots: {
        Row: {
          created_at: string
          data_freshness: Json
          dataset_id: string
          dedup_key_feedback: Json
          event_coverage: number | null
          event_match_quality: number | null
          event_name: string | null
          id: string
          measured_at: string
          raw_payload: Json
        }
        Insert: {
          created_at?: string
          data_freshness?: Json
          dataset_id: string
          dedup_key_feedback?: Json
          event_coverage?: number | null
          event_match_quality?: number | null
          event_name?: string | null
          id?: string
          measured_at?: string
          raw_payload?: Json
        }
        Update: {
          created_at?: string
          data_freshness?: Json
          dataset_id?: string
          dedup_key_feedback?: Json
          event_coverage?: number | null
          event_match_quality?: number | null
          event_name?: string | null
          id?: string
          measured_at?: string
          raw_payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      dead_letter_summary: {
        Row: {
          latest_created_at: string | null
          latest_resolved_at: string | null
          reason: string | null
          source: string | null
          total_count: number | null
          unresolved_count: number | null
        }
        Relationships: []
      }
      provider_dispatch_health: {
        Row: {
          dispatch_mode: string | null
          last_processed_at: string | null
          last_updated_at: string | null
          provider: string | null
          row_count: number | null
          skip_reason: string | null
          status: string | null
        }
        Relationships: []
      }
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
  ops: {
    Tables: {
      dead_letter_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          payload: Json
          reason: string
          resolution_code: string | null
          resolution_note: string | null
          resolved_by: string | null
          resolved_at: string | null
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          payload?: Json
          reason: string
          resolution_code?: string | null
          resolution_note?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          payload?: Json
          reason?: string
          resolution_code?: string | null
          resolution_note?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          source?: string
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
      provider_dispatch_attempts: {
        Row: {
          attempt_count: number
          consent_basis: Json
          created_at: string
          data_quality: Json
          dispatch_mode: string
          event_id: string | null
          event_name: string | null
          id: string
          idempotency_key: string
          last_attempt_started_at: string | null
          last_error: string | null
          latency_ms: number | null
          next_attempt_at: string | null
          payload: Json
          processed_at: string | null
          provider: string
          response: Json
          skip_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          consent_basis?: Json
          created_at?: string
          data_quality?: Json
          dispatch_mode?: string
          event_id?: string | null
          event_name?: string | null
          id?: string
          idempotency_key: string
          last_attempt_started_at?: string | null
          last_error?: string | null
          latency_ms?: number | null
          next_attempt_at?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          response?: Json
          skip_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          consent_basis?: Json
          created_at?: string
          data_quality?: Json
          dispatch_mode?: string
          event_id?: string | null
          event_name?: string | null
          id?: string
          idempotency_key?: string
          last_attempt_started_at?: string | null
          last_error?: string | null
          latency_ms?: number | null
          next_attempt_at?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          response?: Json
          skip_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      slo_incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          incident_key: string
          metadata: Json
          opened_at: string
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
          workload: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          incident_key: string
          metadata?: Json
          opened_at?: string
          resolved_at?: string | null
          severity: string
          status?: string
          updated_at?: string
          workload: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          incident_key?: string
          metadata?: Json
          opened_at?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          workload?: string
        }
        Relationships: []
      }
      web_vitals: {
        Row: {
          attribution: Json | null
          created_at: string
          delta: number | null
          entries: Json
          href: string | null
          id: string
          metric_id: string
          name: string
          navigation_type: string | null
          pathname: string | null
          rating: string | null
          referrer: string | null
          reported_at: string
          value: number
        }
        Insert: {
          attribution?: Json | null
          created_at?: string
          delta?: number | null
          entries?: Json
          href?: string | null
          id?: string
          metric_id: string
          name: string
          navigation_type?: string | null
          pathname?: string | null
          rating?: string | null
          referrer?: string | null
          reported_at: string
          value: number
        }
        Update: {
          attribution?: Json | null
          created_at?: string
          delta?: number | null
          entries?: Json
          href?: string | null
          id?: string
          metric_id?: string
          name?: string
          navigation_type?: string | null
          pathname?: string | null
          rating?: string | null
          referrer?: string | null
          reported_at?: string
          value?: number
        }
        Relationships: []
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
  partner: {
    Tables: {
      referrals: {
        Row: {
          anonymous_id: string | null
          created_at: string
          id: string
          landing_path: string | null
          metadata: Json
          partner_source_id: string | null
          referrer: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          landing_path?: string | null
          metadata?: Json
          partner_source_id?: string | null
          referrer?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          landing_path?: string | null
          metadata?: Json
          partner_source_id?: string | null
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'referrals_partner_source_id_fkey'
            columns: ['partner_source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  marketing: {
    Enums: {}
  },
  ops: {
    Enums: {}
  },
  partner: {
    Enums: {}
  }
} as const
