-- Create admin_users table to track admin privileges
-- Migration: 20251115_create_admin_users
-- Created: November 15, 2025

-- Create the admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS admin_users_is_active_idx ON public.admin_users(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.admin_users IS 'Tracks which users have admin privileges';
COMMENT ON COLUMN public.admin_users.user_id IS 'Foreign key to auth.users - the user with admin privileges';
COMMENT ON COLUMN public.admin_users.email IS 'Email address of the admin user (for reference)';
COMMENT ON COLUMN public.admin_users.granted_by IS 'User ID of who granted admin access';
COMMENT ON COLUMN public.admin_users.granted_at IS 'When admin access was granted';
COMMENT ON COLUMN public.admin_users.notes IS 'Optional notes about why admin access was granted';
COMMENT ON COLUMN public.admin_users.is_active IS 'Whether this admin account is currently active';

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view the admin_users table
CREATE POLICY "Only admins can view admin users"
  ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- RLS Policy: Only existing admins can insert new admins
CREATE POLICY "Only admins can create new admins"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- RLS Policy: Only admins can update admin records
CREATE POLICY "Only admins can update admin users"
  ON public.admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- RLS Policy: Only admins can delete admin records
CREATE POLICY "Only admins can delete admin users"
  ON public.admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- ============================================================================
-- IMPORTANT: BOOTSTRAP FIRST ADMIN
-- ============================================================================
-- You must manually insert your first admin user after running this migration
-- Run this SQL in Supabase SQL Editor, replacing with your actual user_id and email:
--
-- INSERT INTO public.admin_users (user_id, email, notes, granted_by)
-- VALUES (
--   'YOUR_USER_ID_FROM_AUTH_USERS_TABLE',
--   'your-email@example.com',
--   'Bootstrap admin - first user created during setup',
--   NULL
-- );
--
-- To find your user_id, run:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
-- ============================================================================
