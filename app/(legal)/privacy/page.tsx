import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - The Hockey Directory',
  description: 'Privacy Policy for The Hockey Directory - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 4, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            The Hockey Directory ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
          <p className="mb-4">
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
          <p className="mb-4">
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Submit a contact form to an advisor</li>
            <li>Create an account or sign in with Google</li>
            <li>Submit a review or rating</li>
            <li>Claim a listing as a business owner</li>
            <li>Subscribe to our newsletter</li>
            <li>Contact us with questions or feedback</li>
          </ul>
          <p className="mb-4">
            This information may include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and email address</li>
            <li>Phone number</li>
            <li>Child's age (when contacting advisors)</li>
            <li>Business information (for claimed listings)</li>
            <li>Google account information (when using Google OAuth)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 Automatically Collected Information</h3>
          <p className="mb-4">
            When you visit our website, we automatically collect certain information about your device and browsing actions:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>IP address (hashed for privacy)</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Referral source</li>
            <li>Pages viewed and time spent</li>
            <li>Click patterns and navigation paths</li>
            <li>Device information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.3 Cookies and Tracking Technologies</h3>
          <p className="mb-4">
            We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities. See our <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a> for more details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Facilitate contact between users and advisors</li>
            <li>Process and manage listing claims</li>
            <li>Display and moderate reviews</li>
            <li>Send transactional emails (confirmations, notifications)</li>
            <li>Improve and optimize our website</li>
            <li>Analyze usage patterns and trends</li>
            <li>Prevent fraud and abuse</li>
            <li>Comply with legal obligations</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
          <p className="mb-4">
            We may share your information in the following situations:
          </p>

          <h3 className="text-xl font-semibold mb-3">4.1 With Advisors</h3>
          <p className="mb-4">
            When you submit a contact form, we share your information (name, email, phone, message) with the advisor you're contacting.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 Service Providers</h3>
          <p className="mb-4">
            We may share your information with third-party service providers who perform services on our behalf, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Hosting and infrastructure (Vercel)</li>
            <li>Database services (Supabase)</li>
            <li>Email delivery (Resend/SendGrid)</li>
            <li>Analytics (Google Analytics)</li>
            <li>Authentication (Google OAuth)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Legal Requirements</h3>
          <p className="mb-4">
            We may disclose your information if required by law or in response to valid requests by public authorities (e.g., court orders, subpoenas).
          </p>

          <h3 className="text-xl font-semibold mb-3">4.4 Business Transfers</h3>
          <p className="mb-4">
            In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational security measures to protect your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of data in transit (HTTPS/SSL)</li>
            <li>Hashing of IP addresses for privacy</li>
            <li>Secure authentication with Google OAuth</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Secure database hosting</li>
          </ul>
          <p className="mb-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>

          <h3 className="text-xl font-semibold mb-3">6.1 Access and Correction</h3>
          <p className="mb-4">
            You have the right to access and update your personal information. You can do this by logging into your account or contacting us.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.2 Data Deletion</h3>
          <p className="mb-4">
            You can request deletion of your personal information by contacting us. Note that we may need to retain certain information for legal or legitimate business purposes.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.3 Marketing Opt-Out</h3>
          <p className="mb-4">
            You can opt out of receiving marketing emails by clicking the "unsubscribe" link in any marketing email or by contacting us.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.4 Cookie Preferences</h3>
          <p className="mb-4">
            You can manage your cookie preferences through your browser settings or our cookie consent banner.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.5 GDPR Rights (EU Users)</h3>
          <p className="mb-4">
            If you are in the European Union, you have additional rights under GDPR:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to restrict processing</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.6 CCPA Rights (California Users)</h3>
          <p className="mb-4">
            If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Right to know what personal information is collected</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the sale of personal information (we do not sell your information)</li>
            <li>Right to non-discrimination for exercising your rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
          <p className="mb-4">
            Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Third-Party Links</h2>
          <p className="mb-4">
            Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to read their privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
          <p className="mb-4">
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
          <p className="mb-4">
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy, unless a longer retention period is required by law.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Contact form submissions: Retained indefinitely for business purposes</li>
            <li>Reviews: Retained indefinitely unless deleted</li>
            <li>Account information: Retained until account deletion</li>
            <li>Analytics data: Aggregated and anonymized after 26 months</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
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
            This privacy policy is compliant with GDPR, CCPA, and other major privacy regulations. We are committed to protecting your privacy and handling your data responsibly.
          </p>
        </div>
      </div>
    </div>
  )
}
