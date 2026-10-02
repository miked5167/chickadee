export type EliteProspectsMeasurement = {
  match_status: 'exact' | 'likely' | 'none' | 'ambiguous'
  agency_name: string | null
  source_url: string | null
  client_count: number | null
  source_observed_at: string | null
  imported_at: string
}

export function eliteProspectsSourceUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'www.eliteprospects.com'
      && !url.username && !url.password && !url.port
      && /^\/agent-portal\/\d+\/[^/]+$/.test(url.pathname) ? url.href : null
  } catch { return null }
}

export function hasEliteProspectsCount(measurement: EliteProspectsMeasurement | null) {
  return Boolean(measurement && ['exact', 'likely'].includes(measurement.match_status)
    && Number.isSafeInteger(measurement.client_count) && measurement.client_count! >= 0
    && measurement.agency_name?.trim() && eliteProspectsSourceUrl(measurement.source_url))
}
