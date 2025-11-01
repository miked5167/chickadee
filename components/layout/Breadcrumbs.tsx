'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiChevronRight, FiHome } from 'react-icons/fi'

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on homepage
  if (pathname === '/') return null

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Format the label
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Custom labels for known routes
      if (segment === 'listings') label = 'Find Advisors'
      if (segment === 'blog') label = 'Blog'
      if (segment === 'about') label = 'About'

      breadcrumbs.push({
        label,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Generate Schema.org BreadcrumbList structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
      },
      ...breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: crumb.label,
        item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${crumb.href}`,
      })),
    ],
  }

  return (
    <>
      {/* Schema.org JSON-LD markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual breadcrumbs */}
      <nav className="bg-ice-blue border-b border-border" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            {/* Home */}
            <li>
              <Link
                href="/"
                className="text-neutral-gray hover:text-primary transition-colors flex items-center"
              >
                <FiHome className="h-4 w-4" aria-label="Home" />
              </Link>
            </li>

            {/* Dynamic breadcrumbs */}
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center">
                <FiChevronRight className="h-4 w-4 text-neutral-gray mx-2" />
                {index === breadcrumbs.length - 1 ? (
                  // Current page (not a link)
                  <span className="text-puck-black font-medium" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  // Link to previous pages
                  <Link
                    href={crumb.href}
                    className="text-neutral-gray hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  )
}
