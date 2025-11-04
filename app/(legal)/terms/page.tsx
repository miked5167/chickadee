import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - The Hockey Directory',
  description: 'Terms of Service for The Hockey Directory - Read our terms and conditions for using our platform to find hockey advisors.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 4, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using The Hockey Directory ("we," "us," or "our"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            The Hockey Directory is a platform that connects hockey players and families with hockey advisors, consultants, and development professionals. We provide:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>A searchable directory of hockey advisors</li>
            <li>Contact forms to connect with advisors</li>
            <li>Review and rating systems</li>
            <li>Blog content related to hockey development</li>
            <li>Listing claim services for advisors</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
          <h3 className="text-xl font-semibold mb-3">3.1 Accurate Information</h3>
          <p className="mb-4">
            You agree to provide accurate, current, and complete information when using our services, including when submitting contact forms, reviews, or claiming listings.
          </p>

          <h3 className="text-xl font-semibold mb-3">3.2 Prohibited Activities</h3>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Submit false or misleading information</li>
            <li>Impersonate another person or entity</li>
            <li>Submit spam, malicious content, or automated submissions</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Submit fake reviews or manipulate ratings</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Advisor Listings</h2>
          <h3 className="text-xl font-semibold mb-3">4.1 Listing Information</h3>
          <p className="mb-4">
            Advisor listings are compiled from publicly available information and may be claimed by business owners. We strive for accuracy but do not guarantee that all information is current or complete.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 Claiming Listings</h3>
          <p className="mb-4">
            Advisors may claim their listings by submitting verification information. We reserve the right to approve or deny claim requests at our discretion.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.3 Listing Updates</h3>
          <p className="mb-4">
            Claimed listing owners are responsible for maintaining accurate and current information about their services. We may remove or modify listings that violate these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Reviews and User Content</h2>
          <h3 className="text-xl font-semibold mb-3">5.1 Review Guidelines</h3>
          <p className="mb-4">
            Reviews must be based on genuine experiences. Fake reviews, reviews submitted by competitors, or reviews submitted in exchange for compensation are prohibited.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.2 Content License</h3>
          <p className="mb-4">
            By submitting reviews or other content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content on our platform.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.3 Content Moderation</h3>
          <p className="mb-4">
            We reserve the right to remove, edit, or refuse to publish any content that violates these terms, including reviews that contain:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Offensive, defamatory, or inappropriate language</li>
            <li>Personal information or privacy violations</li>
            <li>Spam or promotional content</li>
            <li>False or misleading statements</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
          <p className="mb-4">
            Our website may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of any third-party sites.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
          <p className="mb-4">
            The Hockey Directory is provided "as is" without warranties of any kind. We do not guarantee:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>The accuracy or completeness of advisor information</li>
            <li>The quality of services provided by listed advisors</li>
            <li>Uninterrupted or error-free service</li>
            <li>That defects will be corrected</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by law, The Hockey Directory shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Loss of profits or revenue</li>
            <li>Loss of data or business opportunities</li>
            <li>Issues arising from services provided by listed advisors</li>
            <li>Unauthorized access to your information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
          <p className="mb-4">
            You agree to indemnify and hold harmless The Hockey Directory, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your use of our services</li>
            <li>Your violation of these terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Content you submit to our platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Intellectual Property</h2>
          <p className="mb-4">
            All content on The Hockey Directory, including text, graphics, logos, and software, is the property of The Hockey Directory or its content suppliers and is protected by copyright and intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Account Termination</h2>
          <p className="mb-4">
            We reserve the right to suspend or terminate your account or access to our services at any time, with or without notice, for conduct that we believe violates these terms or is harmful to other users or our business.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p className="mb-4">
            We may modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
          <p className="mb-4">
            These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which The Hockey Directory operates, without regard to conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
          <p className="mb-4">
            If you have questions about these Terms of Service, please contact us at:
          </p>
          <p className="mb-2">
            <strong>Email:</strong> legal@thehockeydirectory.com
          </p>
          <p className="mb-2">
            <strong>Website:</strong> https://thehockeydirectory.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
          <p className="mb-4">
            If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-600">
            By using The Hockey Directory, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
