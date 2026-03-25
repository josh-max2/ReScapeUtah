import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="ReScape terms of service — the nature of our service, what is included, limitations, and your rights as a customer."
      />
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <h1>Terms of Service</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="legal-atty-notice">
            ⚠️ This page contains general information intended for planning purposes. It should not be construed as final legal documentation. Please review with a qualified attorney before finalizing.
          </div>

          <div className="legal-body">
            <h2>1. Nature of Service</h2>
            <p>ReScape provides digital planning and analysis services for Utah homeowners. Our service includes AI-generated yard concept images, CAD-style top-down plans, cost estimates, water-saving projections, and Utah Water Savers rebate guidance, delivered as downloadable PDF reports.</p>
            <p><strong>We are not a landscaping company.</strong> We do not perform installations, construction, or any physical work. We do not design-build or manage projects. Our reports are planning and informational documents only.</p>

            <h2>2. No Guarantee of Rebate Approval</h2>
            <p>ReScape does not guarantee Utah Water Savers rebate approval, rebate amounts, or program availability. Rebate eligibility is determined solely by your water provider based on their current program rules, funding availability, and inspection results. We do not submit rebate applications on behalf of customers. The homeowner submits their own application directly to their water provider.</p>

            <h2>3. Estimates Are Not Guarantees</h2>
            <p>All cost estimates, rebate projections, water savings estimates, and other financial figures in our reports are planning estimates only. They are based on general market data and publicly available program information. Actual costs, rebate amounts, and savings will vary and are not guaranteed by ReScape. Do not rely on our estimates as a substitute for contractor quotes or official provider program information.</p>

            <h2>4. No Professional Licensure</h2>
            <p>ReScape reports are not prepared by licensed landscape architects, licensed engineers, or licensed contractors. Our reports are planning tools and do not constitute professional engineering, architectural, or contracting advice. For projects requiring licensed professional involvement, consult the appropriate licensed professional.</p>

            <h2>5. HOA and Permit Compliance</h2>
            <p>Our reports are planning documents and are not guaranteed to satisfy HOA, municipal permit, or other regulatory requirements. Our HOA Design Review Add-On provides general design adjustments for common HOA restriction categories but does not guarantee HOA board approval. You are responsible for verifying compliance with your HOA, local codes, and any applicable regulations.</p>

            <h2>6. Turnaround Times</h2>
            <p>Turnaround times stated on our website and in our materials are targets of up to 1 week, not guarantees. Complex projects, high order volume, or other circumstances may result in longer delivery times. We will communicate if your order will be delayed.</p>

            <h2>7. Satisfaction and Refunds</h2>
            <p>If you are not satisfied with your analysis, contact us within 7 days of delivery. We will work to address your concerns or issue a refund at our discretion. Contact us through the <Link to="/contact">contact page</Link>.</p>

            <h2>8. Intellectual Property</h2>
            <p>The report delivered to you is licensed for your personal use in planning your yard project. You may share the report with contractors, landscapers, or water providers for purposes related to your project. You may not resell, redistribute, or use our reports for commercial purposes without permission.</p>

            <h2>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, ReScape and its owners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our service or reliance on our reports. Our total liability to you for any claim arising from your order shall not exceed the amount you paid for that order.</p>

            <h2>10. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Utah, without regard to conflict of law principles.</p>

            <h2>11. Changes to These Terms</h2>
            <p>We may update these terms from time to time. Continued use of our service after an update constitutes your acceptance of the updated terms.</p>

            <h2>12. Contact</h2>
            <p>Questions about these terms? <Link to="/contact">Contact us</Link>.</p>
          </div>
        </div>
      </div>
    </>
  )
}
