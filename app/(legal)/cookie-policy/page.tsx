import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'The cookies and browser storage used by The Hockey Directory, including optional analytics.',
  alternates: { canonical: '/cookie-policy' },
}

export default function CookiePolicyPage() {
  return (
    <main className="bg-ice-white py-14">
      <article className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-hockey-blue">Legal</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold uppercase tracking-tight text-arena-navy">Cookie policy</h1>
        <p className="mt-4 text-sm text-slate-500"><strong>Last updated:</strong> August 21, 2026</p>

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 leading-7 text-blue-950">
          Optional analytics are off until you allow them. We do not currently use advertising or retargeting cookies.
        </div>

        <div className="mt-12 space-y-12 leading-7 text-slate-700">
          <section>
            <h2 className="font-display text-3xl font-extrabold uppercase text-arena-navy">What the site stores</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse overflow-hidden rounded-lg bg-white text-left text-sm">
                <thead className="bg-arena-navy text-white"><tr><th className="p-4">Storage</th><th className="p-4">Purpose</th><th className="p-4">When used</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-4 font-semibold">Supabase authentication cookies</td><td className="p-4">Keep signed-in accounts secure and maintain the session.</td><td className="p-4">When you sign in.</td></tr>
                  <tr><td className="p-4 font-semibold">hockey-directory-cookie-consent</td><td className="p-4">Stores whether you allowed analytics and the date of that choice.</td><td className="p-4">After you accept, decline, or dismiss the banner.</td></tr>
                  <tr><td className="p-4 font-semibold">Google Analytics storage</td><td className="p-4">Measures site use. Cookie names and duration are controlled by Google and can change.</td><td className="p-4">Only after you allow analytics and only when an analytics ID is configured.</td></tr>
                  <tr><td className="p-4 font-semibold">Saved and comparison lists</td><td className="p-4">Keeps your saved listing IDs and up to three comparison choices in this browser.</td><td className="p-4">When you use Save or Compare.</td></tr>
                  <tr><td className="p-4 font-semibold">detectedLocation</td><td className="p-4">Temporarily caches a location you ask the browser to detect so distance search does not repeat immediately.</td><td className="p-4">Only when you use location detection; it expires after about 30 minutes.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl font-extrabold uppercase text-arena-navy">Necessary and optional use</h2>
            <p className="mt-4">Authentication and security storage is necessary when you use an account. Browser storage for Save, Compare, and your consent choice supports features you request.</p>
            <p className="mt-4">Google Analytics does not load until the stored consent choice says analytics are allowed. Declining or dismissing the banner keeps it off. The application also sends its own profile-view and contact-click events only after that same analytics choice.</p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-extrabold uppercase text-arena-navy">Maps and location</h2>
            <p className="mt-4">Opening an interactive map can connect your browser to Google Maps. If you ask the directory to detect your location, your browser requests permission and the location utility may contact OpenStreetMap’s Nominatim service to convert coordinates into a place name. You can use listing cards without these options.</p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-extrabold uppercase text-arena-navy">Change or clear your choice</h2>
            <p className="mt-4">You can remove the site’s stored data in your browser settings. Clearing <strong>hockey-directory-cookie-consent</strong> makes the banner appear again so you can choose again. Blocking all cookies may prevent sign-in from working.</p>
            <p className="mt-4">You can also manage or delete cookies through your browser. Google provides a separate <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="font-semibold text-hockey-blue underline">Analytics opt-out browser add-on</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-extrabold uppercase text-arena-navy">Questions</h2>
            <p className="mt-4">Email <a href="mailto:privacy@thehockeydirectory.com" className="font-semibold text-hockey-blue underline">privacy@thehockeydirectory.com</a>. For the broader explanation of personal information, service providers, retention, and individual requests, read our <Link href="/privacy" className="font-semibold text-hockey-blue underline">Privacy Policy</Link>.</p>
          </section>
        </div>
      </article>
    </main>
  )
}
