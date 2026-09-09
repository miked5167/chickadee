'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { z } from 'zod'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const claimSchema = z.object({
  businessEmail: z.string().trim().email('Enter a valid business email address.'),
  businessPhone: z.string().trim().max(30, 'Phone number is too long.'),
  relationship: z.string().trim().min(20, 'Describe your relationship in at least 20 characters.').max(500),
  verificationDetails: z.string().trim().min(50, 'Provide at least 50 characters of verification information.').max(1500),
})

interface ClaimFormProps {
  companyId: string
  companyName: string
  companySlug: string
}

export function ClaimForm({ companyId, companyName, companySlug }: ClaimFormProps) {
  const { user, loading: authLoading } = useAuth()
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [relationship, setRelationship] = useState('')
  const [verificationDetails, setVerificationDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (authLoading) {
    return <Card className="flex min-h-48 items-center justify-center border-frost"><Loader2 className="h-7 w-7 animate-spin text-hockey-blue" aria-label="Checking sign-in status" /></Card>
  }

  if (!user) {
    return (
      <Card className="border-frost p-7 text-center sm:p-10">
        <LogIn className="mx-auto h-10 w-10 text-hockey-blue" aria-hidden="true" />
        <h2 className="mt-4 font-display text-3xl font-bold uppercase text-arena-navy">Sign in to submit a claim</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-neutral-gray">
          Claims are tied to a Directory account so ownership cannot be granted from an unverified form submission.
        </p>
        <Button asChild className="mt-6 min-h-12 px-6 font-bold">
          <Link href={`/login?returnTo=${encodeURIComponent(`/claim/${companySlug}`)}`}>Sign in or create an account</Link>
        </Button>
      </Card>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const parsed = claimSchema.safeParse({ businessEmail, businessPhone, relationship, verificationDetails })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the claim information and try again.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/advisors/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          business_email: parsed.data.businessEmail,
          business_phone: parsed.data.businessPhone || null,
          relationship: parsed.data.relationship,
          verification_details: parsed.data.verificationDetails,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The claim could not be submitted.')
      setSuccess(true)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The claim could not be submitted.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-success-green/30 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success-green" aria-hidden="true" />
        <h2 className="mt-4 font-display text-3xl font-bold uppercase text-arena-navy">Claim received</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-neutral-gray">
          Your claim for {companyName} is recorded as pending. No listing access is granted until the business relationship is reviewed.
        </p>
        <Button asChild variant="outline" className="mt-6"><Link href={`/listings/${companySlug}`}>Return to the listing</Link></Button>
      </Card>
    )
  }

  return (
    <Card className="border-frost p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-hockey-blue" aria-hidden="true" />
        <div>
          <h2 className="font-display text-3xl font-bold uppercase text-arena-navy">Confirm your connection</h2>
          <p className="mt-2 leading-7 text-neutral-gray">Provide business contact information and enough detail for a careful ownership review.</p>
        </div>
      </div>

      {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business-email">Business email</Label>
            <Input id="business-email" type="email" autoComplete="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-phone">Business phone <span className="text-neutral-gray">(optional)</span></Label>
            <Input id="business-phone" type="tel" autoComplete="tel" value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship">Your relationship to {companyName}</Label>
          <Textarea id="relationship" value={relationship} onChange={(event) => setRelationship(event.target.value)} rows={3} maxLength={500} placeholder="For example: owner, partner, employee, or authorized agency representative." required />
          <p className="text-xs text-neutral-gray">{relationship.length}/500 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-details">How can we verify this relationship?</Label>
          <Textarea id="verification-details" value={verificationDetails} onChange={(event) => setVerificationDetails(event.target.value)} rows={5} maxLength={1500} placeholder="Describe the official website, business registration, company email domain, or other evidence that connects you to this business." required />
          <p className="text-xs text-neutral-gray">{verificationDetails.length}/1500 characters · minimum 50</p>
        </div>

        <div className="rounded-lg bg-ice-blue p-4 text-sm leading-6 text-board-blue">
          Submitting a claim does not automatically verify the listing or grant access. False ownership claims may be rejected.
        </div>

        <Button type="submit" disabled={loading} className="min-h-12 w-full font-bold">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting claim…</> : 'Submit claim for review'}
        </Button>
      </form>
    </Card>
  )
}
