import { useState, useRef, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'

// TODO: Connect form submission to backend (email notification, CRM, or database).
// CAPTCHA token should be verified server-side before processing the submission.
// Replace RECAPTCHA_SITE_KEY with your actual Google reCAPTCHA v3 site key.
const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_V3_SITE_KEY'

const PACKAGES = [
  { id: 'visual-concept',    label: 'Visual Concept',         price: '$49.99',  note: 'Up to 10 AI concepts + PDF' },
  { id: 'plan-estimate',     label: 'Plan + Estimate',        price: '$149.99', note: 'Up to 10 concepts + design-focused blueprint + cost estimate' },
  { id: 'water-savers-prep', label: 'Utah Water Savers Prep', price: '$299.99', note: 'Up to 20 concepts + compliance-aligned blueprint + rebate guidance — Utah only' },
  { id: 'white-glove',       label: 'White Glove',            price: '$499.99', note: 'Up to 30 concepts + full support + HOA included — Utah only' },
]

const UTAH_CITIES = [
  'Salt Lake City', 'West Jordan', 'South Jordan', 'Murray', 'Midvale',
  'Draper', 'Riverton', 'Herriman', 'Bluffdale', 'West Valley City',
  'Taylorsville', 'Cottonwood Heights', 'Holladay', 'Sandy', 'Magna', 'Kearns',
  'Provo', 'Orem', 'Springville', 'Spanish Fork', 'Lehi', 'American Fork',
  'Pleasant Grove', 'Vineyard', 'Saratoga Springs', 'Eagle Mountain',
  'Cedar Hills', 'Highland', 'Alpine', 'Lindon', 'Payson',
  'Ogden', 'Layton', 'Clearfield', 'Roy', 'Kaysville', 'Syracuse',
  'Clinton', 'Bountiful', 'North Salt Lake', 'Woods Cross', 'Centerville', 'Farmington',
  'Other / Not listed',
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
  if (!fields.email.trim())   errs.email   = 'Email address is required.'
  else if (!/\S+@\S+\.\S+/.test(fields.email)) errs.email = 'Enter a valid email address.'
  if (!fields.address.trim()) errs.address = 'Street address is required.'
  if (!fields.package)        errs.package = 'Please select a package.'
  if (!fields.sqft || isNaN(Number(fields.sqft)) || Number(fields.sqft) <= 0)
    errs.sqft = 'Please enter the approximate grass area to replace.'
  if (!fields.terrain)        errs.terrain = 'Please select a terrain type.'
  if (fields.photos.length === 0) errs.photos = 'Please upload at least one photo of your yard.'
  if (!fields.agreedToTerms)  errs.agreedToTerms = 'You must agree to the Terms of Service, Privacy Policy, and Disclaimer to continue.'
  if (!fields.agreedToContact) errs.agreedToContact = 'You must consent to email contact to continue.'
  return errs
}

export default function ContactPage() {
  const [params] = useSearchParams()
  const defaultPkg = params.get('package') || ''
  const photoInputRef  = useRef(null)
  const hoaFilesRef    = useRef(null)
  const captchaLoaded  = useRef(false)

  const [fields, setFields] = useState({
    email:         '',
    address:       '',
    package:       PACKAGES.find(p => p.id === defaultPkg)?.id || '',
    sqft:          '',
    terrain:       '',
    goals:         '',
    photos:        [],
    hoaChecked:      false,
    hoaFiles:        [],
    city:            '',
    agreedToTerms:   false,
    agreedToContact: false,
  })

  const [errors,    setErrors]    = useState({})
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key, val) => {
    setFields(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const showCityDropdown = WS_PACKAGES.has(fields.package)

  // Load reCAPTCHA v3 script on mount
  useEffect(() => {
    if (captchaLoaded.current || RECAPTCHA_SITE_KEY === 'YOUR_RECAPTCHA_V3_SITE_KEY') return
    captchaLoaded.current = true
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    document.head.appendChild(script)
  }, [])

  const getCaptchaToken = () => {
    if (RECAPTCHA_SITE_KEY === 'YOUR_RECAPTCHA_V3_SITE_KEY') {
      // CAPTCHA not configured — return mock token for development
      return Promise.resolve('CAPTCHA_NOT_CONFIGURED')
    }
    return new Promise((resolve, reject) => {
      if (typeof window.grecaptcha === 'undefined') {
        resolve('CAPTCHA_UNAVAILABLE')
        return
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit_intake' })
          .then(resolve)
          .catch(reject)
      })
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      // Get CAPTCHA token — must be verified server-side before processing
      const captchaToken = await getCaptchaToken()
      // TODO: Send form data + captchaToken to your backend endpoint
      // Example: await fetch('/api/intake', { method: 'POST', body: JSON.stringify({ ...fields, captchaToken }) })
      console.log('ReScapeUtah intake submission:', { ...fields, captchaToken })
      await new Promise(r => setTimeout(r, 900))
      setSubmitted(true)
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setLoading(false)
    }
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
                  We'll review your intake and follow up by email with next steps and payment information. Turnaround is up to 1 week from payment confirmation.
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
                  { icon: '💳', text: "We collect information only — we'll follow up by email to confirm your package and arrange payment." },
                  { icon: '📥', text: 'Delivered as a downloadable PDF — shareable with landscapers and water providers.' },
                  { icon: '🔒', text: 'Your information is never sold or shared. See our Privacy Policy.' },
                  { icon: '💬', text: "Questions before ordering? Email us — we're happy to help." },
                  { icon: '📋', text: 'We stand behind our reports — contact us if anything is missing or inaccurate and we will work to address it.' },
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

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email address <span className="form-req">*</span></label>
                    <input
                      id="email" type="email"
                      className={`form-input${errors.email ? ' form-input--error' : ''}`}
                      placeholder="you@example.com"
                      value={fields.email}
                      onChange={e => set('email', e.target.value)}
                      aria-required="true"
                    />
                    {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
                    <span className="form-hint">We'll use this to send your report and follow-up payment info.</span>
                  </div>

                  {/* Street address */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="address">Property street address <span className="form-req">*</span></label>
                    <input
                      id="address" type="text"
                      className={`form-input${errors.address ? ' form-input--error' : ''}`}
                      placeholder="123 Main St, Salt Lake City, UT"
                      value={fields.address}
                      onChange={e => set('address', e.target.value)}
                      aria-required="true"
                    />
                    {errors.address && <span className="form-error" role="alert">{errors.address}</span>}
                    <span className="form-hint">Used to understand your water district and yard context. Not shared.</span>
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
                          <div style={{ flex: 1 }}>
                            <span className="form-radio-label">{pkg.label}</span>
                            {pkg.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{pkg.note}</div>}
                          </div>
                          <span className="form-radio-price">{pkg.price}</span>
                        </label>
                      ))}
                    </div>
                    {errors.package && <span className="form-error" role="alert">{errors.package}</span>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                      Note: Plan + Estimate produces a design-focused blueprint (not compliance-verified). Utah Water Savers Prep produces a compliance-aligned blueprint designed for rebate applications.{' '}
                      <Link to="/pricing" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>See full comparison →</Link>
                    </div>
                  </div>

                  {/* Conditional: Utah city for WS Prep / White Glove */}
                  {showCityDropdown && (
                    <div className="form-group" style={{ padding: '14px', background: 'rgba(32,217,192,.04)', border: '1px solid rgba(32,217,192,.15)', borderRadius: 'var(--r)' }}>
                      <label className="form-label" htmlFor="city-select">
                        Your Utah city <span className="form-opt">(required for rebate guidance)</span>
                      </label>
                      <select
                        id="city-select" className="form-select"
                        value={fields.city}
                        onChange={e => set('city', e.target.value)}
                      >
                        <option value="">Select city</option>
                        {UTAH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span className="form-hint">
                        Utah Water Savers Prep is available for Utah properties only. Your city helps us match your water district's rebate rates.
                      </span>
                    </div>
                  )}

                  {/* Sqft */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="sqft">
                      Approximate grass area to replace (sq ft) <span className="form-req">*</span>
                    </label>
                    <input
                      id="sqft" type="number" min={0}
                      className={`form-input${errors.sqft ? ' form-input--error' : ''}`}
                      placeholder="e.g. 1200"
                      value={fields.sqft}
                      onChange={e => set('sqft', e.target.value)}
                      aria-required="true"
                    />
                    {errors.sqft && <span className="form-error" role="alert">{errors.sqft}</span>}
                    <span className="form-hint">Rough estimate is fine — we'll refine based on your photos.</span>
                  </div>

                  {/* Terrain */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="terrain">
                      Terrain / slope <span className="form-req">*</span>
                    </label>
                    <select
                      id="terrain"
                      className={`form-select${errors.terrain ? ' form-input--error' : ''}`}
                      value={fields.terrain}
                      onChange={e => set('terrain', e.target.value)}
                      aria-required="true"
                    >
                      <option value="">Select terrain type</option>
                      {TERRAIN.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.terrain && <span className="form-error" role="alert">{errors.terrain}</span>}
                  </div>

                  {/* Photo upload */}
                  <div className="form-group">
                    <label className="form-label">Yard photos <span className="form-req">*</span></label>
                    <div
                      className="form-upload-area"
                      onClick={() => photoInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && photoInputRef.current?.click()}
                    >
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

                  {/* Goals textarea */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="goals">
                      Describe your design goals <span className="form-opt">(optional — 500 characters max)</span>
                    </label>
                    <textarea
                      id="goals"
                      className="form-textarea"
                      placeholder="e.g. Replace front lawn with drought-tolerant landscaping, want to apply for Water Savers rebate, prefer a desert-modern look..."
                      maxLength={500}
                      value={fields.goals}
                      onChange={e => set('goals', e.target.value)}
                    />
                    <div className="form-char-count">{fields.goals.length}/500 characters remaining: {500 - fields.goals.length}</div>
                  </div>

                  {/* HOA checkbox + conditional upload */}
                  <div className="form-group">
                    <label className="form-checkbox-row">
                      <input
                        type="checkbox"
                        checked={fields.hoaChecked}
                        onChange={e => set('hoaChecked', e.target.checked)}
                      />
                      <span>
                        I have an HOA with design requirements
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                          White Glove includes HOA support at no additional charge.
                        </span>
                      </span>
                    </label>

                    {fields.hoaChecked && (
                      <div style={{ marginTop: 12, padding: '14px', background: 'var(--teal-dim)', border: '1px solid rgba(32,217,192,.2)', borderRadius: 'var(--r)', animation: 'fadeSlide .2s ease' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 12 }}>
                          Upload your HOA or architectural guideline documents. We'll design around their requirements. HOA approval and document submission to your HOA is your responsibility.
                        </p>
                        <div
                          className="form-upload-area form-upload-area--sm"
                          onClick={() => hoaFilesRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && hoaFilesRef.current?.click()}
                        >
                          <input
                            ref={hoaFilesRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            multiple
                            style={{ display: 'none' }}
                            onChange={e => {
                              const files = Array.from(e.target.files || [])
                              set('hoaFiles', files)
                            }}
                          />
                          <div className="form-upload-icon" aria-hidden="true">📋</div>
                          {fields.hoaFiles.length === 0
                            ? <><div className="form-upload-primary">Upload HOA guidelines</div><div className="form-upload-secondary">PDF, DOC, or images accepted</div></>
                            : <div className="form-upload-primary">{fields.hoaFiles.length} file{fields.hoaFiles.length !== 1 ? 's' : ''} selected ✓</div>
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Privacy note */}
                  <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                    We collect your email and property address to deliver your analysis. We do not sell or share your personal information. See our{' '}
                    <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Privacy Policy</Link> for details.
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
                        <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Terms of Service</Link>,{' '}
                        <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Privacy Policy</Link>, and{' '}
                        <Link to="/disclaimer" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Disclaimer</Link>.
                      </span>
                    </label>
                    {errors.agreedToTerms && <span className="form-error" role="alert">{errors.agreedToTerms}</span>}
                  </div>

                  {/* Email contact consent */}
                  <div className="form-group">
                    <label className="form-checkbox-row">
                      <input
                        type="checkbox"
                        checked={fields.agreedToContact}
                        onChange={e => set('agreedToContact', e.target.checked)}
                        aria-required="true"
                      />
                      <span>
                        I agree to be contacted by email regarding my submission and to arrange next steps.
                      </span>
                    </label>
                    {errors.agreedToContact && <span className="form-error" role="alert">{errors.agreedToContact}</span>}
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
                      No payment collected here — we'll follow up by email to confirm your package and arrange payment.{' '}
                      <Link to="/privacy">Privacy Policy</Link> ·{' '}
                      <Link to="/terms">Terms</Link> ·{' '}
                      <Link to="/disclaimer">Disclaimer</Link>
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
