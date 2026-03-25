import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalculatorWidget from '../components/CalculatorWidget'

const CALC_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Utah Water Savers Rebate Calculator',
  applicationCategory: 'UtilityApplication',
  description: 'Estimate your potential Utah Water Savers rebate based on square footage and Utah city / water district.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function CalculatorPage() {
  return (
    <>
      <SEO
        title="Utah Water Savers Rebate Calculator"
        description="Estimate your Utah Water Savers rebate with our free calculator. Select your Utah city and square footage to see how much you could potentially save. Planning estimates only."
        jsonLd={CALC_SCHEMA}
      />

      <div style={{ paddingTop: 'calc(var(--nav-h) + 64px)', paddingBottom: 48 }}>
        <div className="container--sm">
          <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>Free Tool</span>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 14 }}>
            Utah Water Savers Rebate &amp; Yard Planning Calculator
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-sec)', lineHeight: 1.75, maxWidth: 600 }}>
            Select your Utah city and yard size to see your potential rebate and water savings estimate. All outputs are <strong style={{ color: 'var(--text)' }}>planning estimates only</strong> — actual amounts depend on your provider's current program rules and funding availability.
          </p>
        </div>
      </div>

      <section className="section--tight">
        <div className="container--sm">
          <CalculatorWidget />
        </div>
      </section>

      {/* Background info */}
      <section className="calc-info-section section--dark">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">Background</span>
            <h2 className="section-title">How Utah Water Savers rebates work</h2>
            <p className="section-desc">What to know before you apply — and how a yard analysis can help.</p>
          </div>

          <div className="calc-info-grid">
            <div className="calc-info-card">
              <h3>What is Utah Water Savers?</h3>
              <p>
                Utah Water Savers is a state-promoted conservation initiative where participating water providers offer rebates to homeowners who replace water-intensive grass with water-efficient landscaping. The program is administered locally — rates and rules vary by provider, not statewide.
              </p>
            </div>
            <div className="calc-info-card">
              <h3>Rates vary by provider</h3>
              <p>
                JVWCD cities can see up to $3.00/sq ft. CUWCD cities typically range $1.75–$2.75/sq ft. WBWCD cities are around $2.50/sq ft. Eligibility and funding availability can change — always verify directly with your water provider.
              </p>
            </div>
            <div className="calc-info-card">
              <h3>What providers typically require</h3>
              <p>
                Many providers require before-and-after photos, a 2D design plan, and an on-site inspection. Some programs require the grass to be living and maintained at the time of application. A detailed plan — like one from ReScapeUtah — is often part of a complete application.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link to="/rebate-info" style={{ color: 'var(--teal)', fontSize: 14, fontWeight: 600 }}>
              Full Utah rebate info by district →
            </Link>
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Turn your estimate into a real plan.</h2>
          <p className="final-cta-sub">
            Get a complete yard analysis with AI concepts, a CAD-style plan, and a personalized rebate estimate based on your actual yard and provider.
          </p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Get Your Yard Analysis</Link>
            <Link to="/pricing" className="btn btn--ghost btn--lg">See Pricing</Link>
          </div>
        </div>
      </div>
    </>
  )
}
