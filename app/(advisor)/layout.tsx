import { redirect } from 'next/navigation'
import { getClaimedAdvisor } from '@/lib/supabase/auth'

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const advisor = await getClaimedAdvisor()

  if (!advisor) {
    redirect('/auth/login?redirectTo=/dashboard')
  }

  return (
    <div className="min-h-screen bg-ice-blue">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
