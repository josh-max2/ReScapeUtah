import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

export default function DisclaimerPage() {
  return (
    <>
      <SEO
        title="Disclaimer"
        description="Rescaped comprehensive disclaimer — nature of service, estimates, Utah Water Savers, HOA, LEED, tax information, and limitation of liability."
      />
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <h1>Disclaimer</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="legal-atty-notice">
            ⚠️ This page contains general information and should not be construed as final legal documentation. Please review with a qualified attorney before finalizing.
          </div>

          <div className="legal-body">

            <h2>Digital Planning Service Only</h2>
            <p>Rescaped is a digital planning and visualization service. We provide informational reports to help Utah homeowners plan yard projects. We are not licensed contractors, landscape architects, civil engineers, financial advisors, or tax advisors. Nothing in our reports constitutes professional contracting, engineering, architectural, financial, legal, or tax advice.</p>
            <p>Rescaped is not a licensed landscape architect. Our plans are for planning and visualization purposes only. Local building codes, permits, and professional licensing requirements may apply to your landscaping project. Consult qualified local professionals before beginning construction.</p>

            <h2>No Physical Services</h2>
            <p>Rescaped does not perform any physical work, installation, construction, grading, planting, or landscaping. We are a digital-only service. We do not conduct site visits or inspections of any kind.</p>

            <h2>AI-Powered Imagery</h2>
            <p>All imagery produced by Rescaped is AI-powered visualization intended for planning purposes. Actual installed landscapes will differ from concept images. Concept images are design inspiration tools and should not be interpreted as engineering drawings, construction documents, or guaranteed outcomes.</p>

            <h2>Estimates Are Not Guarantees</h2>
            <p>All cost estimates, rebate projections, water savings estimates, water bill impact estimates, square footage calculations, and other numerical figures contained in our reports and on this website are <strong>planning estimates only</strong>. They are based on general market data, publicly available program information, and general Utah irrigation guidelines. They are designed to help you plan and budget — not to serve as financial projections or contractual obligations.</p>
            <p>Actual project costs may vary significantly from our estimates depending on contractor pricing, material availability, site conditions, and project scope. Always obtain multiple contractor quotes before committing to a project.</p>

            <h2>No Guaranteed Outcomes</h2>
            <p>Rescaped does not guarantee any financial outcome including but not limited to: rebate approval, rebate amount, water bill reduction, home value increase, tax benefit, LEED credit, or return on investment. All outcomes depend on your specific property, contractor, water provider, and actions you take after receiving your report.</p>

            <h2>Utah Water Savers — No Affiliation and No Guarantee</h2>
            <p>Rescaped is not affiliated with Utah Water Savers, the Utah Division of Water Resources, Jordan Valley Water Conservancy District (JVWCD), Central Utah Water Conservancy District (CUWCD), Weber Basin Water Conservancy District (WBWCD), or any other water provider or municipality. We reference Utah Water Savers program information for informational and planning purposes only.</p>
            <p>We do not determine rebate eligibility. We do not submit Utah Water Savers applications on behalf of homeowners. Rebate eligibility, approval, and payment are determined solely by your water provider based on their current program rules, available funding, project inspection results, and other criteria. The homeowner is solely responsible for applying through utahwatersavers.com, meeting all program requirements, and complying with their provider's rules.</p>
            <p>Nothing in our reports or on this website constitutes a guarantee, representation, or warranty that you will receive any rebate, that your project will qualify for any rebate, or that any specific rebate amount will be available to you.</p>

            <h2>Plan + Estimate vs. Utah Water Savers Prep</h2>
            <p>The Plan + Estimate package produces a design-focused blueprint optimized for visual appeal, contractor communication, and project budgeting. It is not specifically formatted or verified against Utah Water Savers program compliance requirements.</p>
            <p>The Utah Water Savers Prep package produces a compliance-aligned blueprint engineered to align with Utah Water Savers program requirements. However, even with the Utah Water Savers Prep package, Rescaped does not guarantee rebate approval. Approval decisions rest solely with your water provider.</p>

            <h2>HOA and Permit Compliance</h2>
            <p>Our reports and plans are planning documents. They are not stamped engineering drawings and are not guaranteed to satisfy HOA requirements, municipal building permit requirements, or any other regulatory standard. You are responsible for confirming compliance with all applicable rules, codes, and restrictions before proceeding with any project. Rescaped does not communicate directly with any HOA on your behalf.</p>

            <h2>LEED Disclaimer</h2>
            <p>Rescaped provides general information about LEED certification as it relates to water-efficient landscaping. Rescaped does not provide LEED consulting, does not guarantee LEED credits, and is not affiliated with the U.S. Green Building Council (USGBC). LEED certification is administered by the USGBC and applies primarily to commercial and institutional buildings. The homeowner should consult a LEED Accredited Professional for project-specific guidance.</p>

            <h2>Tax Information Disclaimer</h2>
            <p>Any information provided by Rescaped about tax implications of landscaping improvements, capital improvements, or federal tax credits is general information only and does not constitute tax advice. Tax treatment depends on your individual circumstances, the nature and extent of improvements, and current tax law. Consult a qualified tax professional for guidance on your specific situation.</p>
            <p>Note: Xeriscaping and water-saving landscaping improvements do not currently qualify for the federal Energy Efficient Home Improvement Credit or the Residential Clean Energy Credit. The primary financial incentive for Utah homeowners is the Utah Water Savers Landscape Incentive Program. Consult a tax professional for current guidance.</p>

            <h2>Consult Licensed Professionals</h2>
            <p>Before proceeding with any landscaping project, major financial commitment, or rebate application, we strongly encourage you to:</p>
            <ul>
              <li>Obtain quotes from licensed, insured landscaping contractors</li>
              <li>Verify rebate program details, eligibility, and availability directly with your water provider</li>
              <li>Consult your HOA (if applicable) regarding design approval requirements</li>
              <li>Consult a licensed landscape architect or engineer for projects requiring professional documentation</li>
              <li>Consult a qualified tax professional about any tax implications</li>
            </ul>

            <h2>Informational Purposes</h2>
            <p>The content on this website, including calculator outputs, is provided for informational and planning purposes only. It does not constitute legal, financial, engineering, or professional advice of any kind.</p>

            <h2>Questions</h2>
            <p>If you have questions about the scope of our service or the limitations of our reports, please <Link to="/contact">contact us</Link> before ordering.</p>

          </div>
        </div>
      </div>
    </>
  )
}
