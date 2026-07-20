import { NextResponse } from 'next/server'

const unavailable = () => NextResponse.json(
  { error: 'Company review reply workflow unavailable.' },
  {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  },
)

// Owner replies require a separately reviewed company-owner contract and remain disabled in M4.
export async function PATCH() {
  return unavailable()
}

export async function DELETE() {
  return unavailable()
}
