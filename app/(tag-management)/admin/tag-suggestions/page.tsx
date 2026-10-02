import { redirect } from 'next/navigation'
import { getAdminAuthorization } from '@/lib/supabase/auth'
import { TagSuggestionQueue } from '@/components/admin/TagSuggestionQueue'

export const dynamic = 'force-dynamic'

export default async function TagSuggestionsPage() {
  const authorization = await getAdminAuthorization()
  if (authorization.status === 'unauthenticated') redirect('/login?returnTo=/admin/tag-suggestions')
  if (authorization.status === 'forbidden') redirect('/?notice=administrator-access-required')
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <h1 className="font-display text-4xl font-extrabold uppercase text-arena-navy">Review suggested tags</h1>
    <p className="mt-3 text-neutral-gray">Approve a clear, reusable label for the directory. Approval adds an option to the controlled list; the advisor must select it for their listing.</p>
    <TagSuggestionQueue />
  </main>
}
