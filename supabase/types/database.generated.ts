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

