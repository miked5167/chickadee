import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all companies
  const { data: companies } = await supabase
    .from('companies')
    .select('slug, updated_at')

  const companyUrls = (companies || []).map((company) => ({
    url: `https://thehockeydirectory.com/listings/${company.slug}`,
    lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://thehockeydirectory.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://thehockeydirectory.com/listings',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://thehockeydirectory.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...companyUrls,
  ]
}
