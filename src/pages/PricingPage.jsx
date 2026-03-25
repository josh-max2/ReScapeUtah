import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'

const PRICING_FAQS = [
  {
    q: 'Can I upgrade from one package to another?',
    a: 'Yes. Contact us after purchase and we can apply the amount you already paid toward the higher-tier package.',
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
    q: 'What payment methods do you accept?',
    a: 'Contact us via the intake form and we will accommodate your preferred payment method. We support major cards and other common options.',
  },
  {
    q: 'Does this service work outside of Utah?',
    a: 'ReScapeUtah is designed specifically for Utah homeowners and the Utah Water Savers program. Our rebate guidance is calibrated to Utah water districts. We do not currently serve other states.',
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
      '10 AI-powered yard concept images',
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
      'Everything in Visual Concept',
      'CAD-style top-down 2D blueprint',
      'Itemized cost estimate (materials + labor ranges)',
      'Water-saving projection (planning estimate)',
      'PDF delivery',
      'Up to 1 week turnaround',
    ],
    featured: false,
    premium: false,
  },
  {
    id: 'water-savers-prep',
    name: 'Utah Water Savers Prep',
    price: 299.99,
    was: 499,
    tagline: 'For homeowners pursuing Utah Water Savers rebates who want expert guidance.',
    features: [
      'Everything in Plan + Estimate',
      'Utah Water Savers rebate eligibility guidance for your provider',
      'Assistance preparing application documents and information',
      'Priority support',
      'PDF delivery',
      'Up to 1 week turnaround',
      'Utah properties only',
    ],
    featured: true,
    premium: false,
    legalNote: 'We assist you in preparing your application materials. The homeowner submits the Utah Water Savers application directly to their water provider. We do not guarantee approval or rebate amounts.',
  },
  {
    id: 'white-glove',
    name: 'White Glove',
    price: 499.99,
    was: 799,
    tagline: 'Full-service planning with maximum support, detail, and contractor referral assistance.',
    features: [
      'Everything in Utah Water Savers Prep',
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
  },
]

const SPECIALTY_PRODUCTS = [
  {
    id: 'out-of-state',
    name: 'Out-of-State Design',
    price: 299.99,
    was: 449,
    tagline: 'Concept images and a CAD-style blueprint for any property — no rebate guidance.',
    features: [
      '10 AI-powered yard concept images',
      'CAD-style top-down 2D blueprint',
      'PDF delivery',
      'Up to 1 week turnaround',
      'Available nationwide — not Utah-specific',
    ],
    note: 'Does not include Utah Water Savers rebate guidance or cost estimates. For rebate guidance, Utah residents should choose the Utah Water Savers Prep package.',
  },
  {
    id: 'design-revision',
    name: 'Design Revision',
    price: 74.99,
    was: null,
    tagline: 'Revisit your existing design with updated requirements.',
    features: [
      'Fresh concept set based on new requirements',
      'Updated CAD blueprint (if original included one)',
      'Accepts contractor feedback, HOA input, or preference changes',
      'PDF delivery',
      'Up to 1 week turnaround',
    ],
    note: 'For existing ReScapeUtah customers only. White Glove includes one complimentary revision — no purchase required.',
  },
]

// Comparison table rows: [label, vc, pe, wsp, wg]
const COMPARISON = [
  ['AI-powered design concepts (up to 10)', '✓', '✓', '✓', '✓'],
  ['CAD-style top-down 2D blueprint',       '—', '✓', '✓', '✓'],
  ['Itemized cost estimate',               '—', '✓', '✓', '✓'],
  ['Water-saving projection',              '—', '✓', '✓', '✓'],
  ['Utah Water Savers rebate guidance',    '—', '—', '✓', '✓'],
  ['Application document prep',            '—', '—', '✓', '✓'],
  ['Priority support',                     '—', '—', '✓', '✓'],
  ['Extended design consultation',         '—', '—', '—', '✓'],
  ['Design revision included',             '—', '—', '—', '✓'],
  ['Contractor referral support',          '—', '—', '—', '✓'],
  ['Dedicated support contact',            '—', '—', '—', '✓'],
  ['PDF delivery',                         '✓', '✓', '✓', '✓'],
  ['Turnaround',                       'Up to 1 wk', 'Up to 1 wk', 'Up to 1 wk', 'Priority'],
  ['Price',                            '$49.99', '$149.99', '$299.99', '$499.99'],
]

export default function PricingPage() {
  return (
    <>
      <SEO
        title="Pricing — Yard Analysis Packages"
        description="Simple, transparent pricing for ReScapeUtah. One-time payment. No subscriptions. Choose from Visual Concept ($50), Plan + Estimate ($150), Utah Water Savers Prep ($300), or White Glove ($500). Utah only."
      />

      <div className="page-hero" style={{ paddingTop: 'calc(var(--nav-h) + 64px)' }}>
        <div className="container">
          <span className="eyebrow">Pricing</span>
          <h1 className="page-hero-title">Simple pricing.<br />Complete analysis.</h1>
          <p className="page-hero-sub">
            One-time payment per report. No subscriptions. No installations. Utah only. Choose the depth of analysis that fits your project.
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

                {pkg.legalNote && (
                  <div className="pc-legal">{pkg.legalNote}</div>
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

          {/* Specialty Products */}
          <div style={{ marginTop: 40 }}>
            <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-sec)' }}>
              Specialty Products
            </h2>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Not in Utah, or need to revisit an existing design?
            </p>
            <div className="specialty-products-grid">
              {SPECIALTY_PRODUCTS.map(sp => (
                <div key={sp.id} className="specialty-product-card">
                  <div className="specialty-product-header">
                    <div className="specialty-product-name">{sp.name}</div>
                    <div className="specialty-product-price">
                      {sp.was && <span className="pkg-price-was">${sp.was}</span>}
                      <span className="specialty-product-amount">${sp.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="specialty-product-tagline">{sp.tagline}</p>
                  <ul className="check-list" style={{ marginBottom: 12 }}>
                    {sp.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                  {sp.note && <p className="specialty-product-note">{sp.note}</p>}
                  <Link
                    to={sp.id === 'design-revision' ? '/design-revision' : `/contact?package=${sp.id}`}
                    className="btn btn--outline btn--sm"
                    style={{ marginTop: 12 }}
                  >
                    {sp.id === 'design-revision' ? 'Request Revision' : 'Get Started'}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ marginTop: 56 }}>
            <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 28 }}>
              What's included in each plan
            </h2>
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
                      <td className={wg === '✓' ? 'ct-yes' : wg === '—' ? 'ct-no' : ''}>{wg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contractor referral callout */}
          <div className="contractor-callout">
            <div className="contractor-callout-icon" aria-hidden="true">🔨</div>
            <div>
              <h3 className="contractor-callout-title">Need a licensed contractor?</h3>
              <p className="contractor-callout-desc">
                White Glove customers receive contractor referral support. We can connect you with Utah-licensed, insured landscaping contractors in your area — so you can move from plan to project with confidence. Referrals do not constitute endorsements; always verify licensing and get multiple quotes.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40, padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
              All cost estimates, rebate projections, and water savings estimates in our reports are planning estimates only. Actual costs, rebate eligibility, and water savings will vary. We do not guarantee any specific outcome.{' '}
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
          <p className="final-cta-note">One-time payment. No subscription. No installation. Utah only.</p>
        </div>
      </div>
    </>
  )
}
