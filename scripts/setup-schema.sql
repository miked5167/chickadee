-- =====================================================
-- The Hockey Directory - Complete Database Schema
-- =====================================================
-- This script creates all tables, indexes, functions,
-- and triggers for The Hockey Directory platform.
--
-- Prerequisites:
-- - PostGIS extension must be enabled
-- - Run in Supabase SQL Editor
-- =====================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: advisors
-- Stores all advisor/listing information
-- -----------------------------------------------------
CREATE TABLE advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  country TEXT DEFAULT 'US',

  -- PostGIS for better location queries
  location GEOGRAPHY(POINT, 4326),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Business details
  years_in_business INTEGER,
  services_offered TEXT[], -- ['player-development', 'college-recruitment', 'showcase-guidance']
  specialties TEXT[], -- ['womens-hockey', 'goalie-training', 'skill-development']
  price_range TEXT, -- 'free-consultation', '$100-200/hr', '$200+/hr'
  certification_info TEXT,

  -- Social links
  linkedin_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,

  -- Status flags
  is_featured BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  claimed_by_user_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  submitted_by_email TEXT,

  -- Data quality tracking
  data_quality_score INTEGER DEFAULT 0, -- 0-100 based on profile completeness
  last_verified_date TIMESTAMPTZ,
  needs_review BOOLEAN DEFAULT false,

  -- Subscription/monetization
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'basic', 'pro', 'elite'
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  monthly_view_limit INTEGER, -- NULL = unlimited
  monthly_lead_limit INTEGER, -- NULL = unlimited

  -- Rating aggregation
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(city, '')), 'C')
  ) STORED
);

-- Advisors Indexes
CREATE INDEX idx_advisors_slug ON advisors(slug);
CREATE INDEX idx_advisors_location ON advisors USING GIST(location);
CREATE INDEX idx_advisors_city_state ON advisors(city, state);
CREATE INDEX idx_advisors_published_featured ON advisors(is_published, is_featured);
CREATE INDEX idx_advisors_subscription_tier ON advisors(subscription_tier);
CREATE INDEX idx_advisors_search_vector ON advisors USING GIN(search_vector);
CREATE INDEX idx_advisors_rating ON advisors(average_rating DESC);

-- -----------------------------------------------------
-- Table: listing_claims
-- Stores claim requests from advisors
-- -----------------------------------------------------
CREATE TABLE listing_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  claimant_email TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  claimant_phone TEXT,
  business_verification_info TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_claims_status ON listing_claims(status);
CREATE INDEX idx_claims_advisor ON listing_claims(advisor_id);

-- -----------------------------------------------------
-- Table: leads
-- Stores contact form submissions (lead tracking)
-- -----------------------------------------------------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,

  -- Lead information
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,
  child_age INTEGER,
  message TEXT NOT NULL,

  -- Status tracking
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
  advisor_notes TEXT,

  -- Tracking data
  ip_address TEXT, -- Hashed for privacy
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_advisor ON leads(advisor_id, created_at DESC);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(parent_email);

-- -----------------------------------------------------
-- Table: reviews
-- Stores user reviews with ratings
-- -----------------------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT NOT NULL,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,

  -- Moderation
  flagged_count INTEGER DEFAULT 0,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate reviews from same user
  UNIQUE(advisor_id, user_id)
);

CREATE INDEX idx_reviews_advisor ON reviews(advisor_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(advisor_id, rating);
CREATE INDEX idx_reviews_published ON reviews(is_published);

-- -----------------------------------------------------
-- Table: click_tracking
-- Stores click analytics for external links
-- -----------------------------------------------------
CREATE TABLE click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  clicked_url TEXT NOT NULL, -- 'website', 'email', 'phone', 'linkedin', etc.
  ip_address TEXT, -- Hashed
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_advisor ON click_tracking(advisor_id, created_at DESC);
CREATE INDEX idx_clicks_session ON click_tracking(session_id);

-- -----------------------------------------------------
-- Table: listing_views
-- Stores view analytics for listings
-- -----------------------------------------------------
CREATE TABLE listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  ip_address TEXT, -- Hashed
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_views_advisor ON listing_views(advisor_id, created_at DESC);
CREATE INDEX idx_views_date ON listing_views(created_at);

-- -----------------------------------------------------
-- Table: users_public
-- Public user profiles (separate from auth.users)
-- -----------------------------------------------------
CREATE TABLE users_public (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  location TEXT,
  joined_date TIMESTAMPTZ DEFAULT NOW(),
  bio TEXT,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email', -- 'email', 'google'
  is_blog_author BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_auth_provider ON users_public(auth_provider);

-- -----------------------------------------------------
-- Table: csv_import_logs
-- Tracks CSV import history and errors
-- -----------------------------------------------------
CREATE TABLE csv_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID REFERENCES auth.users(id),
  filename TEXT,
  total_rows INTEGER,
  successful_rows INTEGER,
  failed_rows INTEGER,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BLOG TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: blog_categories
-- Stores blog post categories
-- -----------------------------------------------------
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);

-- -----------------------------------------------------
-- Table: blog_tags
-- Stores blog post tags
-- -----------------------------------------------------
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- -----------------------------------------------------
-- Table: blog_posts
-- Stores all blog posts with MDX content
-- -----------------------------------------------------
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  featured_image_alt TEXT,

  -- Author
  author_id UUID NOT NULL REFERENCES auth.users(id),

  -- Categorization
  category_id UUID REFERENCES blog_categories(id),

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'scheduled', 'archived'
  is_featured BOOLEAN DEFAULT false,

  -- Scheduling
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,

  -- Related content
  related_advisor_id UUID REFERENCES advisors(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'C')
  ) STORED
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_featured ON blog_posts(is_featured, published_at DESC);
CREATE INDEX idx_blog_posts_search_vector ON blog_posts USING GIN(search_vector);

-- -----------------------------------------------------
-- Table: blog_post_tags
-- Junction table for blog posts and tags
-- -----------------------------------------------------
CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- -----------------------------------------------------
-- Table: blog_comments (Optional)
-- Stores blog post comments
-- -----------------------------------------------------
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES blog_comments(id),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_comments_post ON blog_comments(post_id, created_at DESC);
CREATE INDEX idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_approved ON blog_comments(is_approved);

-- -----------------------------------------------------
-- Table: blog_post_views
-- Tracks blog post view analytics
-- -----------------------------------------------------
CREATE TABLE blog_post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  ip_address TEXT, -- Hashed
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_views_post ON blog_post_views(post_id, created_at DESC);
CREATE INDEX idx_blog_views_date ON blog_post_views(created_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Function: calculate_data_quality_score
-- Calculates advisor data quality score (0-100)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_data_quality_score()
RETURNS TRIGGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  IF NEW.name IS NOT NULL AND NEW.name != '' THEN score := score + 20; END IF;
  IF NEW.description IS NOT NULL AND NEW.description != '' THEN score := score + 20; END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN score := score + 20; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN score := score + 20; END IF;
  IF NEW.address IS NOT NULL AND NEW.address != '' THEN score := score + 20; END IF;
  IF NEW.logo_url IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.website_url IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.years_in_business IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.certification_info IS NOT NULL THEN score := score + 10; END IF;
  IF array_length(NEW.services_offered, 1) > 0 THEN score := score + 10; END IF;
  IF score > 100 THEN score := 100; END IF;
  NEW.data_quality_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: update_advisor_rating
-- Updates advisor average rating and review count
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_advisor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE advisors
  SET
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE advisor_id = COALESCE(NEW.advisor_id, OLD.advisor_id)
        AND is_published = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE advisor_id = COALESCE(NEW.advisor_id, OLD.advisor_id)
        AND is_published = true
    )
  WHERE id = COALESCE(NEW.advisor_id, OLD.advisor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: set_published_at
-- Auto-sets published_at when post status changes to published
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: calculate_read_time
-- Calculates reading time based on word count (~200 words/min)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.read_time_minutes := GREATEST(1, ROUND(
    array_length(regexp_split_to_array(NEW.content, '\s+'), 1)::DECIMAL / 200
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: update_tag_count
-- Updates tag post count when tags are added/removed
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_tag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_tags SET post_count = post_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_tags SET post_count = post_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: update_category_count
-- Updates category post count
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.category_id IS NOT NULL THEN
      UPDATE blog_categories
      SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = NEW.category_id AND status = 'published')
      WHERE id = NEW.category_id;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.category_id IS NOT NULL AND OLD.category_id != NEW.category_id THEN
      UPDATE blog_categories
      SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = OLD.category_id AND status = 'published')
      WHERE id = OLD.category_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE blog_categories
      SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = OLD.category_id AND status = 'published')
      WHERE id = OLD.category_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: update_blog_view_count
-- Updates blog post view count
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_blog_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = (SELECT COUNT(*) FROM blog_post_views WHERE post_id = NEW.post_id)
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update advisor data quality score
CREATE TRIGGER update_advisor_quality_score
BEFORE INSERT OR UPDATE ON advisors
FOR EACH ROW
EXECUTE FUNCTION calculate_data_quality_score();

-- Trigger: Update advisor rating on review change
CREATE TRIGGER update_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_advisor_rating();

-- Trigger: Auto-set published_at for blog posts
CREATE TRIGGER auto_set_published_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION set_published_at();

-- Trigger: Auto-calculate read time for blog posts
CREATE TRIGGER auto_calculate_read_time
BEFORE INSERT OR UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION calculate_read_time();

-- Trigger: Update tag count
CREATE TRIGGER update_tag_count_trigger
AFTER INSERT OR DELETE ON blog_post_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_count();

-- Trigger: Update category count
CREATE TRIGGER update_category_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_category_count();

-- Trigger: Update blog view count
CREATE TRIGGER update_blog_view_count_trigger
AFTER INSERT ON blog_post_views
FOR EACH ROW
EXECUTE FUNCTION update_blog_view_count();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed initial blog categories
INSERT INTO blog_categories (name, slug, description, icon, color) VALUES
  ('Player Development', 'player-development', 'Tips and strategies for hockey skill development', '🏒', '#003f87'),
  ('College Recruitment', 'college-recruitment', 'Navigate the college hockey recruitment process', '🎓', '#c8102e'),
  ('Parent Tips', 'parent-tips', 'Advice for hockey parents', '👪', '#28a745'),
  ('Women''s Hockey', 'womens-hockey', 'Resources for female hockey players', '⭐', '#6f42c1'),
  ('Industry News', 'industry-news', 'Latest news in hockey development', '📰', '#fd7e14'),
  ('Advisor Spotlights', 'advisor-spotlights', 'Featured advisor interviews', '💡', '#17a2b8');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Database schema created successfully!';
  RAISE NOTICE '✓ All tables, indexes, functions, and triggers have been set up.';
  RAISE NOTICE '✓ Blog categories have been seeded.';
  RAISE NOTICE '✓ Ready to import advisor data.';
END $$;
