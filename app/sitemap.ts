import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'
import { guides } from '@/lib/content/guides'

const siteUrl = 'https://thehockeydirectory.com'
const regionSlugs = ['canada', 'united-states', 'ontario', 'quebec', 'british-columbia', 'alberta', 'michigan', 'minnesota', 'massachusetts', 'new-york']
const pathwaySlugs = ['prep-school', 'junior-hockey', 'ncaa', 'u-sports', 'professional-hockey']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all companies
  const { data: companies } = await supabase
    .from('companies')
    .select('slug, updated_at')

  const companyUrls = (companies || []).map((company) => ({
    url: `${siteUrl}/listings/${company.slug}`,
    lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/for-advisors`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    { url: `${siteUrl}/guides`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/glossary`, changeFrequency: 'monthly', priority: 0.7 },
    ...guides.map((guide) => ({ url: `${siteUrl}/guides/${guide.slug}`, lastModified: new Date(guide.updated), changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...regionSlugs.map((region) => ({ url: `${siteUrl}/hockey-advisors/${region}`, changeFrequency: 'weekly' as const, priority: 0.75 })),
    ...pathwaySlugs.map((pathway) => ({ url: `${siteUrl}/hockey-pathways/${pathway}`, changeFrequency: 'weekly' as const, priority: 0.75 })),
    ...companyUrls,
  ]
}
