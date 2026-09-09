import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { getAdminAuthorization } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout() {
  const authorization = await getAdminAuthorization()

  if (authorization.status === 'unauthenticated') {
    redirect('/login?returnTo=/admin/dashboard')
  }

  if (authorization.status === 'forbidden') {
    redirect('/?notice=administrator-access-required')
  }

  return (
    <main className="min-h-screen bg-ice-white px-4 py-20">
      <div className="mx-auto max-w-2xl rounded-2xl border border-blue-200 bg-white p-8 shadow-lg sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-hockey-blue">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-7 font-display text-sm font-bold uppercase tracking-[0.2em] text-hockey-blue">Safety lock</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-arena-navy">Administrator workflows are unavailable</h1>
        <p className="mt-5 leading-7 text-slate-700">
          Your administrator authorization was confirmed, but listing, claim, review, lead, and publishing operations remain disabled until the secure administrator bootstrap and production cutover are completed.
        </p>
        <div className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          This page does not grant access, change a role, or enable a database mutation.
        </div>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-hockey-blue px-5 py-3 font-bold text-white hover:bg-board-blue">
          Return to the directory
        </Link>
      </div>
    </main>
  )
}
