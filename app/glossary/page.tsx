import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hockey Glossary for Families',
  description: 'Plain-language definitions of common hockey pathways, recruiting terms, and advisor services.',
  alternates: { canonical: '/glossary' },
}

const groups = [
  { title: 'Player levels and pathways', terms: [
    ['AAA hockey', 'A high competitive classification used by many minor hockey organizations. Standards and labels vary by region.'],
    ['Prep school hockey', 'School-based hockey programs that combine academics and competitive play, often with boarding or tuition costs.'],
    ['Junior hockey', 'Post-minor competitive hockey organized through several leagues and classifications. Eligibility, player rights, and costs differ by league.'],
    ['Major junior', 'The Canadian Hockey League pathway made up of the OHL, WHL, and QMJHL. Families should verify current eligibility implications before committing.'],
    ['NCAA hockey', 'College hockey governed by the National Collegiate Athletic Association in the United States. Recruiting and eligibility rules can change.'],
    ['U SPORTS hockey', 'University hockey within Canada’s national university sport system.'],
  ] },
  { title: 'Advisor and recruiting terms', terms: [
    ['Hockey advisor', 'A person or company hired to provide guidance about development, teams, schools, recruiting, or career decisions. Services and qualifications vary.'],
    ['Agent', 'A representative who may negotiate professional playing contracts or related commercial agreements. Licensing requirements depend on the league or association.'],
    ['Family advisor', 'A term often used for an advisor working with amateur players and families. The title itself does not prove a credential or endorsement.'],
    ['Player assessment', 'An evaluation of a player’s current strengths, development needs, and possible next steps, often using live viewing or video.'],
    ['Showcase', 'An event intended to give players exposure to scouts, coaches, or teams. Attendance does not guarantee recruitment.'],
    ['Commitment', 'A stated intention between a player and a program. The practical and legal meaning depends on the league, school, age, and documents involved.'],
  ] },
  { title: 'Directory trust terms', terms: [
    ['Owner connected', 'The directory account has been connected to the business listing through the directory claim process.'],
    ['Business details verified', 'Selected business information has been checked. This is not an endorsement or a guarantee of service quality.'],
    ['Published review', 'A review visible after meeting the directory’s submission and moderation rules. Reviews remain individual opinions.'],
    ['Conflict of interest', 'A financial or personal interest that could influence a recommendation, such as compensation from a referred team, event, or service.'],
  ] },
]

export default function GlossaryPage() {
  const terms = groups.flatMap((group) => group.terms.map(([name, description]) => ({ '@type': 'DefinedTerm', name, description })))
  return <main className="min-h-screen bg-ice-white"><section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-goal-gold">Plain-language reference</p><h1 className="font-display text-5xl font-extrabold uppercase sm:text-6xl">Hockey glossary</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-ice-blue">Useful starting definitions for families. Always confirm current rules with the relevant league, school, or governing body.</p></div></section><div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">{groups.map((group) => <section key={group.title}><h2 className="font-display text-3xl font-bold uppercase text-arena-navy">{group.title}</h2><dl className="mt-5 grid gap-4 md:grid-cols-2">{group.terms.map(([term, definition]) => <div key={term} className="rounded-xl border border-frost bg-white p-5"><dt className="font-display text-xl font-bold uppercase text-hockey-blue">{term}</dt><dd className="mt-2 leading-7 text-neutral-gray">{definition}</dd></div>)}</dl></section>)}<aside className="rounded-xl bg-arena-navy p-6 text-white"><h2 className="font-display text-2xl font-bold uppercase">Need a research process?</h2><p className="mt-2 text-ice-blue">Use our family guides for interview questions, fee comparisons, and due diligence.</p><Link href="/guides" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-goal-gold px-5 font-bold text-arena-navy">Read the guides</Link></aside></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Hockey glossary for families', url: 'https://thehockeydirectory.com/glossary', hasDefinedTerm: terms }) }} /></main>
}
