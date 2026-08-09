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
            foreignKeyName: "attribution_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_insights: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number
          cpc: number | null
          created_at: string
          ctr: number | null
          date_start: string
          date_stop: string
          demographics: Json
          fetched_at: string
          id: string
          impressions: number
          raw_payload: Json
          roas: number | null
          spend: number
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date_start: string
          date_stop: string
          demographics?: Json
          fetched_at?: string
          id?: string
          impressions?: number
          raw_payload?: Json
          roas?: number | null
          spend?: number
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date_start?: string
          date_stop?: string
          demographics?: Json
          fetched_at?: string
          id?: string
          impressions?: number
          raw_payload?: Json
          roas?: number | null
          spend?: number
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
            foreignKeyName: "canonical_event_source_evidence_ledger_fkey"
            columns: ["canonical_idempotency_key"]
            isOneToOne: false
            referencedRelation: "event_ledger"
            referencedColumns: ["idempotency_key"]
          },
        ]
      }
      checkout_attribution_lookup_tokens: {
        Row: {
          first_seen_at: string
          snapshot_id: string
          token: string
          token_kind: string
          updated_at: string
        }
        Insert: {
          first_seen_at?: string
          snapshot_id: string
          token: string
          token_kind?: string
          updated_at?: string
        }
        Update: {
          first_seen_at?: string
          snapshot_id?: string
          token?: string
          token_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_attribution_lookup_tokens_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "checkout_attribution_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_attribution_snapshots: {
        Row: {
          captured_at: string
          cart_id: string | null
          checkout_url: string | null
          client_ip_address: string | null
          client_user_agent: string | null
          consent_provenance: Json
          dclid: string | null
          email_hash: string | null
          event_id: string | null
          external_id: string | null
          fbc: string | null
          fbp: string | null
          first_seen_at: string
          ga_client_id: string | null
          ga_session_id: string | null
          gbraid: string | null
          gclid: string | null
          id: string
          idempotency_key: string
          msclkid: string | null
          primary_storage_token: string | null
          raw_payload: Json
          storage_tokens: string[]
          updated_at: string
          user_data: Json
          user_data_quality: Json
          wbraid: string | null
        }
        Insert: {
          captured_at: string
          cart_id?: string | null
          checkout_url?: string | null
          client_ip_address?: string | null
          client_user_agent?: string | null
          consent_provenance?: Json
          dclid?: string | null
          email_hash?: string | null
          event_id?: string | null
          external_id?: string | null
          fbc?: string | null
          fbp?: string | null
          first_seen_at?: string
          ga_client_id?: string | null
          ga_session_id?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          idempotency_key: string
          msclkid?: string | null
          primary_storage_token?: string | null
          raw_payload?: Json
          storage_tokens?: string[]
          updated_at?: string
          user_data?: Json
          user_data_quality?: Json
          wbraid?: string | null
        }
        Update: {
          captured_at?: string
          cart_id?: string | null
          checkout_url?: string | null
          client_ip_address?: string | null
          client_user_agent?: string | null
          consent_provenance?: Json
          dclid?: string | null
          email_hash?: string | null
          event_id?: string | null
          external_id?: string | null
          fbc?: string | null
          fbp?: string | null
          first_seen_at?: string
          ga_client_id?: string | null
          ga_session_id?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          idempotency_key?: string
          msclkid?: string | null
          primary_storage_token?: string | null
          raw_payload?: Json
          storage_tokens?: string[]
          updated_at?: string
          user_data?: Json
          user_data_quality?: Json
          wbraid?: string | null
        }
        Relationships: []
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
      customer_identity_links: {
        Row: {
          email_match: boolean
          link_id: number
          linked_at: string
          match_method: string
          phone_match: boolean
          shopify_candidate_count: number
          shopify_customer_id: string | null
          source_candidate_count: number
          source_identity_id: number
          status: string
        }
        Insert: {
          email_match?: boolean
          link_id?: never
          linked_at?: string
          match_method: string
          phone_match?: boolean
          shopify_candidate_count: number
          shopify_customer_id?: string | null
          source_candidate_count: number
          source_identity_id: number
          status: string
        }
        Update: {
          email_match?: boolean
          link_id?: never
          linked_at?: string
          match_method?: string
          phone_match?: boolean
          shopify_candidate_count?: number
          shopify_customer_id?: string | null
          source_candidate_count?: number
          source_identity_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_identity_links_shopify_customer_id_fkey"
            columns: ["shopify_customer_id"]
            isOneToOne: false
            referencedRelation: "meta_customer_audience"
            referencedColumns: ["shopify_customer_id"]
          },
          {
            foreignKeyName: "customer_identity_links_shopify_customer_id_fkey"
            columns: ["shopify_customer_id"]
            isOneToOne: false
            referencedRelation: "shopify_customers"
            referencedColumns: ["shopify_customer_id"]
          },
          {
            foreignKeyName: "customer_identity_links_shopify_customer_id_fkey"
            columns: ["shopify_customer_id"]
            isOneToOne: false
            referencedRelation: "shopify_customers_overview"
            referencedColumns: ["shopify_customer_id"]
          },
          {
            foreignKeyName: "customer_identity_links_source_identity_id_fkey"
            columns: ["source_identity_id"]
            isOneToOne: false
            referencedRelation: "customer_source_meta_2025"
            referencedColumns: ["source_identity_id"]
          },
          {
            foreignKeyName: "customer_identity_links_source_identity_id_fkey"
            columns: ["source_identity_id"]
            isOneToOne: false
            referencedRelation: "meta_customer_audience"
            referencedColumns: ["source_identity_id"]
          },
        ]
      }
      customer_source_meta_2025: {
        Row: {
          address_conflict: boolean
          age_source: number | null
          country: string | null
          created_at: string
          ct: string | null
          dob: string | null
          dob_year_conflict: boolean
          doby_source: number | null
          email_normalized: string | null
          fn: string | null
          gen: string | null
          identity_key: string
          ln: string | null
          name_conflict: boolean
          phone_e164: string | null
          raw_row_count: number
          source_currency: string
          source_identity_id: number
          source_row_numbers: number[]
          source_value: number | null
          zip: string | null
        }
        Insert: {
          address_conflict: boolean
          age_source?: number | null
          country?: string | null
          created_at?: string
          ct?: string | null
          dob?: string | null
          dob_year_conflict: boolean
          doby_source?: number | null
          email_normalized?: string | null
          fn?: string | null
          gen?: string | null
          identity_key: string
          ln?: string | null
          name_conflict: boolean
          phone_e164?: string | null
          raw_row_count: number
          source_currency?: string
          source_identity_id?: never
          source_row_numbers: number[]
          source_value?: number | null
          zip?: string | null
        }
        Update: {
          address_conflict?: boolean
          age_source?: number | null
          country?: string | null
          created_at?: string
          ct?: string | null
          dob?: string | null
          dob_year_conflict?: boolean
          doby_source?: number | null
          email_normalized?: string | null
          fn?: string | null
          gen?: string | null
          identity_key?: string
          ln?: string | null
          name_conflict?: boolean
          phone_e164?: string | null
          raw_row_count?: number
          source_currency?: string
          source_identity_id?: never
          source_row_numbers?: number[]
          source_value?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      customer_source_meta_2025_raw: {
        Row: {
          age_raw: string | null
          country: string | null
          ct: string | null
          dob_raw: string | null
          doby_raw: string | null
          email: string | null
          email_normalized: string | null
          fn: string | null
          gen_raw: string | null
          imported_at: string
          ln: string | null
          phone: string | null
          phone_e164: string | null
          raw_id: number
          source_exported_on: string
          source_file_name: string
          source_row_number: number
          value_raw: string | null
          zip: string | null
        }
        Insert: {
          age_raw?: string | null
          country?: string | null
          ct?: string | null
          dob_raw?: string | null
          doby_raw?: string | null
          email?: string | null
          email_normalized?: string | null
          fn?: string | null
          gen_raw?: string | null
          imported_at?: string
          ln?: string | null
          phone?: string | null
          phone_e164?: string | null
          raw_id?: never
          source_exported_on: string
          source_file_name: string
          source_row_number: number
          value_raw?: string | null
          zip?: string | null
        }
        Update: {
          age_raw?: string | null
          country?: string | null
          ct?: string | null
          dob_raw?: string | null
          doby_raw?: string | null
          email?: string | null
          email_normalized?: string | null
          fn?: string | null
          gen_raw?: string | null
          imported_at?: string
          ln?: string | null
          phone?: string | null
          phone_e164?: string | null
          raw_id?: never
          source_exported_on?: string
          source_file_name?: string
          source_row_number?: number
          value_raw?: string | null
          zip?: string | null
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
      meta_ad_creative_destinations: {
        Row: {
          account_id: string
          ad_created_time: string
          ad_id: string
          ad_updated_time: string
          api_version: string
          created_at: string
          creative_id: string
          destination_fingerprint: string
          destination_url: string | null
          dynamic_resolution_status: string
          effective_from: string | null
          effective_period_basis: string
          effective_status: string
          effective_until: string | null
          id: string
          normalized_destination_url: string | null
          observed_from: string
          observed_through: string
          observed_until: string | null
          observed_version: string
          source_kind: string
          source_path: string
          updated_at: string
          url_tags: string | null
        }
        Insert: {
          account_id: string
          ad_created_time: string
          ad_id: string
          ad_updated_time: string
          api_version?: string
          created_at?: string
          creative_id: string
          destination_fingerprint: string
          destination_url?: string | null
          dynamic_resolution_status: string
          effective_from?: string | null
          effective_period_basis?: string
          effective_status: string
          effective_until?: string | null
          id?: string
          normalized_destination_url?: string | null
          observed_from: string
          observed_through: string
          observed_until?: string | null
          observed_version: string
          source_kind: string
          source_path: string
          updated_at?: string
          url_tags?: string | null
        }
        Update: {
          account_id?: string
          ad_created_time?: string
          ad_id?: string
          ad_updated_time?: string
          api_version?: string
          created_at?: string
          creative_id?: string
          destination_fingerprint?: string
          destination_url?: string | null
          dynamic_resolution_status?: string
          effective_from?: string | null
          effective_period_basis?: string
          effective_status?: string
          effective_until?: string | null
          id?: string
          normalized_destination_url?: string | null
          observed_from?: string
          observed_through?: string
          observed_until?: string | null
          observed_version?: string
          source_kind?: string
          source_path?: string
          updated_at?: string
          url_tags?: string | null
        }
        Relationships: []
      }
      meta_ad_delivery_insights: {
        Row: {
          account_id: string
          account_timezone: string
          action_report_time: string
          ad_id: string
          ad_name: string | null
          adset_id: string
          adset_name: string | null
          api_version: string
          attribution_setting: string
          breakdown_kind: string
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          created_at: string
          device_platform: string | null
          dimension_key: string
          fetched_at: string
          id: string
          impression_device: string | null
          impressions: number | null
          insight_date: string
          landing_page_views: number | null
          link_clicks: number | null
          metric_availability: Json
          outbound_clicks: number | null
          platform_position: string | null
          publisher_platform: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          account_timezone: string
          action_report_time: string
          ad_id: string
          ad_name?: string | null
          adset_id: string
          adset_name?: string | null
          api_version: string
          attribution_setting: string
          breakdown_kind: string
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          created_at?: string
          device_platform?: string | null
          dimension_key: string
          fetched_at: string
          id?: string
          impression_device?: string | null
          impressions?: number | null
          insight_date: string
          landing_page_views?: number | null
          link_clicks?: number | null
          metric_availability: Json
          outbound_clicks?: number | null
          platform_position?: string | null
          publisher_platform?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_timezone?: string
          action_report_time?: string
          ad_id?: string
          ad_name?: string | null
          adset_id?: string
          adset_name?: string | null
          api_version?: string
          attribution_setting?: string
          breakdown_kind?: string
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          created_at?: string
          device_platform?: string | null
          dimension_key?: string
          fetched_at?: string
          id?: string
          impression_device?: string | null
          impressions?: number | null
          insight_date?: string
          landing_page_views?: number | null
          link_clicks?: number | null
          metric_availability?: Json
          outbound_clicks?: number | null
          platform_position?: string | null
          publisher_platform?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meta_high_value_customer_audience_additions_20260731: {
        Row: {
          age: number | null
          country: string
          ct: string | null
          dob: string | null
          doby: string | null
          email: string | null
          fn: string | null
          gen: string | null
          ln: string | null
          phone: string | null
          shopify_created_at: string
          shopify_customer_id: string
          snapshot_created_at: string
          st: string | null
          value: number
          zip: string | null
        }
        Insert: {
          age?: number | null
          country: string
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          shopify_created_at: string
          shopify_customer_id: string
          snapshot_created_at?: string
          st?: string | null
          value: number
          zip?: string | null
        }
        Update: {
          age?: number | null
          country?: string
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          shopify_created_at?: string
          shopify_customer_id?: string
          snapshot_created_at?: string
          st?: string | null
          value?: number
          zip?: string | null
        }
        Relationships: []
      }
      meta_high_value_customer_profiles: {
        Row: {
          age: number | null
          country: string
          ct: string | null
          dob: string | null
          doby: string | null
          email: string | null
          fn: string | null
          gen: string | null
          ln: string | null
          phone: string | null
          refreshed_at: string
          shopify_customer_id: string
          source_identity_id: number | null
          st: string | null
          value: number
          zip: string | null
        }
        Insert: {
          age?: number | null
          country: string
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          refreshed_at?: string
          shopify_customer_id: string
          source_identity_id?: number | null
          st?: string | null
          value: number
          zip?: string | null
        }
        Update: {
          age?: number | null
          country?: string
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          refreshed_at?: string
          shopify_customer_id?: string
          source_identity_id?: number | null
          st?: string | null
          value?: number
          zip?: string | null
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
      shopify_customer_emails_over_500: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      shopify_customers: {
        Row: {
          currency_code: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          orders_count: number
          phone: string | null
          phone_e164: string | null
          shopify_created_at: string
          shopify_customer_id: string
          shopify_updated_at: string | null
          synced_at: string
          total_spent: number
        }
        Insert: {
          currency_code?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          orders_count?: number
          phone?: string | null
          phone_e164?: string | null
          shopify_created_at: string
          shopify_customer_id: string
          shopify_updated_at?: string | null
          synced_at?: string
          total_spent?: number
        }
        Update: {
          currency_code?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          orders_count?: number
          phone?: string | null
          phone_e164?: string | null
          shopify_created_at?: string
          shopify_customer_id?: string
          shopify_updated_at?: string | null
          synced_at?: string
          total_spent?: number
        }
        Relationships: []
      }
      website_visitor_events: {
        Row: {
          created_at: string
          id: string
          occurred_at: string
          pathname: string | null
          referrer: string | null
          session_id: string | null
          source_project: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          occurred_at: string
          pathname?: string | null
          referrer?: string | null
          session_id?: string | null
          source_project?: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          occurred_at?: string
          pathname?: string | null
          referrer?: string | null
          session_id?: string | null
          source_project?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      meta_customer_audience: {
        Row: {
          age: number | null
          country: string | null
          ct: string | null
          demographic_match_status: string | null
          dob: string | null
          doby: number | null
          email: string | null
          fn: string | null
          gen: string | null
          ln: string | null
          phone: string | null
          shopify_customer_id: string | null
          source_identity_id: number | null
          st: string | null
          value: number | null
          zip: string | null
        }
        Relationships: []
      }
      meta_high_value_customer_audience_additions_20260731_export: {
        Row: {
          age: number | null
          country: string | null
          ct: string | null
          dob: string | null
          doby: string | null
          email: string | null
          fn: string | null
          gen: string | null
          ln: string | null
          phone: string | null
          st: string | null
          value: number | null
          zip: string | null
        }
        Insert: {
          age?: number | null
          country?: string | null
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          st?: string | null
          value?: number | null
          zip?: string | null
        }
        Update: {
          age?: number | null
          country?: string | null
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          st?: string | null
          value?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      meta_high_value_customer_audience_export: {
        Row: {
          age: number | null
          country: string | null
          ct: string | null
          dob: string | null
          doby: string | null
          email: string | null
          fn: string | null
          gen: string | null
          ln: string | null
          phone: string | null
          st: string | null
          value: number | null
          zip: string | null
        }
        Insert: {
          age?: number | null
          country?: string | null
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          st?: string | null
          value?: number | null
          zip?: string | null
        }
        Update: {
          age?: number | null
          country?: string | null
          ct?: string | null
          dob?: string | null
          doby?: string | null
          email?: string | null
          fn?: string | null
          gen?: string | null
          ln?: string | null
          phone?: string | null
          st?: string | null
          value?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      shopify_customers_overview: {
        Row: {
          currency_code: string | null
          customer_name: string | null
          email: string | null
          orders_count: number | null
          phone: string | null
          phone_e164: string | null
          shopify_created_at: string | null
          shopify_customer_id: string | null
          shopify_updated_at: string | null
          synced_at: string | null
          total_spent: number | null
        }
        Insert: {
          currency_code?: string | null
          customer_name?: never
          email?: string | null
          orders_count?: number | null
          phone?: string | null
          phone_e164?: string | null
          shopify_created_at?: string | null
          shopify_customer_id?: string | null
          shopify_updated_at?: string | null
          synced_at?: string | null
          total_spent?: number | null
        }
        Update: {
          currency_code?: string | null
          customer_name?: never
          email?: string | null
          orders_count?: number | null
          phone?: string | null
          phone_e164?: string | null
          shopify_created_at?: string | null
          shopify_customer_id?: string | null
          shopify_updated_at?: string | null
          synced_at?: string | null
          total_spent?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      meta_state_from_norwegian_location: {
        Args: { city: string; postal_code: string }
        Returns: string
      }
      refresh_meta_high_value_customer_audience: {
        Args: never
        Returns: number
      }
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
      abandoned_checkout_recovery_dispatches: {
        Row: {
          attempt_count: number
          checkout_created_at: string
          checkout_updated_at: string
          created_at: string
          due_at: string
          id: string
          last_error: string | null
          next_attempt_at: string
          processing_expires_at: string | null
          processing_owner: string | null
          processing_started_at: string | null
          resend_email_id: string | null
          sent_at: string | null
          sequence_version: number
          shopify_abandoned_checkout_id: string
          shopify_customer_id: string | null
          status: string
          step: number
          suppressed_at: string | null
          suppression_reason: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          checkout_created_at: string
          checkout_updated_at: string
          created_at?: string
          due_at: string
          id?: string
          last_error?: string | null
          next_attempt_at: string
          processing_expires_at?: string | null
          processing_owner?: string | null
          processing_started_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          sequence_version?: number
          shopify_abandoned_checkout_id: string
          shopify_customer_id?: string | null
          status?: string
          step: number
          suppressed_at?: string | null
          suppression_reason?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          checkout_created_at?: string
          checkout_updated_at?: string
          created_at?: string
          due_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          processing_expires_at?: string | null
          processing_owner?: string | null
          processing_started_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          sequence_version?: number
          shopify_abandoned_checkout_id?: string
          shopify_customer_id?: string | null
          status?: string
          step?: number
          suppressed_at?: string | null
          suppression_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dead_letter_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          payload: Json
          reason: string
          resolution_code: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
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
          resolved_at?: string | null
          resolved_by?: string | null
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
          resolved_at?: string | null
          resolved_by?: string | null
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
      integration_job_leases: {
        Row: {
          acquired_at: string
          expires_at: string
          job_name: string
          lease_owner: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          acquired_at?: string
          expires_at: string
          job_name: string
          lease_owner: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          acquired_at?: string
          expires_at?: string
          job_name?: string
          lease_owner?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: []
      }
      landing_consent_observations: {
        Row: {
          analytics_granted: boolean
          decision: string
          edge_request_id: string
          marketing_granted: boolean
          observation_count: number
          observed_at: string
          page_view_id: string
          preferences_granted: boolean
          source: string
          traffic_classification: string
          updated_at: string
        }
        Insert: {
          analytics_granted: boolean
          decision: string
          edge_request_id: string
          marketing_granted: boolean
          observation_count?: number
          observed_at: string
          page_view_id: string
          preferences_granted: boolean
          source?: string
          traffic_classification: string
          updated_at?: string
        }
        Update: {
          analytics_granted?: boolean
          decision?: string
          edge_request_id?: string
          marketing_granted?: boolean
          observation_count?: number
          observed_at?: string
          page_view_id?: string
          preferences_granted?: boolean
          source?: string
          traffic_classification?: string
          updated_at?: string
        }
        Relationships: []
      }
      privacy_retention_exceptions: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          reason: string
          resource_key: string
          resource_schema: string
          resource_table: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          expires_at: string
          id?: string
          reason: string
          resource_key: string
          resource_schema: string
          resource_table: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          reason?: string
          resource_key?: string
          resource_schema?: string
          resource_table?: string
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
          http_status: number | null
          id: string
          idempotency_key: string
          last_attempt_started_at: string | null
          last_error: string | null
          latency_ms: number | null
          next_attempt_at: string | null
          payload: Json
          payload_summary: Json
          processed_at: string | null
          provider: string
          request_id: string | null
          response: Json
          response_semantics: string | null
          skip_reason: string | null
          status: string
          updated_at: string
          validation_result: Json
        }
        Insert: {
          attempt_count?: number
          consent_basis?: Json
          created_at?: string
          data_quality?: Json
          dispatch_mode?: string
          event_id?: string | null
          event_name?: string | null
          http_status?: number | null
          id?: string
          idempotency_key: string
          last_attempt_started_at?: string | null
          last_error?: string | null
          latency_ms?: number | null
          next_attempt_at?: string | null
          payload?: Json
          payload_summary?: Json
          processed_at?: string | null
          provider: string
          request_id?: string | null
          response?: Json
          response_semantics?: string | null
          skip_reason?: string | null
          status?: string
          updated_at?: string
          validation_result?: Json
        }
        Update: {
          attempt_count?: number
          consent_basis?: Json
          created_at?: string
          data_quality?: Json
          dispatch_mode?: string
          event_id?: string | null
          event_name?: string | null
          http_status?: number | null
          id?: string
          idempotency_key?: string
          last_attempt_started_at?: string | null
          last_error?: string | null
          latency_ms?: number | null
          next_attempt_at?: string | null
          payload?: Json
          payload_summary?: Json
          processed_at?: string | null
          provider?: string
          request_id?: string | null
          response?: Json
          response_semantics?: string | null
          skip_reason?: string | null
          status?: string
          updated_at?: string
          validation_result?: Json
        }
        Relationships: []
      }
      shopify_checkout_observations: {
        Row: {
          alert_type: string | null
          analytics_processing_allowed: boolean
          checkout_token: string | null
          commerce_value: number | null
          contract_name: string
          created_at: string
          currency_code: string | null
          event_id: string
          event_name: string
          event_sequence: number
          first_observed_at: string
          id: string
          idempotency_key: string
          item_quantity: number | null
          last_observed_at: string
          marketing_allowed: boolean
          observation_count: number
          occurred_at: string
          payload_sha256: string
          preferences_processing_allowed: boolean
          sale_of_data_allowed: boolean
          schema_version: number
          source: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          alert_type?: string | null
          analytics_processing_allowed: boolean
          checkout_token?: string | null
          commerce_value?: number | null
          contract_name?: string
          created_at?: string
          currency_code?: string | null
          event_id: string
          event_name: string
          event_sequence: number
          first_observed_at?: string
          id?: string
          idempotency_key: string
          item_quantity?: number | null
          last_observed_at?: string
          marketing_allowed: boolean
          observation_count?: number
          occurred_at: string
          payload_sha256: string
          preferences_processing_allowed: boolean
          sale_of_data_allowed: boolean
          schema_version?: number
          source?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          alert_type?: string | null
          analytics_processing_allowed?: boolean
          checkout_token?: string | null
          commerce_value?: number | null
          contract_name?: string
          created_at?: string
          currency_code?: string | null
          event_id?: string
          event_name?: string
          event_sequence?: number
          first_observed_at?: string
          id?: string
          idempotency_key?: string
          item_quantity?: number | null
          last_observed_at?: string
          marketing_allowed?: boolean
          observation_count?: number
          occurred_at?: string
          payload_sha256?: string
          preferences_processing_allowed?: boolean
          sale_of_data_allowed?: boolean
          schema_version?: number
          source?: string
          updated_at?: string
          verification_status?: string
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
      tagging_observations: {
        Row: {
          client_name: string | null
          container_id: string | null
          container_version: string | null
          edge_request_id: string | null
          event_id: string
          event_name: string
          id: string
          idempotency_key: string
          observation_type: string
          observed_at: string
          page_view_id: string | null
          received_at: string
          tag_execution_time_ms: number | null
          tag_id: string | null
          tag_status: string | null
          traffic_classification: string | null
        }
        Insert: {
          client_name?: string | null
          container_id?: string | null
          container_version?: string | null
          edge_request_id?: string | null
          event_id: string
          event_name: string
          id?: string
          idempotency_key: string
          observation_type: string
          observed_at: string
          page_view_id?: string | null
          received_at?: string
          tag_execution_time_ms?: number | null
          tag_id?: string | null
          tag_status?: string | null
          traffic_classification?: string | null
        }
        Update: {
          client_name?: string | null
          container_id?: string | null
          container_version?: string | null
          edge_request_id?: string | null
          event_id?: string
          event_name?: string
          id?: string
          idempotency_key?: string
          observation_type?: string
          observed_at?: string
          page_view_id?: string | null
          received_at?: string
          tag_execution_time_ms?: number | null
          tag_id?: string | null
          tag_status?: string | null
          traffic_classification?: string | null
        }
        Relationships: []
      }
      vercel_edge_request_observations: {
        Row: {
          automation_class: string
          cache_status: string | null
          deployment_id: string
          device_class: string
          edge_region: string
          edge_request_id: string | null
          environment: string
          execution_region: string | null
          fbclid_hmac: string | null
          fbclid_present: boolean
          host: string
          in_app_browser: string
          ingested_at: string
          lambda_region: string | null
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          meta_placement: string | null
          meta_site_source_name: string | null
          method: string
          observation_type: string
          observed_at: string
          os_class: string
          path_type: string | null
          path_type_variant: string | null
          project_id: string
          referrer_host: string | null
          request_id: string | null
          response_bytes: number | null
          route_pathname: string
          source: string
          status_code: number
          trace_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vercel_id: string | null
          vercel_log_id: string
          waf_action: string | null
        }
        Insert: {
          automation_class: string
          cache_status?: string | null
          deployment_id: string
          device_class: string
          edge_region: string
          edge_request_id?: string | null
          environment: string
          execution_region?: string | null
          fbclid_hmac?: string | null
          fbclid_present: boolean
          host: string
          in_app_browser: string
          ingested_at?: string
          lambda_region?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          meta_placement?: string | null
          meta_site_source_name?: string | null
          method: string
          observation_type: string
          observed_at: string
          os_class: string
          path_type?: string | null
          path_type_variant?: string | null
          project_id: string
          referrer_host?: string | null
          request_id?: string | null
          response_bytes?: number | null
          route_pathname: string
          source: string
          status_code: number
          trace_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vercel_id?: string | null
          vercel_log_id: string
          waf_action?: string | null
        }
        Update: {
          automation_class?: string
          cache_status?: string | null
          deployment_id?: string
          device_class?: string
          edge_region?: string
          edge_request_id?: string | null
          environment?: string
          execution_region?: string | null
          fbclid_hmac?: string | null
          fbclid_present?: boolean
          host?: string
          in_app_browser?: string
          ingested_at?: string
          lambda_region?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          meta_placement?: string | null
          meta_site_source_name?: string | null
          method?: string
          observation_type?: string
          observed_at?: string
          os_class?: string
          path_type?: string | null
          path_type_variant?: string | null
          project_id?: string
          referrer_host?: string | null
          request_id?: string | null
          response_bytes?: number | null
          route_pathname?: string
          source?: string
          status_code?: number
          trace_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vercel_id?: string | null
          vercel_log_id?: string
          waf_action?: string | null
        }
        Relationships: []
      }
      vercel_trace_observations: {
        Row: {
          deployment_id: string
          duration_ms: number
          end_time_unix_nano: number
          environment: string
          ingested_at: string
          observed_at: string
          project_id: string
          span_count: number
          start_time_unix_nano: number
          trace_id: string
          updated_at: string
        }
        Insert: {
          deployment_id: string
          duration_ms: number
          end_time_unix_nano: number
          environment: string
          ingested_at?: string
          observed_at: string
          project_id: string
          span_count: number
          start_time_unix_nano: number
          trace_id: string
          updated_at?: string
        }
        Update: {
          deployment_id?: string
          duration_ms?: number
          end_time_unix_nano?: number
          environment?: string
          ingested_at?: string
          observed_at?: string
          project_id?: string
          span_count?: number
          start_time_unix_nano?: number
          trace_id?: string
          updated_at?: string
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
      meta_landing_edge_health: {
        Row: {
          automation_class: string | null
          environment: string | null
          fbclid_present: boolean | null
          is_first_fbclid_observation: boolean | null
          is_primary_request_observation: boolean | null
          meta_ad_id: string | null
          observation_type: string | null
          observed_at: string | null
          status_code: number | null
          traffic_classification: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      meta_landing_observability: {
        Row: {
          analytics_granted: boolean | null
          automation_class: string | null
          browser_page_view_dispatch_receipt_received: boolean | null
          browser_page_view_dispatch_receipt_received_at: string | null
          browser_page_view_traffic_classification: string | null
          cache_status: string | null
          canonical_page_view_observed: boolean | null
          canonical_page_view_observed_at: string | null
          collector_page_view_receipt_received: boolean | null
          collector_page_view_receipt_received_at: string | null
          consent_decision: string | null
          device_class: string | null
          edge_region: string | null
          environment: string | null
          execution_region: string | null
          fbclid_present: boolean | null
          host: string | null
          in_app_browser: string | null
          is_first_fbclid_observation: boolean | null
          is_primary_request_observation: boolean | null
          lambda_region: string | null
          marketing_granted: boolean | null
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          meta_dispatch_http_status: number | null
          meta_dispatch_processed_at: string | null
          meta_dispatch_response_semantics: string | null
          meta_dispatch_status: string | null
          meta_placement: string | null
          meta_site_source_name: string | null
          observation_type: string | null
          observed_at: string | null
          observed_date_utc: string | null
          os_class: string | null
          page_view_event_id: string | null
          page_view_id: string | null
          path_type: string | null
          preferences_granted: boolean | null
          referrer_host: string | null
          request_observation_rank: number | null
          response_bytes: number | null
          route_pathname: string | null
          server_trace_duration_ms: number | null
          server_trace_span_count: number | null
          status_code: number | null
          traffic_classification: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          waf_action: string | null
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
      has_active_privacy_retention_exception: {
        Args: {
          p_at: string
          p_resource_key: string
          p_resource_schema: string
          p_resource_table: string
        }
        Returns: boolean
      }
      purge_expired_landing_observations: { Args: never; Returns: Json }
      purge_expired_meta_ad_creative_destinations: {
        Args: never
        Returns: number
      }
      purge_expired_meta_ad_delivery_insights: { Args: never; Returns: number }
      purge_expired_page_view_funnel_observations: {
        Args: never
        Returns: number
      }
      purge_expired_privacy_data: { Args: never; Returns: Json }
      purge_expired_shopify_checkout_observations: {
        Args: never
        Returns: number
      }
      purge_expired_shopify_dun_waitlist_pgmq_archive: {
        Args: { retention_days?: number }
        Returns: number
      }
      upsert_abandoned_checkout_recovery_dispatches: {
        Args: { p_rows: Json }
        Returns: number
      }
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
            foreignKeyName: "referrals_partner_source_id_fkey"
            columns: ["partner_source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
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
  marketing: {
    Enums: {},
  },
  ops: {
    Enums: {},
  },
  partner: {
    Enums: {},
  },
} as const
