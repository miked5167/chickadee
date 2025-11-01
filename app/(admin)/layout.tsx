import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/supabase/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userIsAdmin = await isAdmin()

  if (!userIsAdmin) {
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
