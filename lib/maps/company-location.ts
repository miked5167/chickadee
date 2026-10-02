export type CompanyLocationInput = {
  name: string
  address: string | null
  city: string | null
  state_province: string | null
  country: string | null
}

function locationPart(value: string | null) {
  const text = value?.trim() || ''
  return /^(unknown|n\/?a|not listed|not provided|remote|online|-)$/i.test(text) ? '' : text
}

/** Maps searches are not verified Google Business matches or verified office locations. */
export function getCompanyLocation(company: CompanyLocationInput) {
  const street = locationPart(company.address)
  const city = locationPart(company.city)
  const region = locationPart(company.state_province)
  const rawCountry = locationPart(company.country)
  const country = rawCountry === 'CA' ? 'Canada' : rawCountry === 'US' ? 'United States' : rawCountry
  // A country/region alone is too broad; an unqualified street or city is ambiguous.
  if (!(street && (city || region || country)) && !(city && (region || country))) return null
  const hasStreet = Boolean(street && street.toLowerCase() !== city.toLowerCase())
  const label = [hasStreet ? street : '', city, region, country].filter(Boolean).join(', ')
  const mapsUrl = (query: string) => `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`
  return {
    kind: hasStreet ? 'address' as const : 'area' as const,
    label,
    mapQuery: label,
    companySearchUrl: mapsUrl([company.name.trim(), label].filter(Boolean).join(', ')),
    locationUrl: mapsUrl(label),
  }
}

export type CompanyLocationDetails = NonNullable<ReturnType<typeof getCompanyLocation>>
