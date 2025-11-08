import Link from 'next/link'
import Image from 'next/image'
import { FiTwitter, FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const navigation = {
    advisors: [
      { name: 'Find Advisors', href: '/listings' },
      { name: 'Claim Your Listing', href: '/claim' },
      { name: 'Featured Advisors', href: '/listings?featured=true' },
      { name: 'Top Rated Advisors', href: '/listings?sort=rating' },
    ],
    locations: [
      { name: 'Toronto Hockey Advisors', href: '/listings?city=Toronto' },
      { name: 'Boston Hockey Advisors', href: '/listings?city=Boston' },
      { name: 'Vancouver Hockey Advisors', href: '/listings?city=Vancouver' },
      { name: 'Minneapolis Hockey Advisors', href: '/listings?city=Minneapolis' },
      { name: 'Chicago Hockey Advisors', href: '/listings?city=Chicago' },
      { name: 'Detroit Hockey Advisors', href: '/listings?city=Detroit' },
    ],
    resources: [
      { name: 'Blog', href: '/blog' },
      { name: 'Player Development', href: '/blog/category/player-development' },
      { name: 'College Recruitment', href: '/blog/category/college-recruitment' },
      { name: 'Parent Tips', href: '/blog/category/parent-tips' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Submit a Listing', href: '/submit' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
    ],
    social: [
      {
        name: 'Twitter',
        href: '#',
        icon: FiTwitter,
      },
      {
        name: 'Facebook',
        href: '#',
        icon: FiFacebook,
      },
      {
        name: 'Instagram',
        href: '#',
        icon: FiInstagram,
      },
      {
        name: 'LinkedIn',
        href: '#',
        icon: FiLinkedin,
      },
    ],
  }

  return (
    <footer className="bg-puck-black" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            {/* Logo and Description */}
            <Link href="/" className="inline-block">
              <Image
                src="/hockey-directory-logo-v6.png"
                alt="The Hockey Directory"
                width={600}
                height={150}
                className="h-24 w-auto sm:h-28"
              />
            </Link>
            <p className="text-sm text-gray-400">
              Connecting hockey families with trusted advisors and development professionals across North America.
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Advisors</h3>
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
              <h3 className="text-sm font-semibold text-white">Top Locations</h3>
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
              <h3 className="text-sm font-semibold text-white">Resources</h3>
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
              <h3 className="text-sm font-semibold text-white">Company</h3>
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
            <div className="mt-12 md:mt-0">
              <h3 className="text-sm font-semibold text-white">Legal</h3>
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
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-400 text-center">
            &copy; {currentYear} The Hockey Directory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
