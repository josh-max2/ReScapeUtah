import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

export default function DisclaimerPage() {
  return (
    <>
      <SEO
        title="Disclaimer"
        description="ReScape disclaimer — the nature of our estimates, our relationship to Utah Water Savers, and what our reports do and do not constitute."
      />
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <h1>Disclaimer</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="legal-atty-notice">
            ⚠️ This page contains general information intended for planning purposes. It should not be construed as final legal documentation. Please review with a qualified attorney before finalizing.
          </div>

          <div className="legal-body">
            <h2>Digital Planning Service Only</h2>
            <p>ReScape is a digital planning and analysis service. We provide informational reports to help Utah homeowners plan yard projects. We are not licensed contractors, landscape architects, civil engineers, or financial advisors. Nothing in our reports constitutes professional contracting, engineering, architectural, financial, or legal advice.</p>

            <h2>No Installation or Physical Services</h2>
            <p>ReScape does not perform any physical work, installation, construction, grading, planting, or landscaping. We are a digital-only service.</p>

            <h2>Estimates Are Not Guarantees</h2>
            <p>All cost estimates, rebate projections, water savings estimates, water bill impact estimates, square footage calculations, and other numerical figures contained in our reports and on this website are <strong>planning estimates only</strong>. They are based on general market data, publicly available program information, and general Utah irrigation guidelines. They are designed to help you plan and budget — not to serve as financial projections or contractual obligations.</p>
            <p>Actual project costs may vary significantly from our estimates depending on contractor pricing, material availability, site conditions, and project scope. Always obtain multiple contractor quotes before committing to a project.</p>

            <h2>Utah Water Savers — No Affiliation and No Guarantee</h2>
            <p>ReScape is not affiliated with Utah Water Savers, the Central Utah Water Conservancy District (CUWCD), or any water provider or municipality. We reference Utah Water Savers program information for informational and planning purposes only.</p>
            <p>We do not determine rebate eligibility. We do not submit Utah Water Savers applications on behalf of homeowners. Rebate eligibility, approval, and payment are determined solely by your water provider based on their current program rules, available funding, project inspection results, and other criteria.</p>
            <p>Nothing in our reports or on this website constitutes a guarantee, representation, or warranty that you will receive any rebate, that your project will qualify for any rebate, or that any specific rebate amount will be available to you.</p>

            <h2>HOA and Permit Compliance</h2>
            <p>Our reports and plans are planning documents. They are not stamped engineering drawings and are not guaranteed to satisfy HOA requirements, municipal building permit requirements, or any other regulatory standard. You are responsible for confirming compliance with all applicable rules, codes, and restrictions before proceeding with any project.</p>

            <h2>Consult Licensed Professionals</h2>
            <p>Before proceeding with any landscaping project, major financial commitment, or rebate application, we strongly encourage you to:</p>
            <ul>
              <li>Obtain quotes from licensed, insured landscaping contractors</li>
              <li>Verify rebate program details, eligibility, and availability directly with your water provider</li>
              <li>Consult your HOA (if applicable) regarding design approval requirements</li>
              <li>Consult a licensed landscape architect or engineer for projects requiring professional documentation</li>
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
