import SEO from '../components/SEO'

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="ReScapeUtah privacy policy — how we collect, use, and protect your personal information."
      />
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="legal-atty-notice">
            ⚠️ This page contains general information intended for planning purposes. It should not be construed as final legal documentation. Please review with a qualified attorney before finalizing.
          </div>

          <div className="legal-body">
            <h2>1. Information We Collect</h2>
            <p>When you submit our intake form or contact us, we collect the information you provide, including your name, email address, phone number (if provided), Utah city or county, water provider (if provided), package selection, and any project details you share.</p>
            <p>We may also collect standard technical information when you visit our website, such as IP address, browser type, and pages visited, through standard web analytics tools.</p>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process your order and deliver your ReScapeUtah report</li>
              <li>Communicate with you about your order, questions, or project</li>
              <li>Improve our service and understand how customers find and use ReScapeUtah</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. We may share information with service providers who assist us in delivering our service (such as email delivery tools or payment processors), who are bound by confidentiality obligations.</p>
            <p>We may disclose information if required by law or to protect our legal rights.</p>

            <h2>4. Data Retention</h2>
            <p>We retain customer information for as long as necessary to fulfill your order, respond to inquiries, and meet any legal or business obligations. You may request deletion of your personal information by contacting us.</p>

            <h2>5. Cookies and Analytics</h2>
            <p>This website may use cookies or similar technologies for basic functionality and analytics. We do not use cookies for advertising targeting. You can control cookie settings in your browser.</p>

            <h2>6. Your Rights</h2>
            <p>You may request to access, correct, or delete the personal information we hold about you. To make a request, contact us using the contact information on our site.</p>

            <h2>7. Children's Privacy</h2>
            <p>Our service is not directed at children under 13. We do not knowingly collect personal information from children.</p>

            <h2>8. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Updates will be posted on this page with a revised date.</p>

            <h2>9. Contact</h2>
            <p>If you have questions about this privacy policy, contact us through the contact page on this website.</p>
          </div>
        </div>
      </div>
    </>
  )
}
