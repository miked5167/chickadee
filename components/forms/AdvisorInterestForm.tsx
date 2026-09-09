'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

const options = [
  { value: 'profile_plus', label: 'Profile upgrades', detail: 'More media, proof points, and profile presentation tools.' },
  { value: 'sponsored_placement', label: 'Clearly labelled sponsorship', detail: 'Paid visibility that never changes verification or review scores.' },
  { value: 'enhanced_analytics', label: 'Enhanced analytics', detail: 'Deeper, privacy-conscious reporting about profile engagement.' },
] as const

export function AdvisorInterestForm() {
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  const toggle = (value: string) => {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (selected.length === 0) {
      setError('Choose at least one idea you would like to help shape.')
      return
    }

    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/advisor-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: form.get('contact_name'),
          business_name: form.get('business_name'),
          email: form.get('email'),
          website_url: form.get('website_url'),
          interests: selected,
          message: form.get('message'),
          consent_confirmed: form.get('consent_confirmed') === 'on',
          company_fax: form.get('company_fax'),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Your feedback could not be saved.')
      setComplete(true)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Your feedback could not be saved.')
    } finally {
      setSubmitting(false)
    }
  }

  if (complete) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-7 text-green-950" role="status">
        <CheckCircle2 className="h-8 w-8 text-green-700" aria-hidden="true" />
        <h3 className="mt-4 font-display text-2xl font-extrabold uppercase">Feedback received</h3>
        <p className="mt-2 leading-7">Thank you. This helps shape the offer; it is not a purchase, reservation, or promise of availability.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-arena-navy">Your name
          <input required minLength={2} maxLength={100} name="contact_name" autoComplete="name" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-bold text-arena-navy">Business name
          <input required minLength={2} maxLength={150} name="business_name" autoComplete="organization" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-bold text-arena-navy">Business email
          <input required type="email" maxLength={320} name="email" autoComplete="email" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-bold text-arena-navy">Website <span className="font-normal text-slate-500">(optional)</span>
          <input type="url" maxLength={2048} name="website_url" autoComplete="url" placeholder="https://" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
      </div>

      <fieldset className="mt-7">
        <legend className="font-bold text-arena-navy">Which ideas would be useful?</legend>
        <div className="mt-3 grid gap-3">
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-400">
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} className="mt-1 h-4 w-4 accent-hockey-blue" />
              <span><span className="block font-bold text-arena-navy">{option.label}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{option.detail}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block text-sm font-bold text-arena-navy">What would make this valuable? <span className="font-normal text-slate-500">(optional)</span>
        <textarea name="message" maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-slate-300 p-3 font-normal" />
      </label>
      <label className="sr-only" aria-hidden="true">Company fax<input name="company_fax" tabIndex={-1} autoComplete="off" /></label>

      <label className="mt-5 flex gap-3 text-sm leading-6 text-slate-700">
        <input required name="consent_confirmed" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-hockey-blue" />
        <span>I agree that The Hockey Directory may store this information and contact me about these product ideas. I understand no paid product is currently available.</span>
      </label>

      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <button disabled={submitting} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-hockey-blue px-6 py-3 font-bold text-white hover:bg-board-blue disabled:cursor-not-allowed disabled:opacity-60">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Saving feedback…' : 'Register interest'}
      </button>
      <p className="mt-3 text-xs leading-5 text-slate-500">No payment is taken. Submitting does not affect search rank, verification, or reviews.</p>
    </form>
  )
}
