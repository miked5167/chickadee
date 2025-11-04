'use client'

import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'

interface SocialLinksProps {
  linkedin?: string | null
  instagram?: string | null
  twitter?: string | null
  facebook?: string | null
  youtube?: string | null
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

export function SocialLinks({
  linkedin,
  instagram,
  twitter,
  facebook,
  youtube,
  size = 'md',
  showLabels = false
}: SocialLinksProps) {
  const socialLinks = [
    {
      name: 'LinkedIn',
      url: linkedin,
      icon: Linkedin,
      color: 'hover:bg-[#0077B5] hover:text-white',
      bgColor: 'bg-[#0077B5]'
    },
    {
      name: 'Instagram',
      url: instagram,
      icon: Instagram,
      color: 'hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white',
      bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]'
    },
    {
      name: 'Twitter',
      url: twitter,
      icon: Twitter,
      color: 'hover:bg-[#1DA1F2] hover:text-white',
      bgColor: 'bg-[#1DA1F2]'
    },
    {
      name: 'Facebook',
      url: facebook,
      icon: Facebook,
      color: 'hover:bg-[#1877F2] hover:text-white',
      bgColor: 'bg-[#1877F2]'
    },
    {
      name: 'YouTube',
      url: youtube,
      icon: Youtube,
      color: 'hover:bg-[#FF0000] hover:text-white',
      bgColor: 'bg-[#FF0000]'
    }
  ]

  // Filter out links that don't have URLs
  const availableLinks = socialLinks.filter(link => link.url)

  if (availableLinks.length === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {availableLinks.map((link) => {
        const Icon = link.icon
        return (
          <a
            key={link.name}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              ${sizeClasses[size]}
              rounded-full
              flex items-center justify-center
              border-2 border-gray-300
              text-gray-600
              transition-all duration-200
              ${link.color}
              hover:border-transparent
              hover:scale-110
              ${showLabels ? 'gap-2 px-4 w-auto' : ''}
            `}
            title={`Visit our ${link.name}`}
            aria-label={link.name}
          >
            <Icon size={iconSizes[size]} />
            {showLabels && (
              <span className="text-sm font-medium">{link.name}</span>
            )}
          </a>
        )
      })}
    </div>
  )
}
