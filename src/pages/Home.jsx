import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'
import CalculatorWidget from '../components/CalculatorWidget'

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'ReScape',
  description: 'AI-generated yard concepts, CAD-style plans, cost estimates, and Utah Water Savers rebate guidance for Utah homeowners.',
  serviceType: 'Yard Planning and Analysis',
  areaServed: { '@type': 'State', name: 'Utah' },
  offers: [
    { '@type': 'Offer', name: 'Visual Concept',         price: '50',  priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Plan + Estimate',        price: '150', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Utah Water Savers Prep', price: '300', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'White Glove',            price: '500', priceCurrency: 'USD' },
  ],
}

const HOME_FAQS = [
  {
    q: 'What exactly is ReScape?',
    a: 'ReScape is a digital planning service for Utah homeowners. We deliver AI-generated yard design concepts, a CAD-style top-down plan, a cost estimate, and Utah Water Savers rebate guidance — all in a single downloadable report. We are not a landscaping company and do not perform any installations.',
  },
  {
    q: 'Do you submit the Utah Water Savers application for me?',
    a: 'No. Utah Water Savers applications are submitted directly by the homeowner to their water provider. Our Utah Water Savers Prep package helps you understand the process and organize the materials you will likely need — but you submit the application yourself.',
  },
  {
    q: 'How accurate are your cost estimates?',
    a: 'Our cost estimates are planning estimates based on general market pricing data. They are designed to help you budget and plan, not to replace a contractor quote. Actual costs will vary depending on materials, contractor, and site conditions. Always get contractor quotes before committing to a project.',
  },
  {
    q: 'What Utah Water Savers rebates might I qualify for?',
    a: 'Rebate availability and rates vary by water provider. Some Utah programs offer up to $3 per square foot for qualifying turf replacement. Eligibility depends on your specific provider, program availability, and meeting inspection requirements. Our report helps you understand what your provider generally offers — but we do not guarantee eligibility or rebate amounts.',
  },
  {
    q: 'Who is this service for?',
    a: 'ReScape is designed for Utah homeowners who want to replace turf, plan a yard project, or explore whether they qualify for Utah Water Savers rebates — before spending money on a landscaper. If you want to understand your options and see real numbers, this service is for you.',
  },
]

const PROCESS_STEPS = [
  {
    n: '1',
    title: 'Tell Us About Your Yard',
    desc: 'Fill out a short intake form with your square footage, current turf situation, goals, and Utah water provider. Upload photos of your yard so we can build an accurate plan.',
  },
  {
    n: '2',
    title: 'We Build Your Analysis',
    desc: 'Our team generates your AI concepts, top-down plan, and personalized cost and rebate estimate. Turnaround is up to 1 week from order submission.',
  },
  {
    n: '3',
    title: 'Review Your Report',
    desc: 'Download your full report PDF. Review your design concepts, your plan, and your rebate eligibility preparation materials.',
  },
  {
    n: '4',
    title: 'Move Forward Confidently',
    desc: 'Share your plan with landscapers, prepare for your Utah Water Savers application, or simply know your numbers before spending a dollar.',
  },
]

function ProcessAccordion() {
  const [open, setOpen] = useState(null)

  return (
    <div className="process-accordion">
      {PROCESS_STEPS.map((step) => {
        const isOpen = open === step.n
        return (
          <div key={step.n} className={`process-step${isOpen ? ' process-step--open' : ''}`}>
            <button
              className="process-step-header"
              onClick={() => setOpen(isOpen ? null : step.n)}
              aria-expanded={isOpen}
            >
              <span className="process-step-num">{step.n}</span>
              <span className="process-step-title">{step.title}</span>
              <span className="process-step-chevron" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="process-step-body">
                <p>{step.desc}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  return (
    <>
      <SEO
        title="Yard Plans, Costs & Utah Water Savers Guidance"
        description="AI-generated yard concepts, a CAD-style plan, and a personalized cost and Utah Water Savers rebate estimate — up to 1 week turnaround. Built for Utah homeowners."
        jsonLd={HOME_SCHEMA}
      />

      {/* ── HERO ───────────────────────────── */}
      <section className="hero">
        <div className="hero-ambient" aria-hidden="true" />
        <div className="container hero-grid">

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="badge badge--teal">Utah Homeowners</span>
              <span className="badge badge--green">Up to 1 Week Turnaround</span>
            </div>

            <h1 className="hero-title">
              Know What Your Yard Redesign Will Cost —{' '}
              <em>Before You Hire Anyone</em>
            </h1>

            <p className="hero-subtitle">
              ReScape delivers AI design concepts, a CAD-style yard plan, and a personalized cost and Utah Water Savers rebate estimate. One report. One decision.
            </p>

            <ul className="hero-list">
              <li>AI-generated design concepts across multiple styles</li>
              <li>CAD-style top-down 2D yard plan</li>
              <li>Itemized cost estimate with material + labor ranges</li>
              <li>Utah Water Savers rebate eligibility guidance</li>
              <li>HOA design review add-on available</li>
            </ul>

            <div className="hero-trust" aria-label="Trust signals">
              <span className="trust-pill">Digital planning service</span>
              <span className="trust-divider" aria-hidden="true">·</span>
              <span className="trust-pill">Not a landscape company</span>
              <span className="trust-divider" aria-hidden="true">·</span>
              <span className="trust-pill">Utah only</span>
            </div>

            <div className="hero-actions">
              <Link to="/contact" className="btn btn--orange btn--lg">
                Get Your Yard Analysis
              </Link>
              <Link to="/pricing" className="btn btn--ghost btn--lg">
                See Pricing
              </Link>
            </div>
          </div>

          {/* Product mockup */}
          <div className="hero-mockup" aria-label="Sample ReScape report preview" role="img">
            <div className="mockup-bar">
              <div className="mockup-dots">
                <span className="mockup-dot r" aria-hidden="true" />
                <span className="mockup-dot y" aria-hidden="true" />
                <span className="mockup-dot g" aria-hidden="true" />
              </div>
              <span className="mockup-filename">ReScape_Report_Sample.pdf</span>
              <span className="mockup-ready">
                <span className="mockup-ready-dot" aria-hidden="true" />
                Ready
              </span>
            </div>
            <div className="mockup-body">
              <div className="mockup-cell">
                <span className="mockup-cell-label">Design Concepts</span>
                <div className="mockup-thumbs">
                  <div className="mockup-thumb" />
                  <div className="mockup-thumb" />
                  <div className="mockup-thumb" />
                  <div className="mockup-thumb" />
                </div>
              </div>
              <div className="mockup-cell">
                <span className="mockup-cell-label">Top-Down Plan</span>
                <div className="mockup-blueprint" aria-hidden="true" />
              </div>
              <div className="mockup-cell">
                <span className="mockup-cell-label">Cost Estimate</span>
                <div className="mockup-costs">
                  <div className="mockup-cost-row">Decomposed Granite <strong>$1,800–$3,200</strong></div>
                  <div className="mockup-cost-row">Drip Irrigation     <strong>$800–$1,400</strong></div>
                  <div className="mockup-cost-row">Native Plants       <strong>$600–$1,000</strong></div>
                  <div className="mockup-cost-row">Labor (est.)        <strong>$1,200–$2,800</strong></div>
                </div>
              </div>
              <div className="mockup-cell">
                <span className="mockup-cell-label">Rebate Estimate</span>
                <div className="mockup-rebate">
                  <div className="mockup-rebate-num">Up to $4,500</div>
                  <div className="mockup-rebate-lbl">Utah Water Savers (example)</div>
                  <div className="mockup-rebate-note">* 1,500 sq ft × $3/sq ft example. Actual rebate depends on your provider. Not a guarantee.</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── DELIVERABLES ───────────────────── */}
      <section className="section section--dark" id="deliverables">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">What's Included</span>
            <h2 className="section-title">Every report. Every plan level.</h2>
            <p className="section-desc">
              Each ReScape report gives you everything you need to plan intelligently — without committing to a contractor first.
            </p>
          </div>

          <div className="deliverables-grid">
            <div className="deliverable-card">
              <span className="plan-badge">Visual Concept+</span>
              <div className="deliverable-icon" aria-hidden="true">🎨</div>
              <h3 className="deliverable-title">AI Design Concepts</h3>
              <p className="deliverable-desc">
                Up to 10 AI-generated yard visuals across multiple design directions — drought-tolerant, desert-modern, native plant, and more. A visual starting point before you hire anyone.
              </p>
            </div>
            <div className="deliverable-card">
              <span className="plan-badge">Plan + Estimate+</span>
              <div className="deliverable-icon" aria-hidden="true">📐</div>
              <h3 className="deliverable-title">CAD-Style Top-Down Plan</h3>
              <p className="deliverable-desc">
                A detailed 2D blueprint view of your yard layout — plants, hardscape, dimensions, and irrigation zones. Shareable with landscapers and usable for Utah Water Savers applications.
              </p>
            </div>
            <div className="deliverable-card">
              <span className="plan-badge">Plan + Estimate+</span>
              <div className="deliverable-icon" aria-hidden="true">💰</div>
              <h3 className="deliverable-title">Cost + Rebate Estimate</h3>
              <p className="deliverable-desc">
                An itemized project cost estimate with material and labor ranges, a water-saving projection, and Utah Water Savers rebate guidance based on your provider and square footage.
              </p>
            </div>
            <div className="deliverable-card">
              <span className="plan-badge plan-badge--teal">Add-On</span>
              <div className="deliverable-icon" aria-hidden="true">🏘️</div>
              <h3 className="deliverable-title">HOA Design Review</h3>
              <p className="deliverable-desc">
                We review your plan against common HOA landscaping restriction categories and adjust concepts accordingly. Does not guarantee HOA board approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────── */}
      <section className="section" id="how-it-works-preview">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">The Process</span>
            <h2 className="section-title">From idea to plan in up to 1 week</h2>
            <p className="section-desc">No design experience needed. No landscaper required upfront.</p>
          </div>

          <ProcessAccordion />

          <p className="step-note">
            Utah Water Savers applications are submitted by the homeowner directly to their water provider. We help you prepare — we do not submit on your behalf.{' '}
            <Link to="/how-it-works" style={{ color: 'var(--teal)' }}>Learn more about the process →</Link>
          </p>
        </div>
      </section>

      {/* ── CALCULATOR ─────────────────────── */}
      <section className="section section--dark" id="calculator">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Free Estimate Tool</span>
            <h2 className="section-title">Estimate your rebate in 30 seconds</h2>
            <p className="section-desc">
              Select your city and yard size to see your potential Utah Water Savers rebate estimate.
            </p>
          </div>
          <CalculatorWidget embedded={true} />
        </div>
      </section>

      {/* ── PACKAGES PREVIEW ───────────────── */}
      <section className="section" id="packages-preview">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Pricing</span>
            <h2 className="section-title">Four packages. One-time payment.</h2>
            <p className="section-desc">No subscriptions. No installations. A report you keep and use. Utah only.</p>
          </div>

          <div className="packages-grid packages-grid--4">
            {/* Package 1 */}
            <div className="pkg-card">
              <div className="pkg-header">
                <div className="pkg-name">Visual Concept</div>
              </div>
              <div className="pkg-price">
                <span className="pkg-price-sign">$</span>
                <span className="pkg-price-amount">50</span>
                <span className="pkg-price-period">one-time</span>
              </div>
              <p className="pkg-tagline">Explore ideas before committing to a full plan.</p>
              <ul className="check-list pkg-features">
                <li>10 AI-generated yard concept images</li>
                <li>Multiple design directions</li>
                <li>PDF delivery, up to 1 week</li>
              </ul>
              <Link to="/contact?package=visual-concept" className="btn btn--ghost btn--full">
                Get Started
              </Link>
            </div>

            {/* Package 2 */}
            <div className="pkg-card">
              <div className="pkg-header">
                <div className="pkg-name">Plan + Estimate</div>
              </div>
              <div className="pkg-price">
                <span className="pkg-price-sign">$</span>
                <span className="pkg-price-amount">150</span>
                <span className="pkg-price-period">one-time</span>
              </div>
              <p className="pkg-tagline">Everything you need to plan and get contractor quotes.</p>
              <ul className="check-list pkg-features">
                <li>Everything in Visual Concept</li>
                <li>CAD-style top-down 2D plan</li>
                <li>Itemized cost estimate + water-saving projection</li>
              </ul>
              <Link to="/contact?package=plan-estimate" className="btn btn--ghost btn--full">
                Get Started
              </Link>
            </div>

            {/* Package 3 — Featured */}
            <div className="pkg-card pkg-card--featured">
              <div className="pkg-header">
                <div className="pkg-name">Water Savers Prep</div>
                <span className="pkg-popular">Most Popular</span>
              </div>
              <div className="pkg-price">
                <span className="pkg-price-sign">$</span>
                <span className="pkg-price-amount">300</span>
                <span className="pkg-price-period">one-time</span>
              </div>
              <p className="pkg-tagline">For homeowners pursuing Utah Water Savers rebates.</p>
              <ul className="check-list pkg-features">
                <li>Everything in Plan + Estimate</li>
                <li>Rebate eligibility guidance for your provider</li>
                <li>Document prep assistance + priority support</li>
              </ul>
              <p className="pkg-legal-note">
                We help you prepare materials. You submit your own application directly to your provider. No guarantee of approval.
              </p>
              <Link to="/contact?package=water-savers-prep" className="btn btn--orange btn--full">
                Get Started
              </Link>
            </div>

            {/* Package 4 — Premium */}
            <div className="pkg-card pkg-card--premium">
              <div className="pkg-header">
                <div className="pkg-name">White Glove</div>
                <span className="pkg-premium">Premium</span>
              </div>
              <div className="pkg-price">
                <span className="pkg-price-sign">$</span>
                <span className="pkg-price-amount">500</span>
                <span className="pkg-price-period">one-time</span>
              </div>
              <p className="pkg-tagline">Full-service planning with maximum support and detail.</p>
              <ul className="check-list pkg-features">
                <li>Everything in Water Savers Prep</li>
                <li>Extended design consultation</li>
                <li>Contractor referral support</li>
                <li>Priority turnaround + dedicated support</li>
              </ul>
              <Link to="/contact?package=white-glove" className="btn btn--outline btn--full">
                Get Started
              </Link>
            </div>
          </div>

          {/* HOA Strip */}
          <div className="hoa-strip">
            <div className="hoa-strip-icon" aria-hidden="true">🏘️</div>
            <div className="hoa-strip-body">
              <div className="hoa-strip-title">HOA Design Review Add-On — +$75</div>
              <div className="hoa-strip-desc">
                Live in a community with HOA or architectural design guidelines? We review your plan against common landscaping restriction categories and adjust concepts accordingly.{' '}
                <em style={{ color: 'var(--text-muted)', fontSize: 12 }}>Does not guarantee HOA board approval.</em>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/pricing" style={{ color: 'var(--teal)', fontSize: 14, fontWeight: 600 }}>
              See full pricing details and comparison table →
            </Link>
          </div>
        </div>
      </section>

      {/* ── UTAH WATER SAVERS FACTS ────────── */}
      <section className="section section--dark" id="rebate-facts">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Utah Water Savers</span>
            <h2 className="section-title">What the rebate program actually pays</h2>
            <p className="section-desc">
              Rates vary by water district. Here's what we typically see across Utah providers.
            </p>
          </div>

          <div className="ws-rates-grid">
            <div className="ws-rate-card">
              <div className="ws-rate-district">JVWCD</div>
              <div className="ws-rate-cities">Jordan Valley Water Conservancy District</div>
              <div className="ws-rate-amount">Up to $3.00<span>/sq ft</span></div>
              <div className="ws-rate-cities-list">Salt Lake City, West Jordan, South Jordan, Draper, Herriman, Riverton, and more</div>
            </div>
            <div className="ws-rate-card">
              <div className="ws-rate-district">CUWCD</div>
              <div className="ws-rate-cities">Central Utah Water Conservancy District</div>
              <div className="ws-rate-amount">~$1.75–$2.75<span>/sq ft</span></div>
              <div className="ws-rate-cities-list">Provo, Orem, Lehi, American Fork, Spanish Fork, Springville, and more</div>
            </div>
            <div className="ws-rate-card">
              <div className="ws-rate-district">WBWCD</div>
              <div className="ws-rate-cities">Weber Basin Water Conservancy District</div>
              <div className="ws-rate-amount">~$2.50<span>/sq ft</span></div>
              <div className="ws-rate-cities-list">Ogden, Layton, Clearfield, Roy, Kaysville, Bountiful, and more</div>
            </div>
          </div>

          <div className="ws-disclaimer">
            Rates are planning estimates based on publicly available program information. Verify current rates and eligibility directly with your water provider. ReScape is not affiliated with Utah Water Savers or any water district.{' '}
            <Link to="/rebate-info" style={{ color: 'var(--teal)' }}>Full rebate info →</Link>
          </div>
        </div>
      </section>

      {/* ── EXAMPLE ANALYSIS BLOCK ─────────── */}
      <section className="section" id="example-block">
        <div className="container">
          <div className="example-block">
            <div className="example-block-content">
              <div className="section-header section-header--left">
                <span className="eyebrow">What to Expect</span>
                <h2 className="section-title">See what a real report looks like</h2>
                <p className="section-desc">
                  Your report is a complete planning document — not a brochure. Here's what's inside every full analysis.
                </p>
              </div>
              <div className="example-list">
                {[
                  { icon: '🎨', text: 'Up to 10 AI concept images showing different design directions for your yard' },
                  { icon: '📐', text: 'A top-down CAD-style 2D plan with plant placement, hardscape, and layout dimensions' },
                  { icon: '📋', text: 'Itemized cost estimate with material and labor ranges — not vague ballparks' },
                  { icon: '💧', text: 'Water-saving projection compared to your current turf' },
                  { icon: '🌿', text: 'Utah Water Savers rebate guidance tailored to your provider (Prep package and above)' },
                ].map((item, i) => (
                  <div key={i} className="example-list-item">
                    <span className="example-list-item-icon" aria-hidden="true">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <Link to="/examples" className="btn btn--outline">
                View sample reports →
              </Link>
            </div>

            <div className="mock-report-card" aria-label="Sample report preview">
              <div className="mock-report-header">
                <div>
                  <div className="mock-report-title">Sample Analysis Report</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Example: 1,500 sq ft front yard, Salt Lake County
                  </div>
                </div>
                <span className="mock-report-sample">SAMPLE ONLY</span>
              </div>
              <div className="mock-report-body">
                <div>
                  <div className="example-concepts-label">Design Concepts</div>
                  <div className="mock-thumbs-row">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="mock-thumb-card">Concept {i + 1}</div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="example-plan-label">Top-Down Plan</div>
                  <div className="mock-plan-row">CAD-Style Plan</div>
                </div>
                <div className="mock-stats-row">
                  <div className="mock-stat">
                    <div className="mock-stat-label">Est. Project Cost</div>
                    <div className="mock-stat-value">$8,400–$14,200</div>
                    <div className="mock-stat-note">Example range — varies by contractor & materials</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">Est. Rebate (example)</div>
                    <div className="mock-stat-value green">Up to $4,500</div>
                    <div className="mock-stat-note">1,500 sq ft × $3/sq ft — not a guarantee</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────── */}
      <section className="section section--dark" id="faq-preview">
        <div className="container--xs">
          <div className="section-header">
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Common questions</h2>
          </div>

          <FAQAccordion items={HOME_FAQS} />

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link to="/faq" style={{ color: 'var(--teal)', fontSize: 14, fontWeight: 600 }}>
              See all frequently asked questions →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT THIS SERVICE ─────────────── */}
      <section className="section" id="about-service">
        <div className="container--xs">
          <div className="about-service">
            <h2 className="about-service-title">About This Service</h2>
            <p>
              ReScape is a <strong>digital planning and analysis service</strong>. We provide informational reports to help Utah homeowners plan yard projects. We are not licensed contractors, landscape architects, civil engineers, or financial advisors. Nothing in our reports constitutes professional contracting, engineering, architectural, financial, or legal advice.
            </p>
            <p>
              We are not affiliated with Utah Water Savers, CUWCD, or any water provider. All cost estimates, rebate projections, and water savings figures are <strong>planning estimates only</strong>. Verify all program details directly with your water provider before making financial decisions.
            </p>
            <div className="about-service-links">
              <Link to="/disclaimer">Full Disclaimer</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────── */}
      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">
            Stop guessing. Start planning.
          </h2>
          <p className="final-cta-sub">
            Get your yard designed, costed, and rebate-ready — all in one report. Know the numbers before you spend a dollar.
          </p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">
              Get Your Yard Analysis
            </Link>
            <Link to="/pricing" className="btn btn--ghost btn--lg">
              See Pricing
            </Link>
          </div>
          <p className="final-cta-note">
            No installation. No subscription. A digital report you keep. Utah only.
          </p>
        </div>
      </div>
    </>
  )
}
