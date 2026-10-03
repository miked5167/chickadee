import { NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/supabase/admin-api'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET() {
  const admin = await authorizeAdminRequest()
  if (!admin.ok) return admin.response
  const { data, error } = await admin.authorization.supabase.from('directory_tag_suggestions').select('*').eq('status', 'pending').order('created_at').limit(100)
  if (error) return NextResponse.json({ error: 'The review queue could not be loaded.' }, { status: 503, headers })
  return NextResponse.json({ suggestions: data || [] }, { headers })
}
