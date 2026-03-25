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
    q: 'Do you offer refunds?',
    a: 'If you are not satisfied with your analysis, contact us within 7 days of delivery and we will work to make it right or issue a refund at our discretion.',
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
    a: 'ReScape is designed specifically for Utah homeowners and the Utah Water Savers program. Our rebate guidance is calibrated to Utah water districts. We do not currently serve other states.',
  },
]

const PACKAGES = [
  {
    id: 'visual-concept',
    name: 'Visual Concept',
    price: 50,
    tagline: 'Explore ideas before committing to a full plan.',
    features: [
      '10 AI-generated yard concept images',
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
    price: 150,
    tagline: 'Everything you need to plan your project and get accurate contractor quotes.',
    features: [
      'Everything in Visual Concept',
      'CAD-style top-down 2D plan',
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
    price: 300,
    tagline: 'For homeowners pursuing Utah Water Savers rebates who want expert guidance.',
    features: [
      'Everything in Plan + Estimate',
      'Utah Water Savers rebate eligibility guidance for your provider',
      'Assistance preparing application documents and information',
      'Priority support',
      'PDF delivery',
      'Up to 1 week turnaround',
    ],
    featured: true,
    premium: false,
    legalNote: 'We assist you in preparing your application materials. The homeowner submits the Utah Water Savers application directly to their water provider. We do not guarantee approval or rebate amounts.',
  },
  {
    id: 'white-glove',
    name: 'White Glove',
    price: 500,
    tagline: 'Full-service planning with maximum support, detail, and contractor referral assistance.',
    features: [
      'Everything in Utah Water Savers Prep',
      'Extended design consultation session',
      'Contractor referral support (Utah licensed contractors)',
      'Priority turnaround',
      'Dedicated email support throughout the process',
      'PDF delivery',
    ],
    featured: false,
    premium: true,
  },
]

// Comparison table rows: [label, vc, pe, wsp, wg]
const COMPARISON = [
  ['AI design concepts (up to 10)',     '✓', '✓', '✓', '✓'],
  ['CAD-style top-down 2D plan',        '—', '✓', '✓', '✓'],
  ['Itemized cost estimate',            '—', '✓', '✓', '✓'],
  ['Water-saving projection',           '—', '✓', '✓', '✓'],
  ['Utah Water Savers rebate guidance', '—', '—', '✓', '✓'],
  ['Application document prep',         '—', '—', '✓', '✓'],
  ['Priority support',                  '—', '—', '✓', '✓'],
  ['Extended design consultation',      '—', '—', '—', '✓'],
  ['Contractor referral support',        '—', '—', '—', '✓'],
  ['Dedicated support contact',          '—', '—', '—', '✓'],
  ['HOA review add-on available',       '✓', '✓', '✓', '✓'],
  ['PDF delivery',                      '✓', '✓', '✓', '✓'],
  ['Turnaround',                    'Up to 1 wk', 'Up to 1 wk', 'Up to 1 wk', 'Priority'],
  ['Price',                             '$50', '$150', '$300', '$500'],
]

export default function PricingPage() {
  return (
    <>
      <SEO
        title="Pricing — Yard Analysis Packages"
        description="Simple, transparent pricing for ReScape. One-time payment. No subscriptions. Choose from Visual Concept ($50), Plan + Estimate ($150), Utah Water Savers Prep ($300), or White Glove ($500). Utah only."
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
                  <div className="pc-price">
                    <span className="pc-price-sign">$</span>
                    <span className="pc-price-amount">{pkg.price}</span>
                    <span className="pc-price-period">one-time</span>
                  </div>
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

          {/* HOA Add-on */}
          <div className="hoa-card">
            <div className="hoa-card-icon" aria-hidden="true">🏘️</div>
            <div className="hoa-card-body">
              <h3 className="hoa-card-title">HOA Design Review Add-On</h3>
              <p className="hoa-card-desc">
                For homeowners in HOA communities or neighborhoods with architectural design guidelines. We review your plan against common landscaping restriction categories and adjust design concepts to align with typical restriction types.
              </p>
              <p className="hoa-card-note">
                HOA rules vary by community. This review helps you prepare — it does not guarantee HOA board approval.
              </p>
            </div>
            <div className="hoa-card-right">
              <div className="hoa-card-price">+$75</div>
              <div className="hoa-card-period">add-on</div>
              <Link
                to="/contact?package=hoa-addon"
                className="btn btn--outline btn--sm"
                style={{ marginTop: 10 }}
              >
                Add This
              </Link>
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
