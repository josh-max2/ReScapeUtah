import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

function validate(fields) {
  const errs = {}
  if (!fields.name.trim())     errs.name     = 'Name is required.'
  if (!fields.email.trim())    errs.email    = 'Email is required.'
  else if (!/\S+@\S+\.\S+/.test(fields.email)) errs.email = 'Enter a valid email address.'
  if (!fields.address.trim())  errs.address  = 'Street address is required.'
  if (!fields.referredBy.trim()) errs.referredBy = 'Please tell us who referred you.'
  if (!fields.agreed)          errs.agreed   = 'You must acknowledge the terms to continue.'
  return errs
}

export default function ReferralPage() {
  const [fields, setFields] = useState({
    name:       '',
    email:      '',
    address:    '',
    referredBy: '',
    note:       '',
    agreed:     false,
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
    console.log('ReScapeUtah referral submission:', fields)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  if (submitted) {
    return (
      <>
        <SEO title="Referral Discount — Visual Concept for $20" />
        <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', paddingBottom: 96, minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ maxWidth: 520 }}>
            <div className="contact-form-card">
              <div className="form-success">
                <span className="form-success-icon">✅</span>
                <h1 className="form-success-title">Discount request received.</h1>
                <p className="form-success-msg">
                  We'll email you your discount code within 24 hours. Use it at checkout to get your Visual Concept package for $20.
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
        title="Referral Discount — Visual Concept for $20"
        description="Been referred by a ReScapeUtah customer? Get 10 AI-powered yard design concepts for $20 — normally $50. A one-time discount for first-time customers."
      />

      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <span className="eyebrow">Referral Offer</span>
          <h1 className="page-hero-title">A welcome discount from a neighbor</h1>
          <p className="page-hero-sub">
            When a ReScapeUtah customer refers you, you unlock our Visual Concept package at a discounted rate — 10 AI-powered yard design concepts for just $20. Fill out the form below and we'll email your discount code within 24 hours.
          </p>
        </div>
      </div>

      {/* Offer card */}
      <section className="section--tight">
        <div className="container--sm">

          <div className="referral-offer-card">
            <div className="referral-offer-title">Visual Concept</div>
            <div className="referral-offer-desc">
              10 AI-powered design concepts for your Utah yard — different styles, plant palettes, and layout directions delivered as a shareable PDF.
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <span className="referral-offer-was">$50</span>
              <span className="referral-offer-price">$20</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>
              First-time customers &nbsp;&middot;&nbsp; One per address &nbsp;&middot;&nbsp; Planning estimates only
            </p>
          </div>

          {/* Form */}
          <div className="contact-form-card">
            <form onSubmit={handleSubmit} noValidate>

              {/* Full name */}
              <div className="form-group">
                <label className="form-label" htmlFor="ref-name">
                  Full name <span className="form-req">*</span>
                </label>
                <input
                  id="ref-name"
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
                <label className="form-label" htmlFor="ref-email">
                  Email address <span className="form-req">*</span>
                </label>
                <input
                  id="ref-email"
                  type="email"
                  className={`form-input${errors.email ? ' form-input--error' : ''}`}
                  placeholder="jane@example.com"
                  value={fields.email}
                  onChange={e => set('email', e.target.value)}
                  aria-required="true"
                />
                {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
              </div>

              {/* Street address */}
              <div className="form-group">
                <label className="form-label" htmlFor="ref-address">
                  Street address <span className="form-req">*</span>
                </label>
                <input
                  id="ref-address"
                  type="text"
                  className={`form-input${errors.address ? ' form-input--error' : ''}`}
                  placeholder="123 Main St, Salt Lake City, UT"
                  value={fields.address}
                  onChange={e => set('address', e.target.value)}
                  aria-required="true"
                />
                {errors.address && <span className="form-error" role="alert">{errors.address}</span>}
                <span className="form-hint">Used to understand your yard context and water district. Not shared.</span>
              </div>

              {/* Who referred you */}
              <div className="form-group">
                <label className="form-label" htmlFor="ref-referred-by">
                  Who referred you? <span className="form-req">*</span>
                </label>
                <input
                  id="ref-referred-by"
                  type="text"
                  className={`form-input${errors.referredBy ? ' form-input--error' : ''}`}
                  placeholder="e.g. Sarah J. or 'a neighbor on my street'"
                  value={fields.referredBy}
                  onChange={e => set('referredBy', e.target.value)}
                  aria-required="true"
                />
                {errors.referredBy && <span className="form-error" role="alert">{errors.referredBy}</span>}
                <span className="form-hint">A name or description is fine — we just need to know a referral was made.</span>
              </div>

              {/* Short note (optional) */}
              <div className="form-group">
                <label className="form-label" htmlFor="ref-note">
                  Anything you'd like to share? <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>(optional)</span>
                </label>
                <textarea
                  id="ref-note"
                  className="form-textarea"
                  placeholder="e.g. Front yard, mostly lawn, looking for drought-tolerant ideas..."
                  maxLength={200}
                  value={fields.note}
                  onChange={e => set('note', e.target.value)}
                />
                <div className="form-char-count">{fields.note.length}/200</div>
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
                    I understand this is a one-time discount for first-time customers. All sales are final.
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
                  {loading ? 'Submitting…' : 'Request My Discount Code'}
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
