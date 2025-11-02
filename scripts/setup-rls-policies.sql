-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- These policies control access to data based on user roles
-- and authentication status
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADVISORS TABLE POLICIES
-- =====================================================

-- Allow anyone to view published advisors
CREATE POLICY "Published advisors are viewable by anyone"
ON advisors FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Allow advisor owners to view their own listings (even if unpublished)
CREATE POLICY "Advisors can view their own listings"
ON advisors FOR SELECT
TO authenticated
USING (claimed_by_user_id = auth.uid());

-- Allow advisor owners to update their own listings
CREATE POLICY "Advisors can update their own listings"
ON advisors FOR UPDATE
TO authenticated
USING (claimed_by_user_id = auth.uid())
WITH CHECK (claimed_by_user_id = auth.uid());

-- =====================================================
-- LISTING CLAIMS POLICIES
-- =====================================================

-- Allow anyone to create a claim
CREATE POLICY "Anyone can create a listing claim"
ON listing_claims FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own claims
CREATE POLICY "Users can view their own claims"
ON listing_claims FOR SELECT
TO authenticated
USING (claimant_email = auth.email());

-- =====================================================
-- LEADS TABLE POLICIES
-- =====================================================

-- Allow anyone to create a lead (submit contact form)
CREATE POLICY "Anyone can submit a lead"
ON leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow advisor owners to view their leads
CREATE POLICY "Advisors can view their own leads"
ON leads FOR SELECT
TO authenticated
USING (
  advisor_id IN (
    SELECT id FROM advisors WHERE claimed_by_user_id = auth.uid()
  )
);

-- Allow advisor owners to update their leads
CREATE POLICY "Advisors can update their own leads"
ON leads FOR UPDATE
TO authenticated
USING (
  advisor_id IN (
    SELECT id FROM advisors WHERE claimed_by_user_id = auth.uid()
  )
);

-- =====================================================
-- REVIEWS TABLE POLICIES
-- =====================================================

-- Allow anyone to view published reviews
CREATE POLICY "Published reviews are viewable by anyone"
ON reviews FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Allow authenticated users to create reviews
CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- ANALYTICS TABLES POLICIES
-- =====================================================

-- Allow anyone to create click tracking records
CREATE POLICY "Anyone can create click tracking"
ON click_tracking FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to create listing view records
CREATE POLICY "Anyone can create listing views"
ON listing_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow advisor owners to view their analytics
CREATE POLICY "Advisors can view their own click analytics"
ON click_tracking FOR SELECT
TO authenticated
USING (
  advisor_id IN (
    SELECT id FROM advisors WHERE claimed_by_user_id = auth.uid()
  )
);

CREATE POLICY "Advisors can view their own listing views"
ON listing_views FOR SELECT
TO authenticated
USING (
  advisor_id IN (
    SELECT id FROM advisors WHERE claimed_by_user_id = auth.uid()
  )
);

-- =====================================================
-- USERS PUBLIC TABLE POLICIES
-- =====================================================

-- Allow anyone to view public user profiles
CREATE POLICY "Public profiles are viewable by anyone"
ON users_public FOR SELECT
TO anon, authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users_public FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON users_public FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- =====================================================
-- BLOG CATEGORIES & TAGS POLICIES
-- =====================================================

-- Allow anyone to view blog categories
CREATE POLICY "Blog categories are viewable by anyone"
ON blog_categories FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to view blog tags
CREATE POLICY "Blog tags are viewable by anyone"
ON blog_tags FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to view blog post tags junction
CREATE POLICY "Blog post tags are viewable by anyone"
ON blog_post_tags FOR SELECT
TO anon, authenticated
USING (true);

-- =====================================================
-- BLOG POSTS POLICIES
-- =====================================================

-- Allow anyone to view published blog posts
CREATE POLICY "Published blog posts are viewable by anyone"
ON blog_posts FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Allow blog authors to view their own posts
CREATE POLICY "Authors can view their own posts"
ON blog_posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Allow blog authors to create posts
CREATE POLICY "Blog authors can create posts"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (SELECT 1 FROM users_public WHERE id = auth.uid() AND is_blog_author = true)
);

-- Allow blog authors to update their own posts
CREATE POLICY "Authors can update their own posts"
ON blog_posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- =====================================================
-- BLOG COMMENTS POLICIES
-- =====================================================

-- Allow anyone to view approved comments
CREATE POLICY "Approved comments are viewable by anyone"
ON blog_comments FOR SELECT
TO anon, authenticated
USING (is_approved = true);

-- Allow authenticated users to create comments
CREATE POLICY "Authenticated users can create comments"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
ON blog_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
ON blog_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- BLOG ANALYTICS POLICIES
-- =====================================================

-- Allow anyone to create blog post views
CREATE POLICY "Anyone can create blog post views"
ON blog_post_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ RLS policies created successfully!';
  RAISE NOTICE '✓ Public data (published advisors, blog posts) is now readable by anyone';
  RAISE NOTICE '✓ Private data is only accessible to authorized users';
END $$;
