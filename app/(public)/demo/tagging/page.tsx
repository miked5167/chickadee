import { notFound } from 'next/navigation'
import { searchDirectory } from '@/lib/tags/directory-search'
import { queryParams, type QueryValues } from '@/lib/tags/filter-state'
import { tagPreviewEnabled } from '@/lib/tags/preview-fixtures'
import { AdvisorFilters } from '@/components/search/AdvisorFilters'
import { TaggedDirectoryResults } from '@/components/search/TaggedDirectoryResults'
import { TagSetupPreview } from '@/components/tags/TagSetupPreview'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tagging preview', robots: { index: false, follow: false } }
export default async function TaggingPreview({ searchParams }: { searchParams: Promise<QueryValues> }) {
  if (!tagPreviewEnabled()) notFound()
  const params = await searchParams
  const data = await searchDirectory(queryParams({ ...params, demo: 'tags' }))
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-8 rounded-xl border border-goal-gold bg-white p-6"><h1 className="text-3xl font-bold text-arena-navy">Tagging and filtering preview</h1><p className="mt-3 text-neutral-gray">Fictional advisors and client counts. This development preview does not change live listings.</p><a href="#advisor-tags" className="mt-3 inline-flex min-h-11 items-center font-bold text-hockey-blue underline">Try the advisor tag picker</a></div><div className="flex flex-col gap-8 lg:flex-row"><aside className="shrink-0 lg:w-80"><AdvisorFilters initialData={data} basePath="/demo/tagging" demo /></aside><div className="min-w-0 flex-1"><TaggedDirectoryResults data={data} basePath="/demo/tagging" /></div></div><TagSetupPreview catalog={data.catalog} /></main>
}
