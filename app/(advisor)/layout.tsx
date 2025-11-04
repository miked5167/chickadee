import { redirect } from 'next/navigation'
import { getClaimedAdvisor } from '@/lib/supabase/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { getAdvisorNavigation } from '@/lib/navigation/advisor-nav'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const advisor = await getClaimedAdvisor()

  if (!advisor) {
    redirect('/auth/login?redirectTo=/dashboard')
  }

  const navigation = getAdvisorNavigation(advisor.slug)

  return (
    <DashboardShell
      sections={navigation}
      userName={advisor.name}
      userRole="Advisor"
    >
      {children}
    </DashboardShell>
  )
}
