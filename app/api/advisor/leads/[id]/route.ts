import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const leadId = params.id

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get advisor record for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('is_claimed', true)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed listing found for this user' },
        { status: 404 }
      )
    }

    // Get request body
    const body = await request.json()
    const { status, advisor_notes } = body

    // Validate status if provided
    if (status && !['new', 'contacted', 'converted', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Fetch the lead to verify ownership
    const { data: lead, error: leadFetchError } = await supabase
      .from('leads')
      .select('advisor_id')
      .eq('id', leadId)
      .single()

    if (leadFetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify this lead belongs to the advisor
    if (lead.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this lead' },
        { status: 403 }
      )
    }

    // Update the lead
    const updateData: any = {}
    if (status) updateData.status = status
    if (advisor_notes !== undefined) updateData.advisor_notes = advisor_notes

    const { error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Lead updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/advisor/leads/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
