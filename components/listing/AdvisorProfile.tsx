import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Check, ChevronDown, ExternalLink, Globe, Mail, MapPin, MessageSquare, Phone, ShieldCheck, Star } from 'lucide-react'
import { DirectoryShortlistActions } from './DirectoryShortlistActions'
import { ReviewsList } from './ReviewsList'
import { TrackedContactLink } from './TrackedContactLink'
import { CompanyLocationMap } from './CompanyLocationMap'
import { getCompanyLocation } from '@/lib/maps/company-location'
import { CompanyLogo } from './CompanyLogo'
import { FaFacebookF, FaInstagram, FaXTwitter, FaLinkedinIn } from 'react-icons/fa6'
import { linkedInProfileUrl, professionalLinkedInUrl, type CompanyResearch } from '@/lib/research/company-research'
import { reviewedPersonLinkedInUrl } from '@/lib/research/person-linkedin'
import styles from './AdvisorProfile.module.css'
import { eliteProspectsSourceUrl, hasEliteProspectsCount, type EliteProspectsMeasurement } from '@/lib/research/elite-prospects'

export type CompanyProfile = {
  tagline: string | null
  services: string[]
  specialties: string[]
  pathways: string[]
  player_levels: string[]
  age_groups: string[]
  service_areas: string[]
  languages: string[]
  offers_remote: boolean
  accepting_clients: boolean | null
  pricing_models: string[]
  price_min: number | null
  price_max: number | null
  price_currency: string | null
  response_time: string | null
  founded_year: number | null
  business_hours: Record<string, string>
  faq: Array<{ question?: string; answer?: string }>
  last_reviewed_at: string | null
  source_label: string | null
  source_url: string | null
}

export type ProfileCompany = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state_province: string | null
  country: string | null
  instagram_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  verified: boolean | null
  verified_owner_id: string | null
}

export type ProfileTeamMember = {
  id: string
  name: string | null
  title: string | null
  bio: string | null
  profile_image_url: string | null
  linkedin_url?: string | null
  source_url?: string | null
}

export function formatProfilePrice(profile: CompanyProfile | null) {
  if (!profile || (profile.price_min === null && profile.price_max === null)) return null
  // Currency is shown explicitly: a dollar sign alone is ambiguous for Canadian/US families.
  const currency = profile.price_currency?.trim().toUpperCase()
  let formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 2 })
  }
  const min = profile.price_min
  const max = profile.price_max
  const amount = min !== null && max !== null
    ? min === max ? formatter.format(min) : `${formatter.format(min)}–${formatter.format(max)}`
    : min !== null ? `From ${formatter.format(min)}` : `Up to ${formatter.format(max!)}`
  return currency && /^[A-Z]{3}$/.test(currency) ? amount : `${amount} (currency not listed)`
}

function countryName(country: string | null) {
  return country === 'CA' ? 'Canada' : country === 'US' ? 'United States' : country
}

function publicWebUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.detail}><dt>{label}</dt><dd>{children}</dd></div>
}

function WebsiteSource({ url }: { url: string }) {
  const safe = publicWebUrl(url)
  if (!safe) return null
  return <span className={styles.websiteSource}><a href={safe} target="_blank" rel="noopener noreferrer">Company website<ExternalLink size={12} aria-hidden="true" /></a></span>
}

export function AdvisorProfile({ company, profile, teamMembers: existingTeam, averageRating, reviewCount, research = null, eliteProspects = null }: {
  company: ProfileCompany
  profile: CompanyProfile | null
  teamMembers: ProfileTeamMember[]
  averageRating: number | null
  reviewCount: number
  research?: CompanyResearch | null
  eliteProspects?: EliteProspectsMeasurement | null
}) {
  const nameKey = (name: string | null) => (name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
  const teamMembers: ProfileTeamMember[] = existingTeam.map(member => {
    const found = research?.team.find(person => nameKey(person.name) === nameKey(member.name))
    const reviewedLinkedIn = reviewedPersonLinkedInUrl({ companySlug: company.slug, personName: member.name })
    return found
      ? { ...member, title: member.title || found.title, bio: member.bio || found.bio, linkedin_url: found.linkedin_url || reviewedLinkedIn, source_url: found.source_url }
      : { ...member, linkedin_url: reviewedLinkedIn }
  })
  for (const member of research?.team || []) {
    if (!teamMembers.some(person => nameKey(person.name) === nameKey(member.name))) {
      teamMembers.push({ id: `website-${nameKey(member.name)}`, ...member, linkedin_url: member.linkedin_url || reviewedPersonLinkedInUrl({ companySlug: company.slug, personName: member.name }), profile_image_url: null })
    }
  }
  const location = [company.city, company.state_province, countryName(company.country)].filter(Boolean).join(', ')
  const address = [company.address, location].filter(Boolean).join(', ')
  const mapLocation = getCompanyLocation(company)
  const isClaimed = Boolean(company.verified_owner_id)
  const website = publicWebUrl(company.website_url)
  const websiteLabel = website ? new URL(website).hostname.replace(/^www\./, '') : null
  const source = publicWebUrl(profile?.source_url)
  const price = formatProfilePrice(profile)
  const faq = (profile?.faq || []).filter((item) => item.question?.trim() && item.answer?.trim())
  const serviceGroups = [
    { label: 'Services', values: profile?.services?.length ? profile.services : research?.services.map(service => service.text) },
    { label: 'Specialties', values: profile?.specialties },
    { label: 'Hockey pathways', values: profile?.pathways },
    { label: 'Player levels', values: profile?.player_levels },
    { label: 'Age groups', values: profile?.age_groups },
    { label: 'Areas served', values: profile?.service_areas },
  ].filter((group) => group.values?.length)
  const socials = [
    { label: 'Instagram', icon: FaInstagram, brand: 'instagram', url: publicWebUrl(company.instagram_url) },
    { label: 'Facebook', icon: FaFacebookF, brand: 'facebook', url: publicWebUrl(company.facebook_url) },
    { label: 'X', icon: FaXTwitter, brand: 'x', url: publicWebUrl(company.twitter_url) },
    { label: 'LinkedIn', icon: FaLinkedinIn, brand: 'linkedin', url: linkedInProfileUrl(research?.company_linkedin?.url) },
  ].filter((social) => social.url)
  const reviewedDate = profile?.last_reviewed_at ? new Date(profile.last_reviewed_at) : null
  const reviewed = reviewedDate && !Number.isNaN(reviewedDate.getTime())
    ? reviewedDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : null
  const hours = Object.entries(profile?.business_hours || {}).filter(([, value]) => value?.trim())

  return <div className={styles.profile}>
    <div className={styles.breadcrumbBar}>
      <nav aria-label="Breadcrumb" className={`${styles.container} ${styles.breadcrumb}`}>
        <Link href="/listings"><ArrowLeft size={15} aria-hidden="true" />All advisors</Link>
        <span aria-hidden="true">/</span><span aria-current="page">{company.name}</span>
      </nav>
    </div>

    <section className={styles.hero} aria-labelledby="company-name">
      <div className={`${styles.container} ${styles.identity}`}>
        <CompanyLogo company={company} className={styles.logo} />
        <div className={styles.identityText}>
          {(isClaimed || company.verified) && <div className={styles.badges}>
            {company.verified && <a href="#profile-details"><BadgeCheck size={16} aria-hidden="true" />Business details verified</a>}
            {isClaimed && <a href="#profile-details"><ShieldCheck size={16} aria-hidden="true" />Owner connected</a>}
          </div>}
          <h1 id="company-name">{company.name}</h1>
          {profile?.tagline && <p className={styles.tagline}>{profile.tagline}</p>}
          <div className={styles.identityMeta}>
            <span><MapPin size={17} aria-hidden="true" />{location || 'Location not listed'}</span>
            <a href="#reviews">{averageRating !== null && reviewCount > 0
              ? <><Star size={16} aria-hidden="true" />{averageRating.toFixed(1)} / 5 ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</>
              : 'No directory reviews yet'}</a>
          </div>
          <Link className={styles.heroContact} href={`/listings/${company.slug}/contact`}>Send an inquiry</Link>
        </div>
      </div>
    </section>

    <nav aria-label="Company profile sections" className={styles.sectionNav}>
      <div className={styles.container}>
        <a href="#overview">Overview</a><a href="#services">Services & fit</a>
        {teamMembers.length > 0 && <a href="#team">The team</a>}
        <a href="#pricing">Pricing & availability</a><a href="#reviews">Reviews</a>
        {faq.length > 0 && <a href="#questions">FAQ</a>}
        {mapLocation && <a href="#location">Location</a>}
      </div>
    </nav>

    <div className={`${styles.container} ${styles.body}`}>
      <div className={styles.content}>
        <section id="overview" className={styles.section} aria-labelledby="overview-heading">
          {research && <p className={styles.researchNotice}>Local research preview · Website-sourced information, not yet published or confirmed by the company.</p>}
          <h2 id="overview-heading">Get to know {company.name}</h2>
          {research?.overview.length ? <>
            {research.overview.map((fact, index) => <p key={index} className={styles.description}>{fact.text}</p>)}
            {website && <div className={styles.sourceList}><WebsiteSource url={website} /></div>}
          </> : company.description ? <p className={styles.description}>{company.description}</p> : <p className={styles.description}>A company overview has not been added yet. Ask the team about their approach, experience, and the players they work with.</p>}
          {(profile?.founded_year || profile?.languages?.length || profile?.offers_remote) && <dl className={styles.overviewFacts}>
            {profile.founded_year && <Detail label="Established">{profile.founded_year}</Detail>}
            {profile.languages?.length > 0 && <Detail label="Languages">{profile.languages.join(', ')}</Detail>}
            {profile.offers_remote && <Detail label="Meeting options">Remote consultations available</Detail>}
          </dl>}
          {eliteProspects && <div className={styles.eliteProspects}>
            <h3>Elite Prospects clients</h3>
            {hasEliteProspectsCount(eliteProspects) ? <>
              <p className={styles.clientCount}><strong>{eliteProspects.client_count!.toLocaleString('en-US')}</strong> {eliteProspects.client_count === 1 ? 'client listed' : 'clients listed'}</p>
              {eliteProspects.match_status === 'likely' && <p className={styles.matchNotice}>Possible agency match: {eliteProspects.agency_name}. The company match has not been confirmed.</p>}
              <a className={styles.epSource} href={eliteProspectsSourceUrl(eliteProspects.source_url)!} target="_blank" rel="noopener noreferrer"><span>View {eliteProspects.agency_name} on Elite Prospects (Premium subscription required)</span><ExternalLink size={13} aria-hidden="true" /></a>
              <p className={styles.finePrint}>Clients listed in the supplied Elite Prospects data; this may not include every client the company serves. {eliteProspects.source_observed_at ? `Source dated ${new Date(eliteProspects.source_observed_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}.` : 'Source capture date not provided.'}</p>
            </> : <p className={styles.finePrint}>{eliteProspects.match_status === 'ambiguous' ? 'Client count unavailable: the Elite Prospects agency match is unresolved.' : 'No matched Elite Prospects client count is available.'}</p>}
          </div>}
        </section>

        <section id="services" className={styles.section} aria-labelledby="services-heading">
          <h2 id="services-heading">Services & player fit</h2>
          <p className={styles.intro}>Look for experience that matches your player’s stage and next step.</p>
          {serviceGroups.length > 0 ? <dl className={styles.serviceGroups}>
            {serviceGroups.map((group) => <Detail key={group.label} label={group.label}>
              <ul className={styles.tags}>{group.values!.map((value) => <li key={value}>{value}</li>)}</ul>
            </Detail>)}
          </dl> : <div className={styles.missingInfo}>
            <p><strong>Service details not yet listed</strong></p>
            <p>Ask which leagues, age groups, and development pathways the company supports. A listing alone does not confirm expertise in a particular pathway.</p>
          </div>}
          {!profile?.services?.length && Boolean(research?.services.length) && website && <div className={styles.sourceList}><WebsiteSource url={website} /></div>}
        </section>

        {teamMembers.length > 0 && <section id="team" className={styles.section} aria-labelledby="team-heading">
          <div className={styles.headingRow}><h2 id="team-heading">People behind the company</h2><span>{teamMembers.length} listed</span></div>
          <p className={styles.intro}>Get to know the people you may be working with.</p>
          <div className={styles.team}>
            {teamMembers.map((member) => <article key={member.id} className={styles.person}>
              <div className={styles.portrait}>
                {member.profile_image_url
                  ? <img src={member.profile_image_url} alt={`${member.name || 'Team member'} portrait`} loading="lazy" width={64} height={64} />
                  : <span aria-hidden="true">{member.name?.charAt(0) || '—'}</span>}
              </div>
              <div className={styles.personInfo}>
                <h3>{member.name || 'Team member'}</h3>{member.title && <p className={styles.role}>{member.title}</p>}
                {member.bio ? <details className={styles.bio}><summary>Read biography<ChevronDown size={15} aria-hidden="true" /></summary><p>{member.bio}</p></details> : <p className={styles.noBio}>Biography not yet listed.</p>}
                {professionalLinkedInUrl(member.linkedin_url) && <a className={styles.linkedin} href={professionalLinkedInUrl(member.linkedin_url)!} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn — opens in a new tab`}><FaLinkedinIn size={14} aria-hidden="true" />LinkedIn<ExternalLink size={12} aria-hidden="true" /></a>}
                {member.source_url && <WebsiteSource url={member.source_url} />}
              </div>
            </article>)}
          </div>
        </section>}

        <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
          <h2 id="pricing-heading">Pricing & availability</h2>
          <p className={styles.intro}>Understand the commitment before you get started.</p>
          <dl className={styles.pricing}>
            <Detail label="Listed fees"><strong>{price || (research?.pricing.length ? 'See published services below' : 'Not listed in this profile')}</strong></Detail>
            {profile?.pricing_models?.length ? <Detail label="Pricing model">{profile.pricing_models.join(', ')}</Detail> : null}
            <Detail label="New clients">{profile?.accepting_clients === true
              ? <span className={styles.available}><Check size={16} aria-hidden="true" />Accepting new clients</span>
              : profile?.accepting_clients === false ? 'Not currently accepting new clients' : 'Contact the company to confirm'}</Detail>
            {profile?.response_time && <Detail label="Typical response">{profile.response_time}</Detail>}
          </dl>
          {Boolean(research?.pricing.length) && <div className={styles.publishedPrices}>{research!.pricing.map((item, index) => <article key={`${item.name}-${index}`}>
            <h3>{item.name}</h3><p className={styles.packagePrice}>{item.price}</p><p>{item.details}</p><WebsiteSource url={item.source_url} />
          </article>)}</div>}
          <p className={styles.finePrint}>{price || research?.pricing.length ? 'Listed pricing may change. Confirm' : 'Ask for'} a written breakdown of fees, what is included, the billing period, and cancellation terms.</p>
        </section>

        {faq.length > 0 && <section id="questions" className={styles.section} aria-labelledby="questions-heading">
          <h2 id="questions-heading">Common questions</h2>
          <div className={styles.faq}>{faq.map((item) => <details key={item.question}>
            <summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{item.answer}</p>
          </details>)}</div>
        </section>}

        <section id="reviews" className={styles.section} aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">What families are saying</h2>
          <p className={styles.intro}>Reviews submitted to The Hockey Directory.</p>
          <ReviewsList companyId={company.id} companySlug={company.slug} />
        </section>

        {mapLocation && <section id="location" className={styles.section} aria-labelledby="location-heading">
          <h2 id="location-heading">Location</h2>
          <CompanyLocationMap key={company.id} companyName={company.name} location={mapLocation} />
        </section>}

        <section id="profile-details" className={`${styles.section} ${styles.provenance}`} aria-labelledby="details-heading">
          <ShieldCheck size={23} aria-hidden="true" />
          <div><h2 id="details-heading">About this listing</h2>
            <p>A verified badge confirms business details; an owner-connected badge confirms an owner relationship. Neither is an endorsement. Interview advisors and check references before choosing one.</p>
            {reviewed && <p>Profile information reviewed {reviewed}.</p>}
            {(source || profile?.source_label) && <p>Information source: {source ? <a href={source} target="_blank" rel="noopener noreferrer">{profile?.source_label || new URL(source).hostname}<ExternalLink size={12} aria-hidden="true" /></a> : profile?.source_label}</p>}
          </div>
        </section>
      </div>

      <aside className={styles.sidebar} aria-label="Contact and research tools">
        <div className={styles.contactPanel}>
          <h2>Start a conversation</h2>
          <p>Ask about your player’s goals, the company’s approach, and what working together involves.</p>
          <Link className={styles.primaryButton} href={`/listings/${company.slug}/contact`}><MessageSquare size={18} aria-hidden="true" />Send an inquiry</Link>
          <p className={styles.deliveryNote}>{company.email ? 'The company decides whether and when to respond.' : 'No email is listed. Inquiries are saved in the directory; a response is not guaranteed.'}</p>
          <div className={styles.contactLinks}>
            {website && <TrackedContactLink companyId={company.id} type="website" href={website} newWindow><Globe size={18} aria-hidden="true" /><span>Visit website<small>{websiteLabel}</small></span><ExternalLink size={14} aria-hidden="true" /></TrackedContactLink>}
            {company.phone && <TrackedContactLink companyId={company.id} type="phone" href={`tel:${company.phone}`}><Phone size={18} aria-hidden="true" /><span>{company.phone}</span></TrackedContactLink>}
            {company.email && <TrackedContactLink companyId={company.id} type="email" href={`mailto:${company.email}`}><Mail size={18} aria-hidden="true" /><span>{company.email}</span></TrackedContactLink>}
          </div>
          {address && <p className={styles.address}><MapPin size={17} aria-hidden="true" /><span>{address}</span></p>}
          {mapLocation && <a className={styles.locationShortcut} href="#location">View location & Google Maps</a>}
          {hours.length > 0 && <details className={styles.hours}><summary>Listed business hours<ChevronDown size={15} aria-hidden="true" /></summary><dl>{hours.map(([day, value]) => <Detail key={day} label={day}>{value}</Detail>)}</dl></details>}
          {socials.length > 0 && <nav className={styles.socials} aria-label="Company social profiles">
            {socials.map(({ label, icon: Icon, brand, url }) => <a key={brand} href={url!} target="_blank" rel="noopener noreferrer" aria-label={`${label === 'X' ? 'X (Twitter)' : label} — opens in a new tab`}>
              <span className={styles.socialIcon} data-brand={brand}><Icon size={22} aria-hidden="true" focusable="false" /></span>
              <span>{label}</span>
            </a>)}
          </nav>}
          <div className={styles.shortlist}><p>Keep this company on your shortlist</p><DirectoryShortlistActions companyId={company.id} companyName={company.name} showComparisonLink /></div>
        </div>
        <div className={styles.preparation}>
          <h2>Before your first call</h2>
          <ul>
            <li>Who would work directly with my player?</li>
            <li>What experience do you have with our target leagues?</li>
            <li>What is included in your fees?</li>
            <li>Can we speak with recent client references?</li>
          </ul>
        </div>
        {!isClaimed && <div className={styles.owner}><p>Represent {company.name}?</p><Link href={`/claim/${company.slug}`}>Claim and update this listing</Link></div>}
      </aside>
    </div>
  </div>
}
