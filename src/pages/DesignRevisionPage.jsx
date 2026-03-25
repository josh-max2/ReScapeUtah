import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

function validate(fields) {
  const errs = {}
  if (!fields.name.trim())         errs.name         = 'Name is required.'
  if (!fields.email.trim())        errs.email        = 'Email is required.'
  else if (!/\S+@\S+\.\S+/.test(fields.email)) errs.email = 'Enter a valid email address.'
  if (!fields.originalOrder.trim()) errs.originalOrder = 'Please describe your original project or provide an order reference.'
  if (!fields.newRequirements.trim()) errs.newRequirements = 'Please describe what has changed or what feedback you received.'
  if (!fields.agreed)              errs.agreed       = 'You must acknowledge the terms to continue.'
  return errs
}

export default function DesignRevisionPage() {
  const fileInputRef = useRef(null)

  const [fields, setFields] = useState({
    name:            '',
    email:           '',
    originalOrder:   '',
    newRequirements: '',
    files:           [],
    agreed:          false,
  })

  const [errors,    setErrors]    = useState({})
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key, val) => {
    setFields(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    console.log('ReScapeUtah design revision submission:', fields)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  if (submitted) {
    return (
      <>
        <SEO title="Design Revision — Update Your Yard Plan" />
        <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', paddingBottom: 96, minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ maxWidth: 520 }}>
            <div className="contact-form-card">
              <div className="form-success">
                <span className="form-success-icon">✅</span>
                <h1 className="form-success-title">Revision request received.</h1>
                <p className="form-success-msg">
                  Design revision request received. We'll review and confirm your order details by email.
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
        title="Design Revision — Update Your Yard Plan"
        description="Already have a ReScapeUtah report? Update your yard design to reflect contractor feedback, HOA requirements, or changed project goals — up to 10 revised concepts for $75."
      />

      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <span className="eyebrow">Design Revision</span>
          <h1 className="page-hero-title">Update your design with new requirements</h1>
          <p className="page-hero-sub">
            Already have a ReScapeUtah report? If your contractor, HOA, or new project requirements call for changes, we'll revisit your design and produce an updated concept set — no need to start over.
          </p>
        </div>
      </div>

      {/* Info section */}
      <section className="section--tight" style={{ background: 'var(--bg-alt)' }}>
        <div className="container--sm">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px 22px' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>What's included</div>
              <ul style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.75, paddingLeft: 18, margin: 0 }}>
                <li>Updated concept set based on new requirements</li>
                <li>Up to 10 revised concepts</li>
                <li>Delivery within 1 week</li>
                <li>Delivered as a shareable PDF</li>
              </ul>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px 22px' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Who it's for</div>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.75, margin: 0 }}>
                Customers who have already received their initial ReScapeUtah report and need changes based on contractor feedback, HOA review, or updated project goals.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 'var(--r-lg)', padding: '24px 22px' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--orange)' }}>White Glove customers</div>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.75, margin: 0 }}>
                Design revisions are included in the White Glove package. Please{' '}
                <Link to="/contact" style={{ color: 'var(--teal)', textDecoration: 'underline', textUnderlineOffset: 2 }}>contact us</Link>{' '}
                before ordering — your revision may already be covered.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Form */}
      <section className="section--tight">
        <div className="container--sm">

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--orange)', lineHeight: 1 }}>$75</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>One-time add-on · All sales are final</div>
          </div>

          <div className="contact-form-card">
            <form onSubmit={handleSubmit} noValidate>

              {/* Full name */}
              <div className="form-group">
                <label className="form-label" htmlFor="dr-name">
                  Full name <span className="form-req">*</span>
                </label>
                <input
                  id="dr-name"
                  type="text"
                  className={`form-input${errors.name ? ' form-input--error' : ''}`}
                  placeholder="Jane Smith"
                  value={fields.name}
                  onChange={e => set('name', e.target.value)}
                  aria-required="true"
                />
                {errors.name && <span className="form-error" role="alert">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="dr-email">
                  Email address <span className="form-req">*</span>
                </label>
                <input
                  id="dr-email"
                  type="email"
                  className={`form-input${errors.email ? ' form-input--error' : ''}`}
                  placeholder="jane@example.com"
                  value={fields.email}
                  onChange={e => set('email', e.target.value)}
                  aria-required="true"
                />
                {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
                <span className="form-hint">Use the same email address as your original order so we can verify your account.</span>
              </div>

              {/* Original order reference */}
              <div className="form-group">
                <label className="form-label" htmlFor="dr-original-order">
                  Original order reference / description <span className="form-req">*</span>
                </label>
                <textarea
                  id="dr-original-order"
                  className={`form-textarea${errors.originalOrder ? ' form-input--error' : ''}`}
                  placeholder="Describe your original project or reference your order if you have one — e.g. 'Front yard redesign, 1200 sq ft, Salt Lake City, ordered March 2025'"
                  value={fields.originalOrder}
                  onChange={e => set('originalOrder', e.target.value)}
                  aria-required="true"
                />
                {errors.originalOrder && <span className="form-error" role="alert">{errors.originalOrder}</span>}
              </div>

              {/* New requirements */}
              <div className="form-group">
                <label className="form-label" htmlFor="dr-new-requirements">
                  New requirements or feedback <span className="form-req">*</span>
                </label>
                <textarea
                  id="dr-new-requirements"
                  className={`form-textarea${errors.newRequirements ? ' form-input--error' : ''}`}
                  placeholder="What has changed? Include contractor notes, HOA feedback, or new design direction — e.g. 'HOA requires all plants stay under 3ft along the fence line. Contractor suggested removing the water feature.'"
                  maxLength={500}
                  value={fields.newRequirements}
                  onChange={e => set('newRequirements', e.target.value)}
                  aria-required="true"
                />
                {errors.newRequirements && <span className="form-error" role="alert">{errors.newRequirements}</span>}
                <div className="form-char-count">{fields.newRequirements.length}/500</div>
              </div>

              {/* File upload (optional) */}
              <div className="form-group">
                <label className="form-label">
                  Supporting documents{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>(optional)</span>
                </label>
                <div
                  className="form-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => set('files', Array.from(e.target.files || []))}
                  />
                  <div className="form-upload-icon" aria-hidden="true">📎</div>
                  {fields.files.length === 0 ? (
                    <>
                      <div className="form-upload-primary">Click to upload documents</div>
                      <div className="form-upload-secondary">HOA letters, contractor notes, updated plans — PDF, images</div>
                    </>
                  ) : (
                    <div className="form-upload-primary">{fields.files.length} file{fields.files.length !== 1 ? 's' : ''} selected ✓</div>
                  )}
                </div>
                <span className="form-hint">Upload any HOA letters, contractor feedback, or reference documents that will help us update your design.</span>
              </div>

              {/* Agreement checkbox */}
              <div className="form-group">
                <label className={`form-checkbox-row${errors.agreed ? ' form-input--error' : ''}`} style={{ alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={fields.agreed}
                    onChange={e => set('agreed', e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <span>
                    I understand the Design Revision service is $75 and all sales are final. White Glove customers should contact us before ordering as your revision may be included.
                    <span className="form-req"> *</span>
                  </span>
                </label>
                {errors.agreed && <span className="form-error" role="alert" style={{ marginTop: 6 }}>{errors.agreed}</span>}
              </div>

              <div className="form-submit-section">
                <button
                  type="submit"
                  className="btn btn--orange btn--full btn--lg"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? 'Submitting…' : 'Submit Revision Request — $75'}
                </button>
                <p className="form-privacy-note">
                  Your information is never sold or shared.{' '}
                  <Link to="/privacy">Privacy Policy</Link> &middot;{' '}
                  <Link to="/terms">Terms</Link> &middot;{' '}
                  <Link to="/disclaimer">Disclaimer</Link>
                </p>
              </div>

            </form>
          </div>

        </div>
      </section>
    </>
  )
}
