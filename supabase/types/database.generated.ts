/**
 * Derived from the deterministic current-target fingerprint.
 * This file was not generated from a live database and is intentionally not
 * wired into application runtime code during the guarded-foundation phase.
 * Regenerate with: npm run db:types:generate
 */

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
      admin_users: {
        Row: {
          id: string
          user_id: string
          is_active: boolean
          granted_by: string | null
          granted_at: string
          revoked_by: string | null
          revoked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_active?: boolean
          granted_by?: string | null
          granted_at?: string
          revoked_by?: string | null
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_active?: boolean
          granted_by?: string | null
          granted_at?: string
          revoked_by?: string | null
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisor_interest_submissions: {
        Row: {
          id: string
          contact_name: string
          business_name: string
          email: string
          website_url: string | null
          interests: string[]
          message: string | null
          consent_confirmed: boolean
          ip_hash: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_name: string
          business_name: string
          email: string
          website_url?: string | null
          interests: string[]
          message?: string | null
          consent_confirmed: boolean
          ip_hash: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_name?: string
          business_name?: string
          email?: string
          website_url?: string | null
          interests?: string[]
          message?: string | null
          consent_confirmed?: boolean
          ip_hash?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      advisors: {
        Row: {
          id: string
          company_id: string
          name: string
          title: string | null
          bio: string | null
          specialties: string[] | null
          years_experience: number | null
          playing_background: string | null
          certifications: string[] | null
          contact_email: string | null
          contact_phone: string | null
          profile_image_url: string | null
          display_order: number | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          title?: string | null
          bio?: string | null
          specialties?: string[] | null
          years_experience?: number | null
          playing_background?: string | null
          certifications?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          profile_image_url?: string | null
          display_order?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          title?: string | null
          bio?: string | null
          specialties?: string[] | null
          years_experience?: number | null
          playing_background?: string | null
          certifications?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          profile_image_url?: string | null
          display_order?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'advisors_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      claim_tags: {
        Row: {
          claim_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          claim_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          claim_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'claim_tags_claim_id_fkey'
            columns: ['claim_id']
            isOneToOne: false
            referencedRelation: 'listing_claims'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'claim_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'directory_tags'
            referencedColumns: ['id']
          },
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          website_url: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state_province: string | null
          country: string | null
          location: unknown | null
          facebook_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          logo_url: string | null
          verified: boolean | null
          verified_owner_id: string | null
          verification_date: string | null
          search_vector: unknown | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state_province?: string | null
          country?: string | null
          location?: unknown | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          logo_url?: string | null
          verified?: boolean | null
          verified_owner_id?: string | null
          verification_date?: string | null
          search_vector?: unknown | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state_province?: string | null
          country?: string | null
          location?: unknown | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          logo_url?: string | null
          verified?: boolean | null
          verified_owner_id?: string | null
          verification_date?: string | null
          search_vector?: unknown | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'companies_verified_owner_id_fkey'
            columns: ['verified_owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      company_elite_prospects: {
        Row: {
          company_id: string
          match_status: string
          agency_name: string | null
          source_url: string | null
          client_count: number | null
          match_notes: string
          source_file: string
          source_sha256: string
          source_observed_at: string | null
          imported_at: string
        }
        Insert: {
          company_id: string
          match_status: string
          agency_name?: string | null
          source_url?: string | null
          client_count?: number | null
          match_notes: string
          source_file: string
          source_sha256: string
          source_observed_at?: string | null
          imported_at?: string
        }
        Update: {
          company_id?: string
          match_status?: string
          agency_name?: string | null
          source_url?: string | null
          client_count?: number | null
          match_notes?: string
          source_file?: string
          source_sha256?: string
          source_observed_at?: string | null
          imported_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_elite_prospects_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      company_leads: {
        Row: {
          id: string
          company_id: string
          contact_name: string
          contact_email: string
          contact_phone: string | null
          player_age: number | null
          player_level: string | null
          goals: string[]
          message: string
          consent_confirmed: boolean
          status: string
          owner_notes: string | null
          referral_url: string | null
          ip_hash: string
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          contact_name: string
          contact_email: string
          contact_phone?: string | null
          player_age?: number | null
          player_level?: string | null
          goals?: string[]
          message: string
          consent_confirmed: boolean
          status?: string
          owner_notes?: string | null
          referral_url?: string | null
          ip_hash: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string | null
          player_age?: number | null
          player_level?: string | null
          goals?: string[]
          message?: string
          consent_confirmed?: boolean
          status?: string
          owner_notes?: string | null
          referral_url?: string | null
          ip_hash?: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_leads_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      company_profiles: {
        Row: {
          company_id: string
          tagline: string | null
          services: string[]
          specialties: string[]
          pathways: string[]
          player_levels: string[]
          age_groups: string[]
          service_areas: string[]
          languages: string[]
          offers_remote: boolean
          accepting_clients: boolean | null
          pricing_models: string[]
          price_min: number | null
          price_max: number | null
          price_currency: string | null
          response_time: string | null
          founded_year: number | null
          business_hours: Json
          faq: Json
          last_reviewed_at: string | null
          source_label: string | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          tagline?: string | null
          services?: string[]
          specialties?: string[]
          pathways?: string[]
          player_levels?: string[]
          age_groups?: string[]
          service_areas?: string[]
          languages?: string[]
          offers_remote?: boolean
          accepting_clients?: boolean | null
          pricing_models?: string[]
          price_min?: number | null
          price_max?: number | null
          price_currency?: string | null
          response_time?: string | null
          founded_year?: number | null
          business_hours?: Json
          faq?: Json
          last_reviewed_at?: string | null
          source_label?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          tagline?: string | null
          services?: string[]
          specialties?: string[]
          pathways?: string[]
          player_levels?: string[]
          age_groups?: string[]
          service_areas?: string[]
          languages?: string[]
          offers_remote?: boolean
          accepting_clients?: boolean | null
          pricing_models?: string[]
          price_min?: number | null
          price_max?: number | null
          price_currency?: string | null
          response_time?: string | null
          founded_year?: number | null
          business_hours?: Json
          faq?: Json
          last_reviewed_at?: string | null
          source_label?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_profiles_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      company_tags: {
        Row: {
          company_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          company_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          company_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_tags_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'company_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'directory_tags'
            referencedColumns: ['id']
          },
        ]
      }
      directory_events: {
        Row: {
          id: string
          company_id: string
          event_type: string
          session_id: string
          ip_hash: string
          user_agent: string | null
          referrer: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          event_type: string
          session_id: string
          ip_hash: string
          user_agent?: string | null
          referrer?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          event_type?: string
          session_id?: string
          ip_hash?: string
          user_agent?: string | null
          referrer?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'directory_events_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      directory_tag_groups: {
        Row: {
          key: string
          label: string
          display_order: number
          is_core: boolean
          filter_enabled: boolean
        }
        Insert: {
          key: string
          label: string
          display_order?: number
          is_core?: boolean
          filter_enabled?: boolean
        }
        Update: {
          key?: string
          label?: string
          display_order?: number
          is_core?: boolean
          filter_enabled?: boolean
        }
        Relationships: []
      }
      directory_tag_suggestions: {
        Row: {
          id: string
          requester_user_id: string
          company_id: string | null
          claim_id: string | null
          group_key: string
          label: string
          reason: string
          status: string
          approved_tag_id: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          requester_user_id: string
          company_id?: string | null
          claim_id?: string | null
          group_key: string
          label: string
          reason: string
          status?: string
          approved_tag_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          requester_user_id?: string
          company_id?: string | null
          claim_id?: string | null
          group_key?: string
          label?: string
          reason?: string
          status?: string
          approved_tag_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'directory_tag_suggestions_approved_tag_fkey'
            columns: ['approved_tag_id', 'group_key']
            isOneToOne: false
            referencedRelation: 'directory_tags'
            referencedColumns: ['id', 'group_key']
          },
          {
            foreignKeyName: 'directory_tag_suggestions_claim_id_fkey'
            columns: ['claim_id']
            isOneToOne: false
            referencedRelation: 'listing_claims'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'directory_tag_suggestions_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'directory_tag_suggestions_group_key_fkey'
            columns: ['group_key']
            isOneToOne: false
            referencedRelation: 'directory_tag_groups'
            referencedColumns: ['key']
          },
        ]
      }
      directory_tags: {
        Row: {
          id: string
          group_key: string
          slug: string
          label: string
          parent_id: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          group_key: string
          slug: string
          label: string
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          group_key?: string
          slug?: string
          label?: string
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'directory_tags_group_key_fkey'
            columns: ['group_key']
            isOneToOne: false
            referencedRelation: 'directory_tag_groups'
            referencedColumns: ['key']
          },
          {
            foreignKeyName: 'directory_tags_parent_id_fkey'
            columns: ['parent_id', 'group_key']
            isOneToOne: false
            referencedRelation: 'directory_tags'
            referencedColumns: ['id', 'group_key']
          },
        ]
      }
      listing_claims: {
        Row: {
          id: string
          company_id: string
          claimant_user_id: string
          claim_status: Database['public']['Enums']['claim_status'] | null
          verification_method: Database['public']['Enums']['verification_method'] | null
          verification_data: Json | null
          business_email: string | null
          business_phone: string | null
          supporting_documents: string[] | null
          admin_notes: string | null
          submitted_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          claimant_user_id: string
          claim_status?: Database['public']['Enums']['claim_status'] | null
          verification_method?: Database['public']['Enums']['verification_method'] | null
          verification_data?: Json | null
          business_email?: string | null
          business_phone?: string | null
          supporting_documents?: string[] | null
          admin_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          claimant_user_id?: string
          claim_status?: Database['public']['Enums']['claim_status'] | null
          verification_method?: Database['public']['Enums']['verification_method'] | null
          verification_data?: Json | null
          business_email?: string | null
          business_phone?: string | null
          supporting_documents?: string[] | null
          admin_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'listing_claims_claimant_user_id_fkey'
            columns: ['claimant_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listing_claims_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listing_claims_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      media_content: {
        Row: {
          id: string
          company_id: string
          file_name: string
          file_path: string
          file_type: Database['public']['Enums']['media_type']
          file_size: number
          mime_type: string
          caption: string | null
          display_order: number | null
          is_featured: boolean | null
          is_introduction_video: boolean | null
          moderation_status: Database['public']['Enums']['moderation_status'] | null
          uploaded_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          file_name: string
          file_path: string
          file_type: Database['public']['Enums']['media_type']
          file_size: number
          mime_type: string
          caption?: string | null
          display_order?: number | null
          is_featured?: boolean | null
          is_introduction_video?: boolean | null
          moderation_status?: Database['public']['Enums']['moderation_status'] | null
          uploaded_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          file_name?: string
          file_path?: string
          file_type?: Database['public']['Enums']['media_type']
          file_size?: number
          mime_type?: string
          caption?: string | null
          display_order?: number | null
          is_featured?: boolean | null
          is_introduction_video?: boolean | null
          moderation_status?: Database['public']['Enums']['moderation_status'] | null
          uploaded_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'media_content_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'media_content_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          company_id: string
          reviewer_user_id: string
          rating: number
          title: string | null
          review_text: string
          experience_confirmed_at: string
          moderation_status: Database['public']['Enums']['moderation_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          reviewer_user_id: string
          rating: number
          title?: string | null
          review_text: string
          experience_confirmed_at: string
          moderation_status?: Database['public']['Enums']['moderation_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          reviewer_user_id?: string
          rating?: number
          title?: string | null
          review_text?: string
          experience_confirmed_at?: string
          moderation_status?: Database['public']['Enums']['moderation_status']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          id: string
          user_type: Database['public']['Enums']['user_type'] | null
          first_name: string | null
          last_name: string | null
          search_preferences: Json | null
          contact_history: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          user_type?: Database['public']['Enums']['user_type'] | null
          first_name?: string | null
          last_name?: string | null
          search_preferences?: Json | null
          contact_history?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_type?: Database['public']['Enums']['user_type'] | null
          first_name?: string | null
          last_name?: string | null
          search_preferences?: Json | null
          contact_history?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      replace_claim_tags: {
        Args: {
          p_claim_id: string
          p_tag_ids: string[]
        }
        Returns: string[]
      }
      replace_company_tags: {
        Args: {
          p_company_id: string
          p_tag_ids: string[]
        }
        Returns: string[]
      }
      review_directory_tag_suggestion: {
        Args: {
          p_suggestion_id: string
          p_action: string
          p_slug: string
          p_label: string
          p_note: string
        }
        Returns: string
      }
      submit_directory_claim: {
        Args: {
          p_company_id: string
          p_business_email: string
          p_business_phone: string
          p_verification_data: Json
          p_tag_ids: string[]
        }
        Returns: Json
      }
      validate_directory_tag_selection: {
        Args: {
          p_tag_ids: string[]
        }
        Returns: string[]
      }
    }
    Enums: {
      claim_status: 'pending' | 'under_review' | 'approved' | 'rejected'
      media_type: 'photo' | 'video'
      moderation_status: 'pending' | 'approved' | 'rejected'
      user_type: 'searcher' | 'advisor'
      verification_method: 'email' | 'phone' | 'document' | 'manual'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type CompanyRow = Database['public']['Tables']['companies']['Row']
export type AdvisorPersonRow = Database['public']['Tables']['advisors']['Row']
export type AdminUserRow = Database['public']['Tables']['admin_users']['Row']
export type ReviewRow = Database['public']['Tables']['reviews']['Row']
export type CompanyProfileRow = Database['public']['Tables']['company_profiles']['Row']
export type CompanyLeadRow = Database['public']['Tables']['company_leads']['Row']
export type DirectoryEventRow = Database['public']['Tables']['directory_events']['Row']
export type AdvisorInterestSubmissionRow = Database['public']['Tables']['advisor_interest_submissions']['Row']

