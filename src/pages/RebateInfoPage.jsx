import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'

const DISTRICTS = [
  {
    id: 'jvwcd',
    name: 'Jordan Valley Water Conservancy District',
    abbr: 'JVWCD',
    rate: 'Up to $3.00/sq ft',
    rateNum: 3.00,
    cities: ['Salt Lake City', 'West Jordan', 'South Jordan', 'Murray', 'Midvale', 'Draper', 'Riverton', 'Herriman', 'Bluffdale', 'West Valley City', 'Taylorsville', 'Cottonwood Heights'],
    notes: 'One of the higher-rate programs in Utah. Rates and availability confirmed via publicly available program information.',
  },
  {
    id: 'cuwcd',
    name: 'Central Utah Water Conservancy District',
    abbr: 'CUWCD',
    rate: '~$1.75–$2.75/sq ft',
    rateNum: 2.25,
    cities: ['Provo', 'Orem', 'Springville', 'Spanish Fork', 'Lehi', 'American Fork', 'Pleasant Grove', 'Vineyard'],
    notes: 'Rate range varies by subprogram and year. CUWCD also lists a Switch to Drip program at approximately $1.00/sq ft for qualifying drip irrigation upgrades.',
  },
  {
    id: 'wbwcd',
    name: 'Weber Basin Water Conservancy District',
    abbr: 'WBWCD',
    rate: '~$2.50/sq ft',
    rateNum: 2.50,
    cities: ['Ogden', 'Layton', 'Clearfield', 'Roy', 'Kaysville', 'Syracuse', 'Clinton', 'Bountiful', 'North Salt Lake'],
    notes: 'Rate based on publicly available program information. Verify current rate and availability directly with your provider.',
  },
  {
    id: 'other',
    name: 'Other / Not Listed',
    abbr: 'Other',
    rate: 'Varies',
    rateNum: null,
    cities: ['Washington County', 'Cache Valley', 'Other Utah areas'],
    notes: 'Many Utah water providers participate in water conservation programs. If your city is not listed, contact your water provider directly to ask about grass replacement rebate programs.',
  },
]

const REQUIREMENTS_FAQ = [
  {
    q: 'Before-and-after photos',
    a: 'Most providers require photos of the existing grass before you begin, and photos of the completed project. Document the entire area being replaced. Take photos from multiple angles.',
  },
  {
    q: 'A 2D design plan',
    a: 'Many providers require a design plan showing what will replace the grass. A top-down layout showing plant placement, hardscape, and irrigation zones is typically what is needed. ReScapeUtah provides this as part of the Plan + Estimate, Utah Water Savers Prep, and White Glove packages.',
  },
  {
    q: 'Living grass at the time of application',
    a: 'Some programs require that the grass you are replacing is living and maintained — not already dead or dormant — at the time of your initial application or inspection. Check with your provider.',
  },
  {
    q: 'Pre-project inspection',
    a: "Many providers require an on-site inspection before you begin the project. You typically cannot receive a rebate for work that was already completed before the inspection. Contact your provider early in the process — don't start the project without understanding their requirements.",
  },
  {
    q: 'Water-efficient replacement landscaping',
    a: 'Turf must typically be replaced with qualifying water-efficient alternatives: drip-irrigated plants, decomposed granite, permeable hardscape, or similar. Artificial turf requirements vary by provider.',
  },
  {
    q: 'Minimum square footage',
    a: 'Some providers set a minimum square footage for qualifying projects. This varies by program. Verify with your provider.',
  },
]

// City lookup
const CITY_LOOKUP = {}
DISTRICTS.forEach(d => {
  d.cities.forEach(c => {
    CITY_LOOKUP[c] = d
  })
})
const ALL_CITIES = Object.keys(CITY_LOOKUP).sort()

export default function RebateInfoPage() {
  const [lookupCity, setLookupCity] = useState('')
  const lookupResult = lookupCity ? CITY_LOOKUP[lookupCity] : null

  return (
    <>
      <SEO
        title="Utah Water Savers Rebate Info"
        description="Everything Utah homeowners need to know about Utah Water Savers grass replacement rebates — rates by water district, eligibility requirements, and how to prepare your application."
      />

      <div className="page-hero">
        <div className="container--sm">
          <span className="eyebrow">Utah Water Savers</span>
          <h1 className="page-hero-title">Utah Water Savers rebate guide</h1>
          <p className="page-hero-sub">
            Rates by water district, what providers typically require, and how to prepare a strong application. All figures are planning estimates — verify directly with your provider.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="container--sm" style={{ paddingTop: 32 }}>
        <div style={{ padding: '14px 18px', background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.18)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--orange)' }}>ReScapeUtah is not affiliated with Utah Water Savers</strong> or any water provider. All rates and program information below are based on publicly available program information and are provided for planning purposes only. Rates, availability, and requirements can change. Always verify current program details directly with your water provider before starting your project or making financial decisions.
        </div>
      </div>

      {/* Rates by district */}
      <section className="section--tight">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">By Water District</span>
            <h2 className="section-title">Estimated rebate rates by district</h2>
          </div>

          <div className="rebate-districts">
            {DISTRICTS.map(d => (
              <div key={d.id} className="rebate-district-card">
                <div className="rebate-district-header">
                  <div className="rebate-district-abbr">{d.abbr}</div>
                  <div className="rebate-district-name">{d.name}</div>
                  <div className="rebate-district-rate">{d.rate}</div>
                </div>
                <div className="rebate-district-cities">
                  {d.cities.join(' · ')}
                </div>
                <div className="rebate-district-notes">{d.notes}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City lookup */}
      <section className="section section--dark">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">City Lookup</span>
            <h2 className="section-title">Find your estimated rate by city</h2>
          </div>

          <div className="rebate-lookup">
            <label className="form-label" htmlFor="city-lookup">Select your Utah city</label>
            <select
              id="city-lookup"
              className="form-select"
              value={lookupCity}
              onChange={e => setLookupCity(e.target.value)}
              style={{ maxWidth: 340 }}
            >
              <option value="">— Select a city —</option>
              {ALL_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {lookupResult && (
              <div className="rebate-lookup-result">
                <div className="rebate-lookup-city">{lookupCity}</div>
                <div className="rebate-lookup-district">{lookupResult.name} ({lookupResult.abbr})</div>
                <div className="rebate-lookup-rate">{lookupResult.rate}</div>
                <div className="rebate-lookup-note">{lookupResult.notes}</div>
                <Link
                  to={`/contact?package=water-savers-prep`}
                  className="btn btn--orange"
                  style={{ marginTop: 16, display: 'inline-block' }}
                >
                  Get Water Savers Prep for {lookupCity}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Full rates table */}
      <section className="section">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">Reference Table</span>
            <h2 className="section-title">Rates at a glance</h2>
          </div>

          <div className="comparison-table-wrap">
            <table className="comparison-table rebate-rates-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Est. Rate</th>
                  <th>Coverage Area</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>JVWCD</strong></td>
                  <td><strong style={{ color: 'var(--green)' }}>Up to $3.00/sq ft</strong></td>
                  <td>Salt Lake metro</td>
                  <td>Turf replacement rebate</td>
                </tr>
                <tr>
                  <td><strong>WBWCD</strong></td>
                  <td>~$2.50/sq ft</td>
                  <td>Ogden/Davis area</td>
                  <td>Turf replacement rebate</td>
                </tr>
                <tr>
                  <td><strong>CUWCD</strong></td>
                  <td>~$1.75–$2.75/sq ft</td>
                  <td>Utah County</td>
                  <td>Multiple program tiers</td>
                </tr>
                <tr>
                  <td><strong>CUWCD</strong></td>
                  <td>~$1.00/sq ft</td>
                  <td>Utah County</td>
                  <td>Switch to Drip program</td>
                </tr>
                <tr>
                  <td><strong>Other providers</strong></td>
                  <td>Varies</td>
                  <td>Rest of Utah</td>
                  <td>Contact your provider directly</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 12, lineHeight: 1.6 }}>
            All rates are planning estimates based on publicly available information. Rates, availability, and program rules change. Verify current rates with your specific water provider before making any financial decisions or beginning your project.
          </p>
        </div>
      </section>

      {/* Requirements accordion */}
      <section className="section section--dark">
        <div className="container--sm">
          <div className="section-header">
            <span className="eyebrow">What You'll Need</span>
            <h2 className="section-title">Typical application requirements</h2>
            <p className="section-desc">
              Requirements vary by provider. These are the common items most programs ask for.
            </p>
          </div>

          <FAQAccordion items={REQUIREMENTS_FAQ} />

          <div className="hiw-disclaimer" style={{ marginTop: 28 }}>
            <strong>Always verify:</strong> Program requirements can differ significantly between water providers. Contact your specific provider before starting any project. Do not rely solely on general information — confirm requirements directly with your provider's conservation or rebate program team.
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Ready to prepare your application?</h2>
          <p className="final-cta-sub">
            Our Utah Water Savers Prep package includes a tailored plan, rebate guidance, and document preparation assistance.
          </p>
          <div className="final-cta-actions">
            <Link to="/contact?package=water-savers-prep" className="btn btn--orange btn--lg">Get Water Savers Prep</Link>
            <Link to="/calculator" className="btn btn--ghost btn--lg">Estimate My Rebate</Link>
          </div>
          <p className="final-cta-note">
            We do not guarantee rebate approval or amounts. Planning estimates only.
          </p>
        </div>
      </div>
    </>
  )
}
