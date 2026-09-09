const publicDirectoryOrigin = 'https://thehockeydirectory.com'

export function publicPreviewFeedUrl(searchParams: URLSearchParams) {
  if (process.env.DIRECTORY_PREVIEW_SOURCE_URL !== publicDirectoryOrigin) return null
  return `${publicDirectoryOrigin}/api/advisors?${searchParams.toString()}`
}

export function publicPreviewProfileUrl(slug: string) {
  if (process.env.DIRECTORY_PREVIEW_SOURCE_URL !== publicDirectoryOrigin) return null
  return `${publicDirectoryOrigin}/listings/${encodeURIComponent(slug)}`
}
