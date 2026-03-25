import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const EXAMPLES = [
  {
    label: 'Example Report A',
    desc: 'Example: 1,600 sq ft front yard, Salt Lake County (fictional)',
    sqft: 1600,
    package: 'Utah Water Savers Prep',
    costs: [
      { item: 'Decomposed Granite (800 sq ft)', range: '$1,600–$3,200' },
      { item: 'Native Plants & Shrubs',         range: '$800–$1,600' },
      { item: 'Drip Irrigation System',         range: '$900–$1,600' },
      { item: 'Labor & Installation (est.)',    range: '$1,800–$3,200' },
      { item: 'Total Estimated Range',          range: '$5,100–$9,600' },
    ],
    rebate: { rate: 2.00, amount: 3200, note: '1,600 sq ft × $2.00/sq ft — example only' },
  },
  {
    label: 'Example Report B',
    desc: 'Example: 2,200 sq ft backyard, Utah County (fictional)',
    sqft: 2200,
    package: 'Plan + Estimate',
    costs: [
      { item: 'Decomposed Granite & Boulders',   range: '$1,400–$2,800' },
      { item: 'Native Plants & Groundcover',     range: '$1,200–$2,400' },
      { item: 'Drip Irrigation & Upgrade',       range: '$1,200–$2,200' },
      { item: 'Labor & Installation (est.)',     range: '$2,400–$4,400' },
      { item: 'Total Estimated Range',           range: '$6,200–$11,800' },
    ],
    rebate: { rate: 3.00, amount: 6600, note: '2,200 sq ft × $3.00/sq ft — example only' },
  },
  {
    label: 'Example Report C',
    desc: 'Example: 900 sq ft side yard, Davis County (fictional)',
    sqft: 900,
    package: 'Visual Concept',
    costs: [
      { item: 'Desert-Modern Landscaping',     range: '$1,200–$2,800' },
      { item: 'Pathway & Edging',              range: '$400–$900' },
      { item: 'Drip Irrigation',               range: '$600–$1,000' },
      { item: 'Labor & Installation (est.)',   range: '$900–$1,800' },
      { item: 'Total Estimated Range',         range: '$3,100–$6,500' },
    ],
    rebate: { rate: 2.00, amount: 1800, note: '900 sq ft × $2.00/sq ft — example only' },
  },
]

function ExampleReport({ ex }) {
  return (
    <div className="example-report">
      <div className="example-report-header">
        <div>
          <div className="example-report-meta">{ex.label} — {ex.package}</div>
          <div className="example-report-detail">{ex.desc} · {ex.sqft.toLocaleString()} sq ft</div>
        </div>
        <span className="example-report-sample-badge">SAMPLE — Not a real report</span>
      </div>

      <div className="example-report-body">
        <div>
          <div className="example-concepts-label">Design Concepts (sample placeholders)</div>
          <div className="example-concept-thumbs">
            <div className="example-concept-thumb">Concept 1</div>
            <div className="example-concept-thumb">Concept 2</div>
            <div className="example-concept-thumb">Concept 3</div>
            <div className="example-concept-thumb">Concept 4</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="example-plan-label">Top-Down Plan (sample)</div>
            <div className="example-plan-mock">CAD-Style Blueprint Plan</div>
          </div>
        </div>

        <div>
          <div className="example-costs-label">Estimated Cost Breakdown</div>
          <table className="example-cost-table">
            <tbody>
              {ex.costs.map((row, i) => (
                <tr key={i}>
                  <td>{row.item}</td>
                  <td>{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="example-rebate-box">
            <div>
              <div className="example-rebate-label">Est. Rebate (example @ ${ex.rebate.rate}/sq ft)</div>
              <div className="example-rebate-note">{ex.rebate.note}</div>
            </div>
            <div className="example-rebate-value">Up to ${ex.rebate.amount.toLocaleString()}</div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 12, lineHeight: 1.6, fontStyle: 'italic' }}>
            All cost ranges are rough planning estimates. Actual costs depend on contractor, materials, and site conditions. Rebate estimates depend on your provider's program availability and eligibility. Not a guarantee.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ExamplesPage() {
  return (
    <>
      <SEO
        title="Sample Yard Analysis Reports"
        description="See what a ReScapeUtah report looks like — AI-powered concept images, CAD-style top-down plans, itemized cost estimates, and Utah Water Savers rebate guidance. Sample reports for illustration only."
      />

      <div className="page-hero">
        <div className="container">
          <span className="eyebrow">Examples</span>
          <h1 className="page-hero-title">See what's inside a report</h1>
          <p className="page-hero-sub">
            Sample reports below show the structure and depth of a real ReScapeUtah analysis. All properties, names, addresses, and figures are fictional examples for illustration only.
          </p>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <div style={{ padding: '14px 18px', background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 'var(--r)', marginBottom: 36, fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--orange)' }}>Sample reports only.</strong>{' '}
            All properties, figures, names, and addresses below are fictional and for illustration purposes only. They do not represent real customers, real projects, or actual guaranteed outcomes.
          </div>

          <div className="examples-grid">
            {EXAMPLES.map((ex, i) => <ExampleReport key={i} ex={ex} />)}
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Ready to see YOUR numbers?</h2>
          <p className="final-cta-sub">
            Get a real analysis with your yard's actual square footage, your water provider, and your project goals.
          </p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Get a Real Analysis</Link>
            <Link to="/pricing" className="btn btn--ghost btn--lg">See Pricing</Link>
          </div>
        </div>
      </div>
    </>
  )
}
