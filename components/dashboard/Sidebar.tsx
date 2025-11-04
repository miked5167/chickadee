'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Star,
  Users,
  TrendingUp,
  CheckCircle,
  Home,
  User,
  Mail,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: string
  external?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Star,
  Users,
  TrendingUp,
  CheckCircle,
  Home,
  User,
  Mail,
  ExternalLink,
}

interface SidebarProps {
  sections: NavSection[]
  userName?: string
  userRole?: string
  onLogout?: () => void
}

export function Sidebar({ sections, userName, userRole, onLogout }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === pathname) return true
    // Check if current path starts with the nav item path (for sub-pages)
    if (pathname.startsWith(href) && href !== '/') return true
    return false
  }

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)
  const closeMobile = () => setIsMobileOpen(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMobile}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="font-bold text-xl text-hockey-blue">
            The Hockey Directory
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 top-[60px]"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
          "w-64 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Link href="/" className="font-bold text-xl text-hockey-blue hover:text-red-line transition-colors">
              The Hockey Directory
            </Link>
          </div>

          {/* User Info */}
          {userName && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-hockey-blue text-ice-white flex items-center justify-center font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  {userRole && <p className="text-xs text-gray-500">{userRole}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                {section.title && (
                  <h3 className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1 px-3">
                  {section.items.map((item) => {
                    const Icon = iconMap[item.icon]
                    const active = isActive(item.href)

                    if (!Icon) return null

                    if (item.external) {
                      return (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              "text-gray-700 hover:bg-ice-blue hover:text-hockey-blue"
                            )}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </a>
                        </li>
                      )
                    }

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            active
                              ? "bg-hockey-blue text-ice-white"
                              : "text-gray-700 hover:bg-ice-blue hover:text-hockey-blue"
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          {onLogout && (
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="outline"
                className="w-full"
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Spacer for fixed sidebar on desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}
