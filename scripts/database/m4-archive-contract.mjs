import assert from 'node:assert/strict'

// M3 has 1,337 entries. M4 adds these 24 objects, including nine column ACLs.
export const m4ArchiveEntryCount = 1361
export const m4ArchiveAdditions = [
  'TABLE public reviews postgres',
  'ACL public TABLE reviews postgres',
  ...['id', 'company_id', 'reviewer_user_id', 'rating', 'title', 'review_text', 'experience_confirmed_at', 'created_at', 'updated_at']
    .map((column) => `ACL public COLUMN reviews.${column} postgres`),
  'TABLE DATA public reviews postgres',
  'CONSTRAINT public reviews reviews_company_reviewer_key postgres',
  'CONSTRAINT public reviews reviews_pkey postgres',
  'INDEX public reviews_company_published_idx postgres',
  'INDEX public reviews_reviewer_idx postgres',
  'TRIGGER public reviews update_reviews_updated_at postgres',
  'FK CONSTRAINT public reviews reviews_company_id_fkey postgres',
  'FK CONSTRAINT public reviews reviews_reviewer_user_id_fkey postgres',
  ...['Published company reviews are public', 'Users can create own company reviews', 'Users can delete own company reviews', 'Users can update own company reviews']
    .map((policy) => `POLICY public reviews ${policy} postgres`),
  'ROW SECURITY public reviews postgres',
].sort()

export function validateM4ArchiveEntries(lines) {
  const entries = lines.filter((line) => line.trim() && !line.startsWith(';'))
  assert.equal(entries.length, m4ArchiveEntryCount, 'M4 archive entry count differs')
  const reviews = entries.map((line) => line.replace(/^\d+; \d+ \d+ /, ''))
    .filter((line) => /\breviews(?:[ ._]|$)/.test(line)).sort()
  assert.deepEqual(reviews, m4ArchiveAdditions, 'M4 archive review objects differ')
}

export function isM4ArchiveCountFailure(status) {
  return status.success === false && status.status === 'failed' && status.production_changes_made === true &&
    status.verification_only === true && status.apply_reinvoked === false && status.baseline_ddl_executed === false &&
    status.first_admin_created === false && status.review_rows_created === 0 &&
    status.error === 'Post-M4 archive has 1361 entries instead of exact target count 1356.'
}
