-- Migration: Claim Listing Improvements
-- Adds email verification, automated review intelligence, and notification support

-- Add email verification fields to listing_claims
ALTER TABLE listing_claims
ADD COLUMN verification_token TEXT,
ADD COLUMN verification_token_expires_at TIMESTAMPTZ,
ADD COLUMN email_verified_at TIMESTAMPTZ,
ADD COLUMN verification_confidence_score INTEGER DEFAULT 0,
ADD COLUMN auto_approved BOOLEAN DEFAULT false,
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Add indexes for email verification
CREATE INDEX idx_claims_email_verified ON listing_claims(email_verified_at);
CREATE INDEX idx_claims_token ON listing_claims(verification_token);
CREATE INDEX idx_claims_auth_user ON listing_claims(auth_user_id);

-- Create advisor_team_members table
CREATE TABLE advisor_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  photo_url TEXT,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_advisor ON advisor_team_members(advisor_id);
CREATE INDEX idx_team_members_active ON advisor_team_members(advisor_id, is_active, display_order);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_advisor ON notifications(advisor_id);

-- Add review reply support to reviews table
ALTER TABLE reviews
ADD COLUMN advisor_reply TEXT,
ADD COLUMN advisor_reply_at TIMESTAMPTZ,
ADD COLUMN advisor_reply_by UUID REFERENCES auth.users(id);

CREATE INDEX idx_reviews_with_replies ON reviews(advisor_id) WHERE advisor_reply IS NOT NULL;

-- Add team member count to advisors (for profile completion tracking)
ALTER TABLE advisors
ADD COLUMN team_member_count INTEGER DEFAULT 0;

-- Function to update team member count
CREATE OR REPLACE FUNCTION update_advisor_team_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE advisors
    SET team_member_count = (
      SELECT COUNT(*)
      FROM advisor_team_members
      WHERE advisor_id = NEW.advisor_id AND is_active = true
    )
    WHERE id = NEW.advisor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE advisors
    SET team_member_count = (
      SELECT COUNT(*)
      FROM advisor_team_members
      WHERE advisor_id = OLD.advisor_id AND is_active = true
    )
    WHERE id = OLD.advisor_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_count
AFTER INSERT OR UPDATE OR DELETE ON advisor_team_members
FOR EACH ROW EXECUTE FUNCTION update_advisor_team_count();

-- Add read status to leads
ALTER TABLE leads
ADD COLUMN is_read BOOLEAN DEFAULT false,
ADD COLUMN advisor_notes TEXT;

CREATE INDEX idx_leads_read_status ON leads(advisor_id, is_read);

-- Comments for documentation
COMMENT ON COLUMN listing_claims.verification_token IS 'Secure token for email verification, expires after 24 hours';
COMMENT ON COLUMN listing_claims.email_verified_at IS 'Timestamp when claimant verified their email address';
COMMENT ON COLUMN listing_claims.verification_confidence_score IS 'Automated confidence score 0-100 based on domain matching and other factors';
COMMENT ON COLUMN listing_claims.auto_approved IS 'True if claim was automatically approved based on high confidence score';
COMMENT ON COLUMN listing_claims.auth_user_id IS 'Links to Supabase Auth user created during email verification';

COMMENT ON TABLE advisor_team_members IS 'Team members/advisors that work for a claimed business listing';
COMMENT ON TABLE notifications IS 'In-app notifications for claimed advisor users';

COMMENT ON COLUMN reviews.advisor_reply IS 'Public response from the advisor to this review';
COMMENT ON COLUMN reviews.advisor_reply_at IS 'Timestamp when advisor replied to review';

COMMENT ON COLUMN leads.is_read IS 'Whether the advisor has viewed this lead';
COMMENT ON COLUMN leads.advisor_notes IS 'Private notes added by advisor about this lead';
