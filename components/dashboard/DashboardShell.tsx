'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import type { NavSection } from '@/components/dashboard/Sidebar'

interface DashboardShellProps {
  sections: NavSection[]
  userName?: string
  userRole?: string
  children: React.ReactNode
}

export function DashboardShell({ sections, userName, userRole, children }: DashboardShellProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        sections={sections}
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />
      <main className="pt-16 lg:pt-0 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
