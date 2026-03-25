import { useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'

const PACKAGES = [
  { id: 'visual-concept',    label: 'Visual Concept',         price: '$49.99'  },
  { id: 'plan-estimate',     label: 'Plan + Estimate',        price: '$149.99' },
  { id: 'water-savers-prep', label: 'Utah Water Savers Prep', price: '$299.99' },
  { id: 'white-glove',       label: 'White Glove',            price: '$499.99' },
  { id: 'out-of-state',      label: 'Out-of-State Design',    price: '$299.99' },
]

const UTAH_CITIES = [
  'Salt Lake City', 'West Jordan', 'South Jordan', 'Murray', 'Midvale',
  'Draper', 'Riverton', 'Herriman', 'Bluffdale', 'West Valley City',
  'Taylorsville', 'Cottonwood Heights',
  'Provo', 'Orem', 'Springville', 'Spanish Fork', 'Lehi', 'American Fork',
  'Pleasant Grove', 'Vineyard',
  'Ogden', 'Layton', 'Clearfield', 'Roy', 'Kaysville', 'Syracuse',
  'Clinton', 'Bountiful', 'North Salt Lake',
  'Other / Not listed',
]

const HOW_HEARD = [
  'Google / Search',
  'Friend or family',
  'Social media',
  'Utah Water Savers / Water provider',
  'Other',
]

const GRASS_COVERAGE = [
  'Mostly grass (75%+)',
  'Partial grass (25–75%)',
  'Some grass (under 25%)',
  'Not sure',
]

const TERRAIN = [
  'Flat',
  'Slight slope',
  'Steep slope',
  'Mixed / not sure',
]

const WS_PACKAGES = new Set(['water-savers-prep', 'white-glove'])

function validate(fields) {
  const errs = {}
  if (!fields.name.trim())    errs.name    = 'Name is required.'
  if (!fields.email.trim())   errs.email   = 'Email is required.'
  else if (!/\S+@\S+\.\S+/.test(fields.email)) errs.email = 'Enter a valid email address.'
  if (!fields.address.trim()) errs.address = 'Street address is required.'
  if (!fields.package)        errs.package = 'Please select a package.'
  if (fields.photos.length === 0) errs.photos = 'Please upload at least one photo of your yard.'
  if (!fields.agreedToTerms)  errs.agreedToTerms = 'You must agree to the Terms of Service to continue.'
  return errs
}

export default function ContactPage() {
  const [params] = useSearchParams()
  const defaultPkg = params.get('package') || ''
  const photoInputRef = useRef(null)

  const [fields, setFields] = useState({
    name:          '',
    email:         '',
    phone:         '',
    address:       '',
    city:          '',
    package:       PACKAGES.find(p => p.id === defaultPkg)?.id || '',
    grassCoverage: '',
    terrain:       '',
    sqft:          '',
    goals:         '',
    photos:        [],
    howHeard:      '',
    agreedToTerms: false,
  })

  const [errors,    setErrors]    = useState({})
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key, val) => {
    setFields(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const showCityDropdown = WS_PACKAGES.has(fields.package)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    // TODO: wire to Formspree / Netlify Forms / backend endpoint
    console.log('ReScapeUtah intake submission:', fields)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <>
        <SEO title="Request Received" />
        <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', paddingBottom: 96, minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ maxWidth: 520 }}>
            <div className="contact-form-card">
              <div className="form-success">
                <span className="form-success-icon">✅</span>
                <h1 className="form-success-title">Request received!</h1>
                <p className="form-success-msg">
                  Thanks, <strong>{fields.name.split(' ')[0]}</strong>. We'll review your intake and be in touch with next steps and payment info. Turnaround is up to 1 week from payment confirmation.
                </p>
                <Link to="/" className="btn btn--orange btn--lg" style={{ marginTop: 8 }}>Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Start Your Yard Analysis"
        description="Fill out the short intake form to get your personalized ReScapeUtah yard analysis — AI yard concepts, CAD-style plan, cost estimate, and Utah Water Savers rebate guidance."
      />

      <div style={{ paddingTop: 'calc(var(--nav-h) + 64px)', paddingBottom: 96 }}>
        <div className="container">
          <div className="contact-layout">

            {/* Info side */}
            <div className="contact-info">
              <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>Get Started</span>
              <h1>Start Your Yard Analysis</h1>
              <p>
                Tell us about your yard. We'll build your personalized report — AI concept images, a CAD-style plan, cost estimates, and Utah Water Savers rebate guidance.
              </p>

              <div className="contact-trust-items">
                {[
                  { icon: '⚡', text: 'Turnaround: up to 1 week from payment confirmation.' },
                  { icon: '📥', text: 'Delivered as a downloadable PDF — shareable with landscapers and water providers.' },
                  { icon: '🔒', text: 'Your information is never sold or shared. See our Privacy Policy.' },
                  { icon: '💬', text: "Questions before ordering? Email us — we're happy to help." },
                  { icon: '📋', text: 'All sales are final. Contact us with any concerns — we want every report to be accurate and useful.' },
                ].map((item, i) => (
                  <div key={i} className="contact-trust-item">
                    <span className="contact-trust-icon" aria-hidden="true">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 32, padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--text-sec)', display: 'block', marginBottom: 4 }}>Planning estimates only.</strong>
                All cost and rebate figures in your report are planning estimates. Actual costs, rebate eligibility, and outcomes vary. See our{' '}
                <Link to="/disclaimer" style={{ color: 'var(--text-sec)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Disclaimer</Link> for full details.
              </div>
            </div>

            {/* Form */}
            <div>
              <div className="contact-form-card">
                <form onSubmit={handleSubmit} noValidate>

                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full name <span className="form-req">*</span></label>
                    <input id="name" type="text" className={`form-input${errors.name ? ' form-input--error' : ''}`} placeholder="Jane Smith" value={fields.name} onChange={e => set('name', e.target.value)} aria-required="true" />
                    {errors.name && <span className="form-error" role="alert">{errors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email address <span className="form-req">*</span></label>
                    <input id="email" type="email" className={`form-input${errors.email ? ' form-input--error' : ''}`} placeholder="jane@example.com" value={fields.email} onChange={e => set('email', e.target.value)} aria-required="true" />
                    {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone <span className="form-opt">(optional)</span></label>
                    <input id="phone" type="tel" className="form-input" placeholder="(801) 555-0000" value={fields.phone} onChange={e => set('phone', e.target.value)} />
                  </div>

                  {/* Street address */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="address">Street address <span className="form-req">*</span></label>
                    <input id="address" type="text" className={`form-input${errors.address ? ' form-input--error' : ''}`} placeholder="123 Main St, Salt Lake City, UT" value={fields.address} onChange={e => set('address', e.target.value)} aria-required="true" />
                    {errors.address && <span className="form-error" role="alert">{errors.address}</span>}
                    <span className="form-hint">Used to understand your water district and yard context. Not shared.</span>
                  </div>

                  {/* Photo upload */}
                  <div className="form-group">
                    <label className="form-label">Yard photos <span className="form-req">*</span></label>
                    <div className="form-upload-area" onClick={() => photoInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && photoInputRef.current?.click()}>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => {
                          const files = Array.from(e.target.files || [])
                          set('photos', files)
                        }}
                      />
                      <div className="form-upload-icon" aria-hidden="true">📷</div>
                      {fields.photos.length === 0
                        ? <><div className="form-upload-primary">Click to upload yard photos</div><div className="form-upload-secondary">JPG, PNG, HEIC — upload multiple angles</div></>
                        : <div className="form-upload-primary">{fields.photos.length} photo{fields.photos.length !== 1 ? 's' : ''} selected ✓</div>
                      }
                    </div>
                    {errors.photos && <span className="form-error" role="alert">{errors.photos}</span>}
                    <span className="form-hint">Include front, sides, and any areas you want redesigned. At least 1 required.</span>
                  </div>

                  {/* Grass coverage */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="grass-coverage">Current grass coverage <span className="form-opt">(optional)</span></label>
                    <select id="grass-coverage" className="form-select" value={fields.grassCoverage} onChange={e => set('grassCoverage', e.target.value)}>
                      <option value="">Select coverage</option>
                      {GRASS_COVERAGE.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Terrain */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="terrain">Terrain / slope <span className="form-opt">(optional)</span></label>
                    <select id="terrain" className="form-select" value={fields.terrain} onChange={e => set('terrain', e.target.value)}>
                      <option value="">Select terrain</option>
                      {TERRAIN.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Square footage */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="sqft">Approximate grass area to replace (sq ft) <span className="form-opt">(optional)</span></label>
                    <input id="sqft" type="number" min={0} className="form-input" placeholder="e.g. 1200" value={fields.sqft} onChange={e => set('sqft', e.target.value)} />
                  </div>

                  {/* Goals textarea with character limit */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="goals">
                      Describe your goals <span className="form-opt">(optional)</span>
                    </label>
                    <textarea
                      id="goals"
                      className="form-textarea"
                      placeholder="e.g. Replace front lawn with drought-tolerant landscaping, want to apply for Water Savers rebate, prefer a desert-modern look..."
                      maxLength={500}
                      value={fields.goals}
                      onChange={e => set('goals', e.target.value)}
                    />
                    <div className="form-char-count">{fields.goals.length}/500</div>
                  </div>

                  {/* Package */}
                  <div className="form-group">
                    <label className="form-label" id="package-label">Select your package <span className="form-req">*</span></label>
                    <div className="form-radio-grid" role="radiogroup" aria-labelledby="package-label">
                      {PACKAGES.map(pkg => (
                        <label key={pkg.id} className={`form-radio-card${fields.package === pkg.id ? ' form-radio-card--selected' : ''}`}>
                          <input
                            type="radio"
                            name="package"
                            value={pkg.id}
                            checked={fields.package === pkg.id}
                            onChange={() => set('package', pkg.id)}
                          />
                          <span className="form-radio-label">{pkg.label}</span>
                          <span className="form-radio-price">{pkg.price}</span>
                        </label>
                      ))}
                    </div>
                    {errors.package && <span className="form-error" role="alert">{errors.package}</span>}
                  </div>

                  {/* Conditional: Utah city for WS Prep / White Glove */}
                  {showCityDropdown && (
                    <div className="form-group form-conditional">
                      <label className="form-label" htmlFor="city-select">
                        Your Utah city <span className="form-opt">(helps us tailor your rebate guidance)</span>
                      </label>
                      <select id="city-select" className="form-select" value={fields.city} onChange={e => set('city', e.target.value)}>
                        <option value="">Select city</option>
                        {UTAH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  {/* How heard */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="howHeard">How did you hear about us? <span className="form-opt">(optional)</span></label>
                    <select id="howHeard" className="form-select" value={fields.howHeard} onChange={e => set('howHeard', e.target.value)}>
                      <option value="">Select (optional)</option>
                      {HOW_HEARD.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Terms agreement */}
                  <div className="form-group">
                    <label className="form-checkbox-row">
                      <input
                        type="checkbox"
                        checked={fields.agreedToTerms}
                        onChange={e => set('agreedToTerms', e.target.checked)}
                        aria-required="true"
                      />
                      <span>
                        I have read and agree to the{' '}
                        <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Terms of Service</Link>.
                        I understand that <strong>all sales are final</strong> — no refunds.
                      </span>
                    </label>
                    {errors.agreedToTerms && <span className="form-error" role="alert">{errors.agreedToTerms}</span>}
                  </div>

                  <div className="form-submit-section">
                    <button
                      type="submit"
                      className="btn btn--orange btn--full btn--lg"
                      disabled={loading}
                      aria-busy={loading}
                    >
                      {loading ? 'Submitting…' : 'Submit My Intake'}
                    </button>
                    <p className="form-privacy-note">
                      Your information is never sold or shared.{' '}
                      <Link to="/privacy">Privacy Policy</Link> ·{' '}
                      <Link to="/terms">Terms</Link>
                    </p>
                  </div>

                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
