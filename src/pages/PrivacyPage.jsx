import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Rescaped privacy policy — what we collect, how we use it, and how we protect your personal information."
      />
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="legal-atty-notice">
            ⚠️ This page contains general information and should not be construed as final legal documentation. Please review with a qualified attorney before finalizing.
          </div>

          <div className="legal-body">

            <h2>1. Information We Collect</h2>
            <p>When you submit our intake form, we collect the following information you provide:</p>
            <ul>
              <li>Email address (primary contact method)</li>
              <li>Property street address (used for location-based rebate matching and yard analysis)</li>
              <li>Yard photos and images you upload</li>
              <li>Design preferences and project goals you describe</li>
              <li>HOA or architectural guideline documents, if provided</li>
              <li>Package selection, grass area, terrain type, and other project details</li>
              <li>Utah city selection (for water district rebate rate matching)</li>
            </ul>
            <p>We may also collect standard technical information when you visit our website, such as IP address, browser type, and pages visited, through standard web analytics tools.</p>

            <h2>2. Calculator Privacy</h2>
            <p>Our free rebate calculator does not collect, save, store, or transmit any information you enter. All calculator computations occur locally in your browser. No calculator data is sent to our servers.</p>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information solely to deliver the purchased service, including:</p>
            <ul>
              <li>Producing your AI-powered design concepts, blueprint, cost estimate, and rebate guidance</li>
              <li>Communicating with you about your order, questions, and project</li>
              <li>Matching your property to the appropriate Utah water district and rebate program information</li>
              <li>Improving our service and understanding how customers find and use Rescaped</li>
            </ul>
            <p>We do not use your photos or property information for any purpose other than generating your analysis deliverables. Photos are not published without your consent.</p>

            <h2>4. Information Sharing</h2>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. We may share information with service providers who assist us in delivering our service (such as email delivery tools), who are bound by confidentiality obligations. We may disclose information if required by law or to protect our legal rights.</p>

            <h2>5. CAPTCHA</h2>
            <p>Our intake form uses a CAPTCHA service (Google reCAPTCHA or hCaptcha) to prevent automated spam submissions. This service may collect usage data and device information as part of its spam detection process. Please review{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Google's Privacy Policy</a>
              {' '}and{' '}
              <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>hCaptcha's Privacy Policy</a>
              {' '}for details on how those services handle data.
            </p>

            <h2>6. Cookies and Analytics</h2>
            <p>This website may use cookies or similar technologies for basic functionality and analytics. We do not use cookies for advertising targeting. You can control cookie settings in your browser.</p>

            <h2>7. Data Retention</h2>
            <p>We retain customer information for as long as necessary to fulfill your order, respond to inquiries, and meet any legal or business obligations.</p>

            <h2>8. Your Rights</h2>
            <p>You may request to access, correct, or delete the personal information we hold about you. To make a request, <Link to="/contact" style={{ color: 'var(--teal)' }}>contact us</Link> via the contact page.</p>

            <h2>9. Children's Privacy</h2>
            <p>Our service is not directed at children under 13. We do not knowingly collect personal information from children.</p>

            <h2>10. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Updates will be posted on this page with a revised date.</p>

            <h2>11. Contact</h2>
            <p>If you have questions about this privacy policy, <Link to="/contact" style={{ color: 'var(--teal)' }}>contact us</Link> through the contact page on this website. We comply with applicable privacy laws. If you have questions about your data, contact us via the intake form or email.</p>

          </div>
        </div>
      </div>
    </>
  )
}
