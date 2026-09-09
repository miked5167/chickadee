import Link from 'next/link'
import { CookieSettingsButton } from './CookieConsent'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const navigation = {
    advisors: [
      { name: 'Find Advisors', href: '/listings' },
      { name: 'Claim Your Listing', href: '/listings' },
      { name: 'Advisor Sign In', href: '/login' },
    ],
    locations: [
      { name: 'Ontario Hockey Advisors', href: '/hockey-advisors/ontario' },
      { name: 'Massachusetts Hockey Advisors', href: '/hockey-advisors/massachusetts' },
      { name: 'British Columbia Advisors', href: '/hockey-advisors/british-columbia' },
      { name: 'Minnesota Hockey Advisors', href: '/hockey-advisors/minnesota' },
    ],
    resources: [
      { name: 'Hockey Glossary', href: '/glossary' },
      { name: 'Family Research Guides', href: '/guides' },
      { name: 'Saved Listings', href: '/saved' },
      { name: 'How the Directory Works', href: '/#how-it-works' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'For Hockey Advisors', href: '/for-advisors' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
    ],
  }

  return (
    <footer className="rink-grid border-t-4 border-red-line bg-arena-navy" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-[1.2fr_2fr] xl:gap-16">
          <div className="space-y-8">
            {/* Logo and Description */}
            <Link href="/" className="inline-block font-display text-3xl font-extrabold uppercase leading-[0.85] tracking-tight text-white">
              <span className="block text-goal-gold">The Hockey</span>
              <span className="block border-b-4 border-red-line pb-2">Directory</span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-frost">
              An independent directory that helps hockey families research advisors, understand pathways, and make more informed first conversations.
            </p>
            <div className="red-line-rule rounded-r-md bg-white/5 py-3 pl-5 pr-4 text-xs leading-5 text-frost">
              Listings may be unclaimed. A verified badge means the business relationship to the listing has been confirmed; it is not an endorsement.
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 md:grid-cols-4">
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Directory</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.advisors.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Top locations</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.locations.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Resources</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-12 md:mt-0">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Company</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-start-4">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Legal</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookieSettingsButton className="text-sm text-gray-400 transition-colors hover:text-white" />
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-8 text-sm text-frost sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} The Hockey Directory. All rights reserved.</p>
          <p>Built for families navigating competitive hockey.</p>
        </div>
      </div>
    </footer>
  )
}
