import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How The Hockey Directory collects, uses, stores, and shares personal information.',
  alternates: { canonical: '/privacy' },
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-arena-navy">{title}</h2>
    <div className="space-y-4 leading-7 text-slate-700">{children}</div>
  </section>
)

export default function PrivacyPage() {
  return (
    <main className="bg-ice-white py-14">
      <article className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-hockey-blue">Legal</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold uppercase tracking-tight text-arena-navy">Privacy policy</h1>
        <p className="mt-4 text-sm text-slate-500"><strong>Last updated:</strong> August 21, 2026</p>

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 leading-7 text-blue-950">
          The short version: we collect the information needed to run accounts, listing claims, reviews, and advisor inquiries. Optional analytics run only after analytics consent. Saved and comparison lists stay in your browser. We do not sell personal information.
        </div>

        <div className="mt-12 space-y-12">
          <Section title="1. Who we are">
            <p>The Hockey Directory is an independent website that helps hockey families research advisory businesses. “We,” “us,” and “our” refer to The Hockey Directory.</p>
            <p>Questions or privacy requests can be sent to <a className="font-semibold text-hockey-blue underline" href="mailto:privacy@thehockeydirectory.com">privacy@thehockeydirectory.com</a>.</p>
          </Section>

          <Section title="2. Information we collect">
            <h3 className="text-xl font-bold text-arena-navy">Information you provide</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Account details supplied through our authentication provider.</li>
              <li>Review content, rating, confirmation of experience, and the account identifier needed to prevent duplicate reviews.</li>
              <li>Listing-claim details, such as business contact information and supporting material you choose to submit.</li>
              <li>Advisor inquiry details, such as your name, email, optional phone number, optional player age and level, goals, and message.</li>
              <li>Business contact details and product preferences submitted through the advisor-interest form.</li>
              <li>Business profile details submitted by a verified listing owner.</li>
            </ul>
            <p>Please do not put a child’s name, health information, school records, financial information, or other unnecessary sensitive information in a free-text message.</p>

            <h3 className="pt-2 text-xl font-bold text-arena-navy">Information created when you use the site</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Security and anti-abuse data. The application stores a one-way hash derived from an IP address for rate limiting; it does not store the raw IP address in its inquiry or event tables.</li>
              <li>Browser and referral details that help diagnose abuse and understand how an inquiry reached a listing.</li>
              <li>With analytics consent, profile views and contact-link clicks, plus analytics data collected by Google Analytics.</li>
              <li>Saved listings and comparison choices stored locally in your browser. They are not sent to our database by those tools.</li>
            </ul>
            <p>Hosting and security providers may create their own technical logs. Their handling of those logs is governed by their terms and privacy notices.</p>
          </Section>

          <Section title="3. Why we use it">
            <ul className="list-disc space-y-2 pl-6">
              <li>Operate accounts and verify ownership of business listings.</li>
              <li>Deliver an inquiry to the selected business and provide that business with a private inquiry inbox.</li>
              <li>Publish and protect genuine reviews under the directory’s review rules.</li>
              <li>Maintain security, prevent spam, investigate misuse, and troubleshoot the service.</li>
              <li>Measure and improve the directory when you have allowed analytics.</li>
              <li>Evaluate advisor interest in possible paid business tools and follow up with people who ask to help shape them.</li>
              <li>Meet legal obligations and respond to valid legal requests.</li>
            </ul>
          </Section>

          <Section title="4. When information is shared">
            <p>When you submit an advisor inquiry, its contents are made available to the verified owner of that company listing and may be sent to the business by email. Do not use the form if you do not want that business to receive the information.</p>
            <p>We use service providers for functions such as hosting, database storage and authentication, email delivery, media hosting, maps, and consent-based analytics. Current application integrations include Vercel, Supabase, Resend, Cloudinary, Google Maps, and Google Analytics. A service is used only when its feature is configured or loaded.</p>
            <p>We may also disclose information if required by law, to protect users or the service, or as part of a business transaction subject to appropriate safeguards. We do not sell personal information.</p>
          </Section>

          <Section title="5. Cookies and choices">
            <p>Essential cookies support security, account sessions, and core operation. Optional analytics are off until you select “Allow analytics” in the consent banner. You can change that choice by clearing the site’s stored consent in your browser and making a new selection.</p>
            <p>Interactive maps may contact Google when the map feature is loaded. You can browse listing cards without using the map. See the <Link href="/cookie-policy" className="font-semibold text-hockey-blue underline">Cookie Policy</Link> for more detail.</p>
          </Section>

          <Section title="6. Retention and security">
            <p>We keep personal information only as long as reasonably needed for the purpose described above, to maintain necessary business records, resolve disputes, enforce agreements, or meet legal obligations. Retention can differ by record type. A formal deletion schedule should be confirmed before commercial launch.</p>
            <p>We use access controls, row-level database rules, encrypted connections, limited database permissions, and one-way IP hashing. No internet service can promise absolute security.</p>
          </Section>

          <Section title="7. Your requests">
            <p>Depending on where you live, you may have rights to ask about, access, correct, delete, restrict, or object to certain uses of your personal information, and to withdraw consent where processing relies on consent. These rights can have legal exceptions.</p>
            <p>Email <a className="font-semibold text-hockey-blue underline" href="mailto:privacy@thehockeydirectory.com">privacy@thehockeydirectory.com</a> with enough information for us to understand and verify your request. You may also have the right to contact your local privacy regulator.</p>
          </Section>

          <Section title="8. Children and families">
            <p>The directory is intended for adults researching services. We do not knowingly invite children under 13 to create accounts or submit personal information. A parent or guardian should make inquiries for a minor and should share only what is necessary.</p>
          </Section>

          <Section title="9. Changes">
            <p>We may update this notice when the service or its data practices change. The date at the top shows the latest revision. Material changes should also be brought to users’ attention where appropriate.</p>
          </Section>
        </div>
      </article>
    </main>
  )
}
