import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tagSuggestionSchema } from '@/lib/tags/validation'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers })
  const { data, error } = await supabase.from('directory_tag_suggestions').select('*').eq('requester_user_id', user.id).order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: 'Suggestions could not be loaded.' }, { status: 503, headers })
  return NextResponse.json({ suggestions: data || [] }, { headers })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400, headers }) }
  const parsed = tagSuggestionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid suggestion.' }, { status: 400, headers })

  // RLS validates company ownership or the requester's pending claim. Reviewer
  // identity and publication status cannot be supplied in this insert.
  const { data, error } = await supabase.from('directory_tag_suggestions').insert({
    ...parsed.data, requester_user_id: user.id,
  }).select('*').single()
  if (error?.code === '42501') return NextResponse.json({ error: 'Listing or pending claim access denied.' }, { status: 403, headers })
  if (error?.code === '23505') return NextResponse.json({ error: 'You already have a pending suggestion for this tag.' }, { status: 409, headers })
  if (error || !data) return NextResponse.json({ error: 'The suggestion could not be saved.' }, { status: 503, headers })
  return NextResponse.json({ suggestion: data }, { status: 201, headers })
}
