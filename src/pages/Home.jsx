import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'
import CalculatorWidget from '../components/CalculatorWidget'

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'ReScapeUtah',
  description: 'AI-powered yard planning for Utah homeowners. Design concepts, CAD blueprints, cost estimates, and Utah Water Savers rebate guidance.',
  serviceType: 'Yard Planning and Analysis',
  areaServed: { '@type': 'State', name: 'Utah' },
  url: 'https://rescapeutah.com',
  offers: [
    { '@type': 'Offer', name: 'Visual Concept', price: '50', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Plan + Estimate', price: '150', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Utah Water Savers Prep', price: '300', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'White Glove', price: '500', priceCurrency: 'USD' },
  ],
}

const HOME_FAQS = [
  {
    q: 'What is ReScapeUtah?',
    a: 'ReScapeUtah is a digital planning and visualization service for Utah homeowners. We produce AI-powered design concepts, CAD-style yard blueprints, itemized cost estimates, and Utah Water Savers rebate preparation materials — all delivered as a downloadable PDF. We are not a landscaping company and do not perform any physical installation.',
  },
  {
    q: 'Do you submit the Utah Water Savers application for me?',
    a: 'No. Utah Water Savers applications are submitted directly by the homeowner to their water provider through utahwatersavers.com. Our Utah Water Savers Prep package helps you understand the process and organize the materials you will likely need — but you submit the application yourself.',
  },
  {
    q: 'How accurate are your cost estimates?',
    a: 'Our cost estimates are planning estimates based on general market pricing data. They are designed to help you budget and plan, not to replace a contractor quote. Actual costs will vary depending on materials, contractor, and site conditions. Always get contractor quotes before committing to a project.',
  },
  {
    q: 'What Utah Water Savers rebates might I qualify for?',
    a: 'Rebate availability and rates vary by water provider. Some Utah programs offer up to $3 per square foot for qualifying grass replacement. Eligibility depends on your specific provider, program availability, and meeting inspection requirements. Our report helps you understand what your provider generally offers — but we do not guarantee eligibility or rebate amounts.',
  },
  {
    q: 'Who is this service for?',
    a: 'ReScapeUtah is designed for Utah homeowners who want to replace grass, plan a yard project, or explore whether they qualify for Utah Water Savers rebates — before spending money on a landscaper. If you want to understand your options and see real numbers, this service is for you.',
  },
]

const PROCESS_STEPS = [
  {
    n: '1',
    title: 'Fill Out the Intake Form',
    summary: 'Tell us about your yard, your goals, and upload photos.',
    detail: "Our intake form collects your yard square footage, grass coverage, terrain type, multiple yard photos, and a description of what you want — along with your street address and email. For Utah Water Savers Prep plans, select your Utah city so we can match your provider's rebate rates.",
  },
  {
    n: '2',
    title: 'Choose Your Design Direction',
    summary: 'We produce AI-powered concept images — you pick your favorite.',
    detail: "Our design system generates multiple concept images based on your yard's actual dimensions, photos, and preferences. You review the options and select which direction to refine. Visual Concept customers receive their concepts here. Plan + Estimate and above proceed to the blueprint phase.",
  },
  {
    n: '3',
    title: 'Receive Your Blueprint & Estimates',
    summary: 'We refine your chosen concept into a CAD blueprint with itemized costs.',
    detail: "Your selected concept becomes a detailed 2D top-down plan showing plant placement, hardscape, materials, and dimensions. Paired with an itemized cost estimate and, for Water Savers plans, rebate preparation guidance aligned with your provider's requirements.",
  },
  {
    n: '4',
    title: 'Move Forward Confidently',
    summary: 'Share your plan with landscapers, apply for rebates, or just know your numbers.',
    detail: 'Use your blueprint to get contractor bids. Use your rebate preparation materials to guide your Utah Water Savers application (submitted by you through utahwatersavers.com). White Glove customers receive a vetted contractor referral in their area.',
  },
]

const PKG_PREVIEW = [
  {
    id: 'visual-concept',
    name: 'Visual Concept',
    price: 49.99, was: 89,
    tagline: 'Explore ideas before committing to a full plan.',
    features: ['Up to 10 AI-powered design concepts', 'Multiple design directions & styles', 'Downloadable PDF'],
    cta: 'Get Started', featured: false, premium: false,
  },
  {
    id: 'plan-estimate',
    name: 'Plan + Estimate',
    price: 149.99, was: 249,
    tagline: 'Everything you need to plan and get accurate contractor quotes.',
    features: ['Everything in Visual Concept', 'CAD-style top-down 2D blueprint', 'Itemized cost estimate + water-saving projection'],
    cta: 'Get Started', featured: false, premium: false,
  },
  {
    id: 'water-savers-prep',
    name: 'Water Savers Prep',
    price: 299.99, was: 499,
    tagline: 'For homeowners pursuing Utah Water Savers rebates.',
    features: ['Everything in Plan + Estimate', 'Rebate eligibility guidance for your provider', 'Document prep assistance + priority support', 'Utah properties only'],
    cta: 'Get Started', featured: true, premium: false,
  },
  {
    id: 'white-glove',
    name: 'White Glove',
    price: 499.99, was: 799,
    tagline: 'Full-service planning with maximum support.',
    features: ['Everything in Water Savers Prep', 'Extended design consultation', 'One complimentary design revision included', 'Contractor referral support', 'Utah properties only'],
    cta: 'Get Started', featured: false, premium: true,
  },
]

const WHY_ITEMS_FEATURED = {
  icon: '💧',
  title: 'Save Water, Save Utah',
  stat: '60%',
  statLabel: "of Utah's residential water use goes toward outdoor irrigation",
  body: "Utah's 2026 snowpack is the lowest on record, peaking three weeks early. The Great Salt Lake has lost two-thirds of its historic volume. The Utah Legislature allocated $13 million to accelerate grass removal statewide. Converting your lawn to water-efficient landscaping can reduce outdoor water use by 50–75%. Every gallon matters.",
  source: "Great Salt Lake Commissioner's 2024 Strategic Plan; Utah Division of Water Resources; Utah Legislature 2024",
}

const WHY_ITEMS_REST = [
  {
    icon: '💵',
    title: 'Lower Your Water Bill',
    body: "The average Utah household spends over $1,200 per year watering a quarter-acre lawn. Water-efficient landscaping dramatically reduces irrigation costs. Use our free calculator for a personalized estimate based on your yard size and provider.",
    source: 'Granger-Hunter Improvement District usage estimates',
  },
  {
    icon: '🏡',
    title: "Increase Your Home's Value",
    body: "Water-efficient landscaping is increasingly valued by buyers in Utah's real estate market. Properties with professionally designed, low-maintenance yards stand out — especially in communities where water conservation is becoming the norm.",
    source: null,
  },
  {
    icon: '🏆',
    title: 'LEED & Sustainability Scoring',
    body: "Water-efficient landscaping contributes to LEED certification under the Water Efficiency credit category. LEED awards up to 5 points for reducing potable water used in irrigation — a 50% reduction earns 1 point, 75% earns 3 points, eliminating potable irrigation entirely earns all 5. LEED has four levels: Certified (40–49 pts), Silver (50–59), Gold (60–79), Platinum (80+). Note: LEED certification is administered by the U.S. Green Building Council (USGBC) and applies primarily to commercial and institutional buildings. Rescaped is not affiliated with the USGBC. Consult a LEED Accredited Professional for project-specific guidance.",
    source: 'U.S. Green Building Council (USGBC)',
  },
  {
    icon: '🏠',
    title: 'Home Value & Tax Considerations',
    body: "Landscape improvements that permanently increase your home's value may qualify as capital improvements, potentially affecting your cost basis when you sell. Note: Xeriscaping and water-saving landscaping currently do not qualify for the federal Energy Efficient Home Improvement Credit or the Residential Clean Energy Credit. The primary financial incentive for Utah homeowners is the Utah Water Savers rebate program. Consult a qualified tax professional for guidance on your specific situation.",
    source: null,
  },
  {
    icon: '🌱',
    title: 'Reduce Maintenance',
    body: 'No mowing, less weeding, fewer chemicals. Water-efficient yards require a fraction of the maintenance time and cost compared to traditional lawns. More weekends, less work.',
    source: null,
  },
  {
    icon: '🤝',
    title: 'Improve Your Neighborhood',
    body: 'When one home on the block converts, neighbors notice. Water-efficient landscaping raises the visual standard of the entire street and can encourage community-wide adoption. A more sustainable neighborhood is a more valuable one.',
    source: null,
  },
]

const GALLERY_CONCEPTS = [
  { label: 'Desert Modern', sub: 'Decomposed granite + native shrubs', gradient: 'linear-gradient(145deg,#1e3822,#0c1e10)' },
  { label: 'Xeriscape Naturalist', sub: 'Native grasses + boulders', gradient: 'linear-gradient(145deg,#1a2e1c,#0a1c10)' },
  { label: 'Clean & Contemporary', sub: 'Permeable pavers + ornamental plants', gradient: 'linear-gradient(145deg,#22341e,#101e0c)' },
  { label: 'Cottage Garden', sub: 'Wildflowers + low-water perennials', gradient: 'linear-gradient(145deg,#162a18,#0c1c0e)' },
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
              <span className="process-step-chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            <div className={`process-step-body${isOpen ? ' process-step-body--open' : ''}`}>
              <p style={{ color: 'var(--text-sec)', marginBottom: 8 }}>{step.summary}</p>
              <p>{step.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WhyAccordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="why-accordion">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className={`why-acc-item${isOpen ? ' why-acc-item--open' : ''}`}>
            <button
              className="why-acc-header"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="why-acc-icon" aria-hidden="true">{item.icon}</span>
              <span className="why-acc-title">{item.title}</span>
              <span className="why-acc-chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="why-acc-body">
                <p>{item.body}</p>
                {item.source && (
                  <p className="why-acc-source">Source: {item.source}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const [copied, setCopied] = useState(false)
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [])

  return (
    <>
      <SEO
        title="Yard Plans, Costs & Utah Water Savers Guidance"
        description="AI-powered yard concepts, a CAD-style plan, and a personalized cost and Utah Water Savers rebate estimate. Built for Utah homeowners."
        jsonLd={HOME_SCHEMA}
      />

      {/* ── 1. HERO ───────────────────────────── */}
      <section className="hero">
        <div className="hero-ambient" aria-hidden="true" />
        <div className="container hero-grid">

          <div className="hero-content">
            <div className="hero-nav-pills">
              <button
                className="hero-pill"
                onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
              >
                💧 Free Rebate Calculator
              </button>
              <Link to="/pricing" className="hero-pill">📦 See Plans</Link>
              <button
                className="hero-pill"
                onClick={() => document.getElementById('why-convert')?.scrollIntoView({ behavior: 'smooth' })}
              >
                🌿 See All Incentives
              </button>
            </div>

            <h1 className="hero-title">
              Know What Your Yard Redesign Will Cost —{' '}
              <em>Before You Hire Anyone</em>
            </h1>

            <p className="hero-subtitle">
              ReScapeUtah delivers AI-powered design concepts, a CAD-style yard blueprint, and a personalized cost and Utah Water Savers rebate estimate. One report. One decision.
            </p>

            <ul className="hero-list">
              <li>AI-powered design concepts across multiple styles</li>
              <li>CAD-style top-down 2D yard blueprint</li>
              <li>Itemized cost estimate with material + labor ranges</li>
              <li>Utah Water Savers rebate eligibility guidance</li>
            </ul>

            <div className="hero-actions">
              <Link to="/contact" className="btn btn--orange btn--lg">
                Start Your Analysis
              </Link>
              <button
                className="btn btn--teal btn--lg"
                onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See What You Could Save
              </button>
            </div>
          </div>

          {/* Product mockup */}
          <div className="hero-mockup" aria-label="Sample ReScapeUtah report preview" role="img">
            <div className="mockup-bar">
              <div className="mockup-dots">
                <span className="mockup-dot r" aria-hidden="true" />
                <span className="mockup-dot y" aria-hidden="true" />
                <span className="mockup-dot g" aria-hidden="true" />
              </div>
              <span className="mockup-filename">ReScapeUtah_Report_Sample.pdf</span>
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

      {/* ── 2. CALCULATOR ─────────────────────── */}
      <section className="section section--dark" id="calculator-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Free Estimate Tool</span>
            <h2 className="section-title">Estimate your rebate</h2>
            <p className="section-desc">
              Select your city and yard size to see your potential Utah Water Savers rebate estimate.
            </p>
          </div>
          <CalculatorWidget embedded={true} />
        </div>
      </section>

      {/* ── 3. GALLERY PREVIEW ────────────────── */}
      <section className="section" id="gallery-preview">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">AI-Powered Design Concepts</span>
            <h2 className="section-title">What your yard could look like</h2>
            <p className="section-desc">
              Every analysis includes design concepts based on YOUR yard's photos — multiple styles, real dimensions, your preferences.
            </p>
          </div>

          <div className="gallery-preview-grid">
            {GALLERY_CONCEPTS.map((concept, i) => (
              <div key={i} className="gallery-preview-card">
                <div
                  className="gallery-preview-img"
                  style={{ background: concept.gradient }}
                  aria-hidden="true"
                />
                <div className="gallery-preview-caption">
                  <div className="gallery-preview-label">{concept.label}</div>
                  <div className="gallery-preview-sub">{concept.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/gallery" className="btn btn--outline">
              View full gallery →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. SAMPLE REPORT ──────────────────── */}
      <section className="section section--dark" id="sample-report">
        <div className="container">
          <div className="example-block">
            <div className="example-block-content">
              <div className="section-header section-header--left">
                <span className="eyebrow">What to Expect</span>
                <h2 className="section-title">See what a real report looks like</h2>
                <p className="section-desc">
                  Your report is a complete planning document — not a brochure. Here's what's inside a full analysis.
                </p>
              </div>
              <div className="report-feature-list">
                {[
                  { icon: '🎨', label: 'AI-Powered Design Concepts', desc: 'Up to 10 concept images showing different design directions for your yard' },
                  { icon: '📐', label: 'CAD-Style Top-Down Plan', desc: 'Plant placement, hardscape, layout dimensions — ready to share with contractors' },
                  { icon: '📋', label: 'Itemized Cost Estimate', desc: 'Material and labor ranges — not vague ballparks' },
                  { icon: '💧', label: 'Water-Saving Projection', desc: 'Estimated annual gallons saved compared to your current grass area' },
                  { icon: '🌿', label: 'Rebate Guidance', desc: 'Utah Water Savers eligibility tailored to your provider (Prep package and above)' },
                ].map((item, i) => (
                  <div key={i} className="report-feature-item">
                    <div className="report-feature-icon" aria-hidden="true">{item.icon}</div>
                    <div className="report-feature-text">
                      <div className="report-feature-label">{item.label}</div>
                      <div className="report-feature-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/examples" className="btn btn--outline">
                  View sample reports →
                </Link>
                <button
                  className="btn btn--ghost"
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See your estimated rebate →
                </button>
              </div>
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

      {/* ── 5. WHY CONVERT ──────────────────── */}
      <section className="section" id="why-convert">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Why Convert</span>
            <h2 className="section-title">Why convert your yard?</h2>
            <p className="section-desc">The case for replacing grass covers water, money, your home's value, and Utah's future.</p>
          </div>

          {/* Featured first item — Save Water, Save Utah */}
          <div className="why-featured-card">
            <div className="why-featured-left">
              <div className="why-featured-icon" aria-hidden="true">{WHY_ITEMS_FEATURED.icon}</div>
              <h3 className="why-featured-title">{WHY_ITEMS_FEATURED.title}</h3>
              <p className="why-featured-body">{WHY_ITEMS_FEATURED.body}</p>
              {WHY_ITEMS_FEATURED.source && (
                <p className="why-acc-source">Source: {WHY_ITEMS_FEATURED.source}</p>
              )}
            </div>
            <div className="why-featured-right">
              <div className="why-featured-stat">{WHY_ITEMS_FEATURED.stat}</div>
              <div className="why-featured-stat-label">{WHY_ITEMS_FEATURED.statLabel}</div>
            </div>
          </div>

          <WhyAccordion items={WHY_ITEMS_REST} />

          {/* Why not just use AI yourself? */}
          <div className="why-ai-callout">
            <div className="why-ai-callout-icon" aria-hidden="true">🤖</div>
            <div className="why-ai-callout-content">
              <h3 className="why-ai-callout-title">Why not just use an AI tool yourself?</h3>
              <p className="why-ai-callout-body">
                You could — but a general-purpose AI doesn't know your yard's actual dimensions, your water district's specific rebate rates, or what Utah Water Savers requires for compliance. We combine AI-generated design with <strong>site-specific inputs</strong>: your photos, your square footage, your provider's program rules. The result is a ready-to-use planning document — not a conversation you have to interpret and copy-paste from.
              </p>
            </div>
          </div>

          <div className="why-cta-row">
            <div className="why-cta-text">
              <div className="why-cta-title">See how much you could save</div>
              <div className="why-cta-desc">Use our free calculator — enter your grass area and Utah city to get a personalized rebate and water savings estimate.</div>
            </div>
            <button
              className="btn btn--teal btn--lg"
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Try the Calculator
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ────────────────── */}
      <section className="section section--dark" id="how-it-works-preview">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">The Process</span>
            <h2 className="section-title">From idea to plan</h2>
            <p className="section-desc">No design experience needed. No landscaper required upfront.</p>
          </div>

          <ProcessAccordion />

          <p className="step-note">
            Utah Water Savers applications are submitted by the homeowner directly to their water provider through{' '}
            <a href="https://utahwatersavers.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>utahwatersavers.com</a>.
            We help you prepare — we do not submit on your behalf.{' '}
            <Link to="/how-it-works" style={{ color: 'var(--teal)' }}>Learn more about the process →</Link>
          </p>
        </div>
      </section>

      {/* ── 7. DELIVERABLES ──────────────────── */}
      <section className="section" id="deliverables">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">What's Included</span>
            <h2 className="section-title">Your deliverables. One decision-ready report.</h2>
            <p className="section-desc">
              Deliverables vary by plan —{' '}
              <Link to="/pricing" style={{ color: 'var(--teal)' }}>see full pricing for details</Link>.
            </p>
          </div>
          <div className="deliverables-grid">
            <div className="deliverable-card">
              <span className="plan-badge">All plans</span>
              <div className="deliverable-icon">🎨</div>
              <h3 className="deliverable-title">AI-Powered Design Concepts</h3>
              <p className="deliverable-desc">Up to 10–30 design concepts (varies by plan) exploring drought-tolerant, desert-modern, native plant, and other directions — all based on your yard's actual photos and dimensions.</p>
            </div>
            <div className="deliverable-card">
              <span className="plan-badge">Plan + Estimate · Water Savers Prep · White Glove</span>
              <div className="deliverable-icon">📐</div>
              <h3 className="deliverable-title">CAD-Style Top-Down Blueprint</h3>
              <p className="deliverable-desc">After you select your preferred concept, we produce a detailed 2D blueprint — plant placement, hardscape zones, dimensions, and material callouts. Ready to share with landscapers or use for rebate applications.</p>
            </div>
            <div className="deliverable-card">
              <span className="plan-badge">Plan + Estimate · Water Savers Prep · White Glove</span>
              <div className="deliverable-icon">💰</div>
              <h3 className="deliverable-title">Cost + Rebate Estimate</h3>
              <p className="deliverable-desc">Itemized cost estimates for materials, plants, and approximate labor. Includes water-saving projections and Utah Water Savers rebate guidance based on your provider and square footage. All figures are planning estimates.</p>
            </div>
            <div className="deliverable-card">
              <span className="plan-badge plan-badge--orange">Add-on · Water Savers Prep &amp; White Glove only</span>
              <div className="deliverable-icon">🔄</div>
              <h3 className="deliverable-title">Design Revision</h3>
              <p className="deliverable-desc">Update your compliance-aligned CAD blueprint after contractor feedback, HOA input, or changed requirements. White Glove includes one complimentary revision. Not available for Visual Concept or Plan + Estimate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. PRICING ──────────────────────── */}
      <section className="section section--dark" id="packages-preview">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Pricing</span>
            <h2 className="section-title">Four packages. One-time payment.</h2>
            <p className="section-desc">No subscriptions. No installations. A report you keep and use.</p>
          </div>

          <div className="packages-grid packages-grid--4">
            {PKG_PREVIEW.map(pkg => (
              <div key={pkg.id} className={`pkg-card${pkg.featured ? ' pkg-card--featured' : ''}${pkg.premium ? ' pkg-card--premium' : ''}`}>
                <div className="pkg-header">
                  <div className="pkg-name">{pkg.name}</div>
                  {pkg.featured && <span className="pkg-popular">Most Popular</span>}
                  {pkg.premium  && <span className="pkg-premium">Premium</span>}
                </div>
                <div className="pkg-price-row">
                  <span className="pkg-price-was">${pkg.was}</span>
                  <div className="pkg-price" style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span className="pkg-price-sign">$</span>
                    <span className="pkg-price-amount">{pkg.price.toFixed(2)}</span>
                    <span className="pkg-price-period">one-time</span>
                  </div>
                </div>
                <div><span className="pkg-launch-tag">Launch pricing</span></div>
                <p className="pkg-tagline">{pkg.tagline}</p>
                <ul className="check-list pkg-features">
                  {pkg.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <Link
                  to={`/contact?package=${pkg.id}`}
                  className={`btn btn--full${pkg.featured ? ' btn--orange' : pkg.premium ? ' btn--outline' : ' btn--ghost'}`}
                >
                  {pkg.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Design Revision Add-on Strip */}
          <div className="hoa-strip">
            <div className="hoa-strip-icon" aria-hidden="true">🔄</div>
            <div className="hoa-strip-body">
              <div className="hoa-strip-title">Design Revision Add-On</div>
              <div className="hoa-strip-desc">
                For Utah Water Savers Prep and White Glove customers: need your CAD blueprint updated after contractor feedback or changed requirements? We revise your compliance-aligned plan with your new input.{' '}
                <em style={{ color: 'var(--text-muted)', fontSize: 12 }}>White Glove includes one complimentary revision.</em>
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

      {/* ── 8.5. REFERRAL ───────────────────── */}
      <section className="section section--dark section--sm" id="referral">
        <div className="container">
          <div className="referral-block">
            <div className="referral-block-text">
              <h3 className="referral-block-title">Know someone who should see this?</h3>
              <p className="referral-block-desc">Share Rescaped with a neighbor or friend planning a yard project.</p>
            </div>
            <button
              className={`btn btn--teal referral-copy-btn${copied ? ' referral-copy-btn--copied' : ''}`}
              onClick={handleCopyLink}
              aria-live="polite"
            >
              {copied ? '✓ Link copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ──────────────────────────── */}
      <section className="section" id="faq-preview">
        <div className="container--xs">
          <div className="section-header">
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <FAQAccordion items={HOME_FAQS} />

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link to="/faq" style={{ color: 'var(--teal)', fontSize: 14, fontWeight: 600 }}>
              See all frequently asked questions →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA ──────────────────── */}
      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Stop guessing. Start planning.</h2>
          <p className="final-cta-sub">Get your yard designed, costed, and rebate-ready — all in one report.</p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Start Your Analysis</Link>
            <Link to="/pricing" className="btn btn--teal btn--lg">See Pricing</Link>
            <button className="btn btn--ghost btn--lg" onClick={() => document.getElementById('calculator')?.scrollIntoView({behavior:'smooth'})}>Try the Calculator</button>
          </div>
          <p className="final-cta-note">One-time payment. No subscription. No installation.</p>
        </div>
      </div>

      {/* ── 11. DISCLAIMER ─────────────────── */}
      <div className="pre-footer-disclaimer">
        <div className="container">
          <p>
            ReScapeUtah is a digital planning and visualization service. We do not perform landscape installation, submit government applications, or guarantee rebate approval. We provide AI-powered design concepts, planning documents, cost estimates, and preparation guidance. All estimates are for planning purposes only. The homeowner is responsible for contractor selection, application submission through{' '}
            <a href="https://utahwatersavers.com" target="_blank" rel="noopener noreferrer">utahwatersavers.com</a>
            , and project execution. Utah Water Savers rebate programs are administered by participating water conservancy districts. Eligibility and rates vary by city and provider.
          </p>
        </div>
      </div>
    </>
  )
}
