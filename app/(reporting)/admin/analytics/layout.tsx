import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminAuthorization } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Directory Analytics', robots: { index: false, follow: false } }

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const authorization = await getAdminAuthorization()
  if (authorization.status === 'unauthenticated') redirect('/login?returnTo=/admin/analytics')
  if (authorization.status === 'forbidden') redirect('/?notice=administrator-access-required')
  return children
}
