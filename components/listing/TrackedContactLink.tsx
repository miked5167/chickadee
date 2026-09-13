'use client'

import type { ReactNode } from 'react'
import { recordDirectoryEvent } from '@/lib/analytics/client'

export function TrackedContactLink({
  companyId,
  type,
  href,
  className,
  children,
  newWindow = false,
}: {
  companyId: string
  type: 'website' | 'email' | 'phone'
  href: string
  className?: string
  children: ReactNode
  newWindow?: boolean
}) {
  function recordClick() {
    void recordDirectoryEvent(companyId, type)
  }

  return <a href={href} onClick={recordClick} className={className} {...(newWindow ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>
}
