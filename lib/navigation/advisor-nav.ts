import type { NavSection } from '@/components/dashboard/Sidebar'

export const advisorNavigation: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'Home',
      },
      {
        label: 'Edit Profile',
        href: '/dashboard/edit',
        icon: 'User',
      },
    ],
  },
  {
    title: 'Engagement',
    items: [
      {
        label: 'Manage Leads',
        href: '/dashboard/leads',
        icon: 'Mail',
      },
      {
        label: 'View Reviews',
        href: '/dashboard/reviews',
        icon: 'Star',
      },
    ],
  },
]

// Dynamic function to add public profile link
export const getAdvisorNavigation = (advisorSlug?: string): NavSection[] => {
  const nav = [...advisorNavigation]

  if (advisorSlug) {
    nav.push({
      title: 'Public View',
      items: [
        {
          label: 'View Public Profile',
          href: `/listings/${advisorSlug}`,
          icon: 'ExternalLink',
          external: true,
        },
      ],
    })
  }

  return nav
}
