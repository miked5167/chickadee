const publicDirectoryOrigin = 'https://thehockeydirectory.com'

function usesPublicDirectoryPreview() {
  return process.env.VERCEL_ENV === 'preview'
    || process.env.DIRECTORY_PREVIEW_SOURCE_URL === publicDirectoryOrigin
}

export function publicPreviewFeedUrl(searchParams: URLSearchParams) {
  if (!usesPublicDirectoryPreview()) return null
  return `${publicDirectoryOrigin}/api/advisors?${searchParams.toString()}`
}

export function publicPreviewProfileUrl(slug: string) {
  if (!usesPublicDirectoryPreview()) return null
  return `${publicDirectoryOrigin}/listings/${encodeURIComponent(slug)}`
}
