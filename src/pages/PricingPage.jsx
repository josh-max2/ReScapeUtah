import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'

const PRICING_FAQS = [
  {
    q: 'Can I upgrade from one package to another?',
    a: 'Yes. Contact us after purchase and we can apply the amount you already paid toward the higher-tier package. If you purchased Plan + Estimate and want to upgrade to Utah Water Savers Prep, contact us to pay only the price difference.',
  },
  {
    q: 'What is the turnaround time?',
    a: 'Reports are delivered within up to 1 week from order submission. Turnaround times are targets, not guarantees — complex yards or high-demand periods may take longer. We will communicate if your order will be delayed.',
  },
  {
    q: 'What is your refund policy?',
    a: 'All sales are final. If you have concerns about the quality or completeness of your report, contact us and we will work to address them. Our goal is to deliver a useful, accurate planning document — if something is missing or incorrect, we want to know.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. Every package is a one-time payment per report. There are no recurring charges.',
  },
  {
    q: 'What format is the report delivered in?',
    a: 'Reports are delivered as PDF downloads. The top-down plan is formatted to be shareable with contractors and for Utah Water Savers application preparation.',
  },
  {
    q: "What's the difference between Plan + Estimate and Utah Water Savers Prep?",
    a: "Plan + Estimate produces a design-focused blueprint optimized for visual appeal, contractor communication, and project budgeting. It is not specifically formatted or verified against Utah Water Savers program compliance requirements. Utah Water Savers Prep produces a compliance-aligned blueprint engineered to meet program requirements — plant selections verified for 50% perennial coverage, park strip height limits, drip irrigation zones, mulch coverage, hardscape limits, and remaining lawn width. If you're planning to apply for a rebate, we recommend Water Savers Prep.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Contact us via the intake form and we will accommodate your preferred payment method. We support major cards and other common options.',
  },
  {
    q: 'Does this service work outside of Utah?',
    a: 'Rescaped currently serves Utah homeowners. If you are outside Utah, contact us and we can discuss custom pricing based on your location, yard size, and local regulations. We do not currently offer Utah Water Savers rebate preparation for properties outside Utah.',
  },
]

const PACKAGES = [
  {
    id: 'visual-concept',
    name: 'Visual Concept',
    price: 49.99,
    was: 89,
    tagline: 'Explore ideas before committing to a full plan.',
    features: [
      'Up to 10 AI-powered yard concept images',
      'Multiple design directions and styles',
      'PDF delivery',
      'Up to 1 week turnaround',
    ],
    featured: false,
    premium: false,
  },
  {
    id: 'plan-estimate',
    name: 'Plan + Estimate',
    price: 149.99,
    was: 249,
    tagline: 'Everything you need to plan your project and get accurate contractor quotes.',
    features: [
      'Up to 10 AI-powered yard concept images',
      'CAD-style top-down 2D blueprint',
      'General-purpose blueprint (not compliance-verified)',
      'Itemized cost estimate (materials + labor ranges)',
      'Water-saving projection (planning estimate)',
      'PDF delivery',
      'Up to 1 week turnaround',
    ],
    featured: false,
    premium: false,
    differentiatorNote: 'This blueprint is a design-focused plan — optimized for visual appeal, contractor communication, and project budgeting. It is not specifically formatted or verified against Utah Water Savers program compliance requirements. If you plan to apply for a Utah Water Savers rebate, we recommend the Utah Water Savers Prep package.',
  },
  {
    id: 'water-savers-prep',
    name: 'Utah Water Savers Prep',
    price: 299.99,
    was: 499,
    tagline: 'For homeowners pursuing Utah Water Savers rebates who want a compliance-aligned plan.',
    features: [
      'Up to 20 AI-powered yard concept images',
      'Compliance-aligned blueprint (designed to meet Utah Water Savers requirements)',
      'Plant selections verified for 50% perennial coverage at maturity',
      'Park strip plants verified under 24-inch height limits',
      'Drip irrigation zones mapped on dedicated zones',
      'Mulch coverage (3–4 inches) specified',
      'Hardscape verified under 50% front yard maximum',
      'Itemized cost estimate + water-saving projection',
      'Utah Water Savers rebate eligibility guidance for your provider',
      'Document prep assistance + priority support',
      'PDF delivery',
      'Up to 1 week turnaround',
      'Utah properties only',
    ],
    featured: true,
    premium: false,
    legalNote: 'We assist you in preparing your application materials. The homeowner submits the Utah Water Savers application directly to their water provider through utahwatersavers.com. We do not guarantee approval or rebate amounts.',
  },
  {
    id: 'white-glove',
    name: 'White Glove',
    price: 499.99,
    was: 799,
    tagline: 'Full-service planning with maximum support, detail, and contractor referral assistance.',
    features: [
      'Up to 30 AI-powered yard concept images',
      'Everything in Utah Water Savers Prep',
      'HOA design support included (no additional charge)',
      'Extended design consultation session',
      'One complimentary design revision included',
      'Contractor referral support (Utah licensed contractors)',
      'Priority turnaround',
      'Dedicated email support throughout the process',
      'PDF delivery',
      'Utah properties only',
    ],
    featured: false,
    premium: true,
    hoaNote: 'HOA design support is included at no additional charge. The homeowner is responsible for providing all relevant HOA documents before the concept phase begins and for submitting designs to their HOA for approval. Additional modifications required by the HOA that fall outside the original project scope may require additional payment.',
  },
]

// Comparison table rows: [label, vc, pe, wsp, wg]
const COMPARISON = [
  ['AI-powered design concepts',         'Up to 10', 'Up to 10', 'Up to 20', 'Up to 30'],
  ['CAD-style top-down 2D blueprint',    '—',  '✓',  '✓',  '✓'],
  ['Blueprint type',                     '—',  'Design-focused', 'Compliance-aligned', 'Compliance-aligned'],
  ['Itemized cost estimate',             '—',  '✓',  '✓',  '✓'],
  ['Water-saving projection',            '—',  '✓',  '✓',  '✓'],
  ['Utah Water Savers rebate guidance',  '—',  '—',  '✓',  '✓'],
  ['Compliance-aligned blueprint',       '—',  '—',  '✓',  '✓'],
  ['Application document prep',          '—',  '—',  '✓',  '✓'],
  ['Priority support',                   '—',  '—',  '✓',  '✓'],
  ['HOA design support',                 '—',  '—',  '—',  'Included'],
  ['Extended design consultation',       '—',  '—',  '—',  '✓'],
  ['Design revision included',           '—',  '—',  '—',  '✓'],
  ['Contractor referral support',        '—',  '—',  '—',  '✓'],
  ['Dedicated support contact',          '—',  '—',  '—',  '✓'],
  ['PDF delivery',                       '✓',  '✓',  '✓',  '✓'],
  ['Turnaround',                     'Up to 1 wk', 'Up to 1 wk', 'Up to 1 wk', 'Priority'],
  ['Price',                          '$49.99', '$149.99', '$299.99', '$499.99'],
]

export default function PricingPage() {
  return (
    <>
      <SEO
        title="Pricing — Yard Analysis Packages"
        description="Simple, transparent pricing for ReScapeUtah — Utah homeowners only. One-time payment. No subscriptions. Visual Concept ($49.99), Plan + Estimate ($149.99), Utah Water Savers Prep ($299.99), White Glove ($499.99)."
      />

      <div className="page-hero" style={{ paddingTop: 'calc(var(--nav-h) + 64px)' }}>
        <div className="container">
          <span className="eyebrow">Pricing</span>
          <h1 className="page-hero-title">Simple pricing.<br />Complete analysis.</h1>
          <p className="page-hero-sub">
            One-time payment per report. No subscriptions. No installations. Choose the depth of analysis that fits your project.
          </p>
        </div>
      </div>

      {/* Packages */}
      <section className="section--tight">
        <div className="container">
          <div className="pricing-grid pricing-grid--4">
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className={`pricing-card${pkg.featured ? ' pricing-card--featured' : ''}${pkg.premium ? ' pricing-card--premium' : ''}`}>
                <div className="pc-top">
                  <div className="pc-name-row">
                    <span className="pc-name">{pkg.name}</span>
                    {pkg.featured && <span className="pc-badge">Most Popular</span>}
                    {pkg.premium  && <span className="pc-badge pc-badge--premium">Premium</span>}
                  </div>
                  <p className="pc-tagline">{pkg.tagline}</p>
                  <div className="pkg-price-row">
                    {pkg.was && <span className="pkg-price-was">${pkg.was}</span>}
                    <div className="pc-price">
                      <span className="pc-price-sign">$</span>
                      <span className="pc-price-amount">{pkg.price.toFixed(2)}</span>
                      <span className="pc-price-period">one-time</span>
                    </div>
                  </div>
                  <div><span className="pkg-launch-tag">Launch pricing</span></div>
                </div>

                <div className="pc-includes">
                  <div className="pc-includes-title">What's included</div>
                  <ul className="check-list">
                    {pkg.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>

                {pkg.differentiatorNote && (
                  <div className="pc-legal" style={{ borderColor: 'rgba(250,204,21,.2)', background: 'rgba(250,204,21,.03)' }}>
                    {pkg.differentiatorNote}
                  </div>
                )}

                {pkg.legalNote && (
                  <div className="pc-legal">{pkg.legalNote}</div>
                )}

                {pkg.hoaNote && (
                  <div className="pc-legal" style={{ borderColor: 'rgba(32,217,192,.2)', background: 'rgba(32,217,192,.03)' }}>
                    {pkg.hoaNote}
                  </div>
                )}

                <div className="pc-cta">
                  <Link
                    to={`/contact?package=${pkg.id}`}
                    className={`btn btn--full btn--lg${pkg.featured ? ' btn--orange' : pkg.premium ? ' btn--outline' : ' btn--ghost'}`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade path note */}
          <div style={{ textAlign: 'center', marginTop: 20, padding: '14px 20px', background: 'var(--bg-card)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
            Already purchased Plan + Estimate and want to upgrade?{' '}
            <Link to="/contact" style={{ color: 'var(--teal)', fontWeight: 600 }}>
              Contact us to upgrade to Utah Water Savers Prep for the price difference →
            </Link>
          </div>

          {/* Utah-only notice */}
          <div className="utah-only-notice">
            <span className="utah-only-notice-icon" aria-hidden="true">📍</span>
            <div className="utah-only-notice-body">
              <strong>Rescaped currently serves Utah homeowners only.</strong>{' '}
              If you are located outside Utah,{' '}
              <Link to="/contact" style={{ color: 'var(--teal)', fontWeight: 600 }}>contact us</Link>
              {' '}— we may be able to accommodate your project with custom pricing based on your location, yard size, and local regulations.
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ marginTop: 56 }}>
            <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              What's included in each plan
            </h2>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
              Key difference: Plan + Estimate is design-focused. Utah Water Savers Prep is compliance-aligned for rebate applications.
            </p>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 28, opacity: 0.75 }}>
              All packages are for Utah properties only.
            </p>
            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Visual<br />Concept</th>
                    <th>Plan +<br />Estimate</th>
                    <th className="ct-featured">Water Savers<br />Prep</th>
                    <th>White<br />Glove</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(([label, vc, pe, wsp, wg]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td className={vc === '✓' ? 'ct-yes' : vc === '—' ? 'ct-no' : ''}>{vc}</td>
                      <td className={pe === '✓' ? 'ct-yes' : pe === '—' ? 'ct-no' : ''}>{pe}</td>
                      <td className={`ct-featured-col${wsp === '✓' ? ' ct-yes' : wsp === '—' ? ' ct-no' : ''}`}>{wsp}</td>
                      <td className={wg === '✓' ? 'ct-yes' : wg === '—' ? ' ct-no' : ''}>{wg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              All cost estimates, rebate projections, and water savings estimates are planning estimates only. We do not guarantee any outcome.
            </p>

            {/* Design Revision add-on callout */}
            <div className="design-revision-callout">
              <div className="design-revision-callout-left">
                <div className="design-revision-callout-header">
                  <span className="design-revision-callout-name">Design Revision</span>
                  <span className="design-revision-callout-price">$74.99</span>
                </div>
                <p className="design-revision-callout-desc">
                  Update your existing compliance-aligned CAD blueprint based on contractor feedback, HOA input, or requirement changes. Available for Utah Water Savers Prep and White Glove customers only. White Glove includes one complimentary revision. Does not include new concept images.
                </p>
              </div>
              <Link to="/design-revision" className="btn btn--outline btn--sm" style={{ flexShrink: 0 }}>
                Request Revision
              </Link>
            </div>
          </div>

          {/* Contractor referral callout */}
          <div className="contractor-callout" style={{ marginTop: 40 }}>
            <div className="contractor-callout-icon" aria-hidden="true">🔨</div>
            <div>
              <h3 className="contractor-callout-title">Need a licensed contractor?</h3>
              <p className="contractor-callout-desc">
                White Glove customers receive contractor referral support. We can connect you with Utah-licensed, insured landscaping contractors in your area — so you can move from plan to project with confidence. Referrals do not constitute endorsements; always verify licensing and get multiple quotes.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 32, padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
              All cost estimates, rebate projections, and water savings estimates in our reports are planning estimates only. Actual costs, rebate eligibility, and outcomes vary. We do not guarantee any specific outcome.{' '}
              <Link to="/disclaimer" style={{ color: 'var(--text-sec)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                See full disclaimer
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section--dark">
        <div className="container--xs pricing-faq">
          <div className="section-header">
            <span className="eyebrow">Pricing FAQ</span>
            <h2 className="section-title">Answers to common questions</h2>
          </div>
          <FAQAccordion items={PRICING_FAQS} />
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Ready to get your analysis?</h2>
          <p className="final-cta-sub">
            Fill out the short intake form and we'll build your personalized yard report.
          </p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Start My Analysis</Link>
            <Link to="/calculator" className="btn btn--ghost btn--lg">Try the Calculator First</Link>
          </div>
          <p className="final-cta-note">One-time payment. No subscription. No installation. Utah properties only.</p>
        </div>
      </div>
    </>
  )
}
