import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy - The Hockey Directory',
  description: 'Cookie Policy for The Hockey Directory - Learn about how we use cookies and tracking technologies on our website.',
}

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 4, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
          <p className="mb-4">
            Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
          <p className="mb-4">
            Cookies help us understand how you use our website, remember your preferences, and improve your overall experience on The Hockey Directory.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p className="mb-4">
            The Hockey Directory uses cookies and similar tracking technologies for the following purposes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Essential website functionality and security</li>
            <li>Remembering your preferences and settings</li>
            <li>Analyzing how visitors use our website</li>
            <li>Improving website performance and user experience</li>
            <li>Authenticating users and preventing fraud</li>
            <li>Measuring the effectiveness of our marketing campaigns</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold mb-3">3.1 Strictly Necessary Cookies</h3>
          <p className="mb-4">
            These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of these cookies.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Authentication cookies:</strong> Keep you logged in as you navigate the site</li>
            <li><strong>Security cookies:</strong> Protect against CSRF attacks and ensure secure connections</li>
            <li><strong>Load balancing cookies:</strong> Distribute traffic across our servers</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 Performance Cookies</h3>
          <p className="mb-4">
            These cookies collect information about how visitors use our website, such as which pages are visited most often and if users receive error messages. These cookies don't collect personally identifiable information.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Analytics cookies:</strong> Help us understand user behavior and improve our website</li>
            <li><strong>Error tracking cookies:</strong> Help us identify and fix technical issues</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 Functionality Cookies</h3>
          <p className="mb-4">
            These cookies allow the website to remember choices you make (such as your location or language) and provide enhanced, personalized features.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Location cookies:</strong> Remember your location for distance-based search</li>
            <li><strong>UI customization cookies:</strong> Remember your display preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.4 Targeting/Advertising Cookies</h3>
          <p className="mb-4">
            These cookies are used to deliver advertisements that are relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Advertising cookies:</strong> Track your browsing habits to show relevant ads</li>
            <li><strong>Social media cookies:</strong> Enable social sharing functionality</li>
            <li><strong>Retargeting cookies:</strong> Show you ads for services you've viewed</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
          <p className="mb-4">
            We work with third-party service providers who may also set cookies on your device when you visit our website. These include:
          </p>

          <h3 className="text-xl font-semibold mb-3">4.1 Google Analytics</h3>
          <p className="mb-4">
            We use Google Analytics to understand how visitors interact with our website. Google Analytics uses cookies to collect anonymous information such as:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Number of visitors to the site</li>
            <li>Pages visited and time spent on each page</li>
            <li>Geographic location (country/region level)</li>
            <li>Device and browser information</li>
          </ul>
          <p className="mb-4">
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Google Analytics Privacy Policy
            </a>
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 Google OAuth</h3>
          <p className="mb-4">
            When you sign in with Google, Google sets cookies to manage your authentication session. This allows you to stay logged in across sessions.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.3 Vercel Analytics</h3>
          <p className="mb-4">
            Our hosting provider, Vercel, uses analytics cookies to monitor website performance and user experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookie Duration</h2>
          <p className="mb-4">
            Cookies can be either session cookies or persistent cookies:
          </p>

          <h3 className="text-xl font-semibold mb-3">5.1 Session Cookies</h3>
          <p className="mb-4">
            These cookies are temporary and are deleted when you close your browser. They help us track your movement from page to page so you don't have to re-enter information.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.2 Persistent Cookies</h3>
          <p className="mb-4">
            These cookies remain on your device for a set period or until you manually delete them. They help us remember your preferences for future visits.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Authentication cookies:</strong> Up to 30 days</li>
            <li><strong>Preference cookies:</strong> Up to 1 year</li>
            <li><strong>Analytics cookies:</strong> Up to 26 months</li>
            <li><strong>Advertising cookies:</strong> Up to 13 months</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. How to Control Cookies</h2>
          <p className="mb-4">
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences through:
          </p>

          <h3 className="text-xl font-semibold mb-3">6.1 Cookie Consent Banner</h3>
          <p className="mb-4">
            When you first visit our website, you'll see a cookie consent banner where you can accept or reject non-essential cookies. You can change your preferences at any time by clicking the "Cookie Settings" link in the footer.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.2 Browser Settings</h3>
          <p className="mb-4">
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>View what cookies are stored and delete them individually</li>
            <li>Block all cookies from specific websites</li>
            <li>Block all third-party cookies</li>
            <li>Block all cookies from all websites</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>

          <p className="mb-4">
            Here's how to manage cookies in popular browsers:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Chrome:</strong>{' '}
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Cookie settings for Chrome
              </a>
            </li>
            <li>
              <strong>Firefox:</strong>{' '}
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Cookie settings for Firefox
              </a>
            </li>
            <li>
              <strong>Safari:</strong>{' '}
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Cookie settings for Safari
              </a>
            </li>
            <li>
              <strong>Edge:</strong>{' '}
              <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Cookie settings for Edge
              </a>
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.3 Opt-Out Tools</h3>
          <p className="mb-4">
            You can also use these tools to opt out of certain types of tracking:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google Analytics Opt-out Browser Add-on
              </a>
            </li>
            <li>
              <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Network Advertising Initiative Opt-Out
              </a>
            </li>
            <li>
              <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Digital Advertising Alliance Opt-Out
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Impact of Disabling Cookies</h2>
          <p className="mb-4">
            If you choose to disable cookies, some features of our website may not function properly:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>You may not be able to stay logged in</li>
            <li>Your preferences and settings may not be saved</li>
            <li>Some features may not work as intended</li>
            <li>You may have to re-enter information on each visit</li>
          </ul>
          <p className="mb-4">
            Please note that disabling cookies will not prevent you from browsing our website, but it may impact your experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Do Not Track Signals</h2>
          <p className="mb-4">
            Some browsers have a "Do Not Track" (DNT) feature that lets you tell websites you don't want your online activities tracked. We honor DNT signals and will not track your activity when a DNT signal is present.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Other Tracking Technologies</h2>
          <p className="mb-4">
            In addition to cookies, we may use other tracking technologies:
          </p>

          <h3 className="text-xl font-semibold mb-3">9.1 Web Beacons</h3>
          <p className="mb-4">
            Small graphic images (also known as pixel tags) that work with cookies to identify users and track behavior.
          </p>

          <h3 className="text-xl font-semibold mb-3">9.2 Local Storage</h3>
          <p className="mb-4">
            HTML5 local storage that allows us to store data locally in your browser for better performance and user experience.
          </p>

          <h3 className="text-xl font-semibold mb-3">9.3 Session Storage</h3>
          <p className="mb-4">
            Temporary storage that is cleared when you close your browser tab.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Cookie List</h2>
          <p className="mb-4">
            Here's a detailed list of cookies we use:
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">auth_token</td>
                  <td className="border border-gray-300 px-4 py-2">Necessary</td>
                  <td className="border border-gray-300 px-4 py-2">User authentication</td>
                  <td className="border border-gray-300 px-4 py-2">30 days</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">session_id</td>
                  <td className="border border-gray-300 px-4 py-2">Necessary</td>
                  <td className="border border-gray-300 px-4 py-2">Session management</td>
                  <td className="border border-gray-300 px-4 py-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">cookie_consent</td>
                  <td className="border border-gray-300 px-4 py-2">Necessary</td>
                  <td className="border border-gray-300 px-4 py-2">Store cookie preferences</td>
                  <td className="border border-gray-300 px-4 py-2">1 year</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">_ga</td>
                  <td className="border border-gray-300 px-4 py-2">Analytics</td>
                  <td className="border border-gray-300 px-4 py-2">Google Analytics visitor tracking</td>
                  <td className="border border-gray-300 px-4 py-2">2 years</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">_gid</td>
                  <td className="border border-gray-300 px-4 py-2">Analytics</td>
                  <td className="border border-gray-300 px-4 py-2">Google Analytics session tracking</td>
                  <td className="border border-gray-300 px-4 py-2">24 hours</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">user_location</td>
                  <td className="border border-gray-300 px-4 py-2">Functionality</td>
                  <td className="border border-gray-300 px-4 py-2">Remember user location for search</td>
                  <td className="border border-gray-300 px-4 py-2">1 year</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">preferences</td>
                  <td className="border border-gray-300 px-4 py-2">Functionality</td>
                  <td className="border border-gray-300 px-4 py-2">Store user preferences</td>
                  <td className="border border-gray-300 px-4 py-2">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Updating the "Last Updated" date at the top of this policy</li>
            <li>Displaying a prominent notice on our website</li>
            <li>Sending you an email notification (if you have an account)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p className="mb-4">
            If you have questions about our use of cookies or other tracking technologies, please contact us:
          </p>
          <p className="mb-2">
            <strong>Email:</strong> privacy@thehockeydirectory.com
          </p>
          <p className="mb-2">
            <strong>Website:</strong> https://thehockeydirectory.com
          </p>
        </section>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-600">
            This cookie policy is compliant with GDPR, CCPA, and other privacy regulations. We are committed to transparency about how we use cookies and respecting your choices.
          </p>
        </div>
      </div>
    </div>
  )
}
