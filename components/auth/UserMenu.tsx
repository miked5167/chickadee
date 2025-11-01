'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  if (!user) return null

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userAvatar = user.user_metadata?.avatar_url

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-neutral-gray hover:text-primary transition-colors"
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userDisplayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <FiUser className="h-4 w-4 text-white" />
          </div>
        )}
        <span className="hidden md:block">{userDisplayName}</span>
        <FiChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-puck-black truncate">
              {userDisplayName}
            </p>
            <p className="text-xs text-neutral-gray truncate">{user.email}</p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-sm text-neutral-gray hover:bg-ice-blue hover:text-primary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FiSettings className="h-4 w-4 mr-3" />
            Dashboard
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-neutral-gray hover:bg-ice-blue hover:text-red-line transition-colors"
          >
            <FiLogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
