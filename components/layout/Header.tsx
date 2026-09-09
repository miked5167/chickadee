'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/use-auth'
import { UserMenu } from '@/components/auth/UserMenu'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const navigation = [
    { name: 'Find Advisors', href: '/listings' },
    { name: 'Saved', href: '/saved' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Guides', href: '/guides' },
    { name: 'Hockey Glossary', href: '/glossary' },
    { name: 'About', href: '/about' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-frost/80 bg-ice-white/95 backdrop-blur-xl">
      <div className="hidden bg-arena-navy text-ice-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <span>Independent guidance for hockey families</span>
          <span className="text-frost">Canada · United States</span>
        </div>
      </div>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/hockey-directory-logo-v7.png"
                alt="The Hockey Directory"
                width={2087}
                height={753}
                priority
                className="h-12 w-auto sm:h-14"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-7">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-sm text-sm font-semibold text-arena-navy transition-colors hover:text-hockey-blue focus-visible:outline-offset-4"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-neutral-gray/20 rounded-full" />
            ) : user ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-arena-navy transition-colors hover:text-hockey-blue"
                >
                  Sign In
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-line px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-line/90"
                >
                  Claim a Listing
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-gray hover:text-primary hover:bg-ice-blue transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <FiX className="h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div id="mobile-navigation" className="border-t border-border py-4 md:hidden">
            <div className="space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-neutral-gray hover:text-primary hover:bg-ice-blue rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border my-4"></div>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-neutral-gray hover:text-primary hover:bg-ice-blue rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-neutral-gray hover:text-red-line hover:bg-ice-blue rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-base font-medium text-neutral-gray hover:text-primary hover:bg-ice-blue rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/listings"
                    className="block min-h-11 rounded-lg bg-red-line px-3 py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-red-line/90"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Claim a Listing
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
