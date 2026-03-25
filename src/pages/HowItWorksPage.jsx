import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const STEPS = [
  {
    n: '1',
    title: 'Tell Us About Your Yard',
    body: 'Fill out our short intake form. We need your street address, photos of your yard, approximate square footage, current turf situation, general goals, and Utah city. The form takes about 5 minutes.',
    delivers: 'Delivers: A clear project brief we use to tailor your analysis.',
  },
  {
    n: '2',
    title: 'We Build Your Analysis',
    body: 'Our team generates your AI concept images across multiple design directions, produces your CAD-style top-down plan, and prepares your itemized cost estimate and rebate guidance. We review everything before delivery.',
    delivers: 'Delivers: Your complete report — up to 1 week from payment confirmation.',
  },
  {
    n: '3',
    title: 'Review Your Report',
    body: 'You receive a downloadable PDF with all your deliverables. Review your design concepts, study the plan, examine the cost line items, and read through your rebate eligibility guidance. Questions? Our team is available via email.',
    delivers: 'Delivers: Full clarity on what your project will look like, what it will cost, and what rebate you may pursue.',
  },
  {
    n: '4',
    title: 'Move Forward with Confidence',
    body: 'Use your plan to get accurate contractor quotes. Use your rebate guidance to understand your Utah Water Savers eligibility and prepare your application materials. Or simply use the knowledge to make a smarter decision about your project timeline.',
    delivers: 'Delivers: Real decisions — not guesswork.',
  },
]

const HOW_IT_WORKS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How ReScape Works',
  description: 'How to get a ReScape yard planning report, from intake to using your plan.',
  step: STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.body,
  })),
}

function ProcessAccordion() {
  const [open, setOpen] = useState(null)

  return (
    <div className="process-accordion">
      {STEPS.map(step => {
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
            {isOpen && (
              <div className="process-step-body">
                <p>{step.body}</p>
                <div className="hiw-step-delivers">{step.delivers}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <SEO
        title="How ReScape Works + Utah Water Savers Guide"
        description="Learn how ReScape works — from intake form to your complete report. Plus a plain-language guide to Utah Water Savers rebates, eligibility, and how to apply."
        jsonLd={HOW_IT_WORKS_SCHEMA}
      />

      <div className="page-hero">
        <div className="container--sm">
          <span className="eyebrow">The Process</span>
          <h1 className="page-hero-title">How ReScape works</h1>
          <p className="page-hero-sub">
            From your intake form to a complete planning report — here's exactly what happens, and why it matters.
          </p>
        </div>
      </div>

      <section className="section--tight">
        <div className="container--sm">
          <ProcessAccordion />
        </div>
      </section>

      {/* Utah Water Savers guide */}
      <section className="section section--dark">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">Utah Water Savers</span>
            <h2 className="section-title">Understanding the rebate program</h2>
            <p className="section-desc">
              Plain-language facts about Utah Water Savers — what it is, what it covers, and what you need to know before applying.
            </p>
          </div>

          <div className="hiw-rebate-grid">
            <div className="hiw-rebate-card">
              <h3>What is Utah Water Savers?</h3>
              <p>
                Utah Water Savers is a state-promoted water conservation initiative where participating local water providers offer financial rebates to homeowners who replace water-intensive turf with water-efficient landscaping such as drip-irrigated plants, decomposed granite, or other low-water alternatives.
              </p>
              <p>
                The program is administered at the local level — your water provider, not the state directly, determines your eligibility, rate, and any program requirements specific to your area.
              </p>
            </div>

            <div className="hiw-rebate-card">
              <h3>Rebate rates and what to expect</h3>
              <div className="hiw-fact-list">
                <div className="hiw-fact">Some providers offer up to $3 per square foot for qualifying turf replacement (statewide maximum per general Utah Water Savers guidance).</div>
                <div className="hiw-fact">CUWCD cities typically range $1.75–$2.75/sq ft. WBWCD cities are around $2.50/sq ft.</div>
                <div className="hiw-fact">CUWCD also lists a "Switch to Drip" program at approximately $1.00/sq ft in some areas.</div>
                <div className="hiw-fact">Program funding can be limited — availability may vary throughout the year.</div>
                <div className="hiw-fact">Not all providers participate in all programs. Verify directly with yours.</div>
              </div>
            </div>

            <div className="hiw-rebate-card">
              <h3>What providers typically require</h3>
              <div className="hiw-fact-list">
                <div className="hiw-fact">Before-and-after photos of the turf area being replaced.</div>
                <div className="hiw-fact">A 2D design plan showing the proposed landscaping layout.</div>
                <div className="hiw-fact">The grass must typically be living and maintained at the time of inspection.</div>
                <div className="hiw-fact">An on-site inspection before and/or after the project may be required.</div>
                <div className="hiw-fact">Applications are submitted directly by the homeowner to their water provider.</div>
              </div>
            </div>

            <div className="hiw-rebate-card">
              <h3>Why outdoor irrigation matters</h3>
              <p>
                According to general Utah water use guidance, outdoor irrigation can account for up to 70% of household water use during the irrigation season. Replacing water-intensive turf with drought-tolerant landscaping can significantly reduce that usage — and potentially lower your water bill, though exact savings depend on your irrigation practices, total yard size, and local rates.
              </p>
            </div>
          </div>

          <div className="hiw-disclaimer" style={{ marginTop: 28 }}>
            <strong>Important:</strong> ReScape is not affiliated with Utah Water Savers or any water provider program. We do not submit rebate applications on behalf of homeowners, and we do not guarantee rebate approval, rebate amounts, or program availability. Always verify program details, requirements, and current rates directly with your water provider before making financial decisions or beginning your project.
          </div>
        </div>
      </section>

      {/* Why planning matters */}
      <section className="section">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">Why It Matters</span>
            <h2 className="section-title">Why plan before you hire?</h2>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            {[
              { icon: '💰', title: 'Know your real cost range', body: 'Most homeowners are surprised by landscaping project costs. Getting an itemized estimate before you hire a contractor means you negotiate from knowledge, not guesses.' },
              { icon: '📋', title: 'Have a plan providers trust', body: "Many Utah Water Savers providers require a 2D design plan as part of the application. Having a professional-quality plan ready can streamline your application and demonstrate you've done your homework." },
              { icon: '🎯', title: 'Choose the right design', body: 'Reviewing AI-generated concepts lets you develop a clear visual preference before spending money with a landscaper. You walk into quotes knowing what you want.' },
              { icon: '⏱️', title: 'Save time on contractor conversations', body: 'Sharing a top-down plan and cost estimate with multiple contractors makes it far easier to get comparable quotes — and to spot outliers.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 16, padding: '20px 22px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden="true">{item.icon}</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Start your analysis today.</h2>
          <p className="final-cta-sub">Know your costs, explore your designs, and understand your rebate potential — before you hire anyone.</p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Get Started</Link>
            <Link to="/calculator" className="btn btn--ghost btn--lg">Try the Calculator</Link>
          </div>
        </div>
      </div>
    </>
  )
}
