import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Rescaped Terms of Service — service description, scope of work, no-refund policy, disclaimers, and limitation of liability."
      />
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <h1>Terms of Service</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="legal-atty-notice">
            ⚠️ This page contains general information and should not be construed as final legal documentation. Please review with a qualified attorney before finalizing.
          </div>

          <div className="legal-body">

            <h2>1. Service Description</h2>
            <p>Rescaped provides digital planning and visualization services including AI-powered design concepts, CAD-style blueprint plans, cost estimates, and rebate preparation guidance. Rescaped is not a landscaping company, contractor, architect, or government agency. We do not perform physical installation, site visits, inspections, or construction of any kind.</p>

            <h2>2. Acceptance of Terms</h2>
            <p>By submitting an intake form, making a payment, or using any Rescaped service, you agree to these Terms of Service. If you do not agree, do not use the service.</p>

            <h2>3. Service Agreement</h2>
            <p>Upon payment confirmation, Rescaped agrees to deliver the digital deliverables specified in your selected package within the timeframe described in the package description. Deliverables are provided in digital format only. This constitutes the complete agreement between you and Rescaped for the purchased service.</p>

            <h2>4. Payment Process</h2>
            <p>Upon submitting your intake form, a Rescaped team member will review your submission and follow up by email to confirm your package selection, discuss any additional requirements (including HOA support if applicable), and provide payment instructions. Payment is required before work begins. By completing payment, you agree to these Terms of Service and authorize Rescaped to begin producing your deliverables.</p>

            <h2>5. Future Service Agreement</h2>
            <p>Rescaped reserves the right to require a signed service agreement before commencing work. If a service agreement is provided, its terms supplement these Terms of Service. In the event of a conflict between the service agreement and these Terms, the service agreement controls.</p>

            <h2>6. No Refund Policy</h2>
            <p>All sales are final. Due to the digital nature of our deliverables and the immediate commencement of work upon payment, Rescaped does not offer refunds. If you are dissatisfied with your deliverables, contact us and we will make reasonable efforts to address your concerns within the scope of your purchased package.</p>

            <h2>7. Scope of Work</h2>
            <p>Deliverables are limited to the items described in your selected package. Requests that exceed the scope of the purchased package — such as requesting compliance-verified plans under a package that does not include compliance verification — may require an upgrade to a higher-tier package at the applicable price difference.</p>
            <p>The Plan + Estimate package produces a design-focused blueprint optimized for visual appeal, contractor communication, and project budgeting. It is not specifically formatted or verified against Utah Water Savers program compliance requirements. The Utah Water Savers Prep package produces a compliance-aligned blueprint engineered to align with Utah Water Savers program requirements.</p>

            <h2>8. Estimates Disclaimer</h2>
            <p>All cost estimates, water savings projections, rebate estimates, and bill reduction estimates provided by Rescaped are planning estimates only. They are based on publicly available data, general industry pricing, and the information you provide. Actual costs depend on contractor pricing, material availability, labor rates, project scope, and market conditions. Actual water savings depend on current irrigation practices, lot size, climate, provider rates, and usage patterns. Rescaped does not guarantee the accuracy of any estimate.</p>

            <h2>9. Utah Water Savers Disclaimer</h2>
            <p>Rescaped is not affiliated with, endorsed by, or a partner of Utah Water Savers, the Utah Division of Water Resources, Jordan Valley Water Conservancy District, Central Utah Water Conservancy District, Weber Basin Water Conservancy District, or any other government agency or water provider. We do not submit rebate applications on behalf of homeowners. We do not guarantee rebate approval, eligibility, or any specific rebate amount. The homeowner is solely responsible for applying through utahwatersavers.com, meeting all program requirements, passing inspections, and complying with their provider's rules. Rebate program rules, rates, and funding may change at any time without notice from Rescaped.</p>

            <h2>10. HOA Disclaimer</h2>
            <p>For customers who purchase the HOA add-on or White Glove package: Rescaped designs concepts to align with HOA and architectural guidelines that the customer provides. Rescaped does not communicate directly with any HOA. The homeowner is solely responsible for submitting designs to their HOA, obtaining approval, and complying with HOA rules. Rescaped does not guarantee HOA approval. The homeowner is responsible for providing all relevant HOA documents before the concept phase begins. Additional modifications required by the HOA after the concept phase that were not included in the original scope of work may require additional payment.</p>

            <h2>11. LEED Disclaimer</h2>
            <p>Rescaped provides general information about LEED certification as it relates to water-efficient landscaping. Rescaped does not provide LEED consulting, does not guarantee LEED credits, and is not affiliated with the U.S. Green Building Council. LEED certification is administered by the USGBC and applies primarily to commercial and institutional buildings.</p>

            <h2>12. Tax Information Disclaimer</h2>
            <p>Any information provided by Rescaped about tax implications of landscaping improvements is general information only and does not constitute tax advice. Consult a qualified tax professional for guidance on your specific situation.</p>

            <h2>13. Intellectual Property</h2>
            <p>All design concepts, CAD blueprints, and deliverables produced by Rescaped are provided for the customer's personal use in planning and executing their landscaping project. The customer may share deliverables with contractors, landscapers, and relevant parties for project execution. Rescaped retains the right to use anonymized or modified versions of deliverables in marketing materials, gallery, and portfolio unless the customer explicitly opts out in writing.</p>

            <h2>14. Limitation of Liability</h2>
            <p>Rescaped's total liability for any claim arising from the service shall not exceed the amount paid by the customer for the specific package purchased. Rescaped is not liable for: any decisions made based on our estimates or guidance; any rebate application outcomes; any contractor work quality or pricing; any HOA approval decisions; any landscaping project outcomes; any water savings or bill reduction that differs from estimates; or any damages arising from the use of our deliverables. Our service provides planning information — all execution decisions and outcomes are the sole responsibility of the homeowner.</p>

            <h2>15. Indemnification</h2>
            <p>The customer agrees to indemnify and hold harmless Rescaped, its owners, employees, and contractors from any claims, damages, losses, or expenses arising from: the customer's use of deliverables; the customer's landscaping project; the customer's rebate application; the customer's interactions with contractors, HOAs, or government agencies; or any third-party claims related to the customer's property.</p>

            <h2>16. Governing Law</h2>
            <p>These Terms of Service are governed by the laws of the State of Utah. Any disputes shall be resolved in the courts of Salt Lake County, Utah.</p>

            <h2>17. Modifications</h2>
            <p>Rescaped reserves the right to modify these Terms of Service at any time. Continued use of the service after modifications constitutes acceptance of the updated terms.</p>

            <h2>18. Contact</h2>
            <p>Questions about these terms? <Link to="/contact">Contact us</Link>.</p>

          </div>
        </div>
      </div>
    </>
  )
}
