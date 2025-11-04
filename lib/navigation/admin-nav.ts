import type { NavSection } from '@/components/dashboard/Sidebar'

export const adminNavigation: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: 'LayoutDashboard',
      },
    ],
  },
  {
    title: 'Content Management',
    items: [
      {
        label: 'Manage Listings',
        href: '/admin/listings',
        icon: 'FileText',
      },
      {
        label: 'Manage Claims',
        href: '/admin/claims',
        icon: 'CheckCircle',
      },
      {
        label: 'Moderate Reviews',
        href: '/admin/reviews',
        icon: 'Star',
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        label: 'View All Leads',
        href: '/admin/leads',
        icon: 'Users',
      },
      {
        label: 'Blog Analytics',
        href: '/admin/blog/analytics',
        icon: 'TrendingUp',
      },
    ],
  },
]
