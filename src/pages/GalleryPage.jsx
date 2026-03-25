import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

// 12 placeholder gradient cards with distinct color palettes
const GALLERY_ITEMS = [
  { id: 1,  label: 'Desert Modern',      sub: 'Decomposed granite + native plants',   gradient: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 50%, #1a3020 100%)' },
  { id: 2,  label: 'Xeriscape Classic',  sub: 'Drought-tolerant groundcover + rock', gradient: 'linear-gradient(135deg, #2e2410 0%, #4a3c1a 50%, #2e2810 100%)' },
  { id: 3,  label: 'Native Meadow',      sub: 'Utah native grasses + wildflowers',   gradient: 'linear-gradient(135deg, #1a2a1a 0%, #2a3a20 50%, #182a14 100%)' },
  { id: 4,  label: 'Modern Minimal',     sub: 'Clean lines, gravel, ornamental shrubs', gradient: 'linear-gradient(135deg, #141414 0%, #222222 50%, #1a1a1a 100%)' },
  { id: 5,  label: 'Desert Oasis',       sub: 'Succulents, boulders, drip irrigation', gradient: 'linear-gradient(135deg, #2e1a0a 0%, #4a2c14 50%, #2a1e0a 100%)' },
  { id: 6,  label: 'Pollinator Garden',  sub: 'Native flowering plants + pathways',   gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4a 50%, #161628 100%)' },
  { id: 7,  label: 'Formal Garden',      sub: 'Structured beds, low-water hedges',   gradient: 'linear-gradient(135deg, #0a1a0a 0%, #14281a 50%, #0a1810 100%)' },
  { id: 8,  label: 'Cottage Style',      sub: 'Perennials + gravel paths',           gradient: 'linear-gradient(135deg, #1e1020 0%, #321a3a 50%, #1a0e1e 100%)' },
  { id: 9,  label: 'Rocky Mountain',     sub: 'Boulders, ornamental grasses, DG',   gradient: 'linear-gradient(135deg, #1a1410 0%, #2e2418 50%, #1a1810 100%)' },
  { id: 10, label: 'Drip + Grass Mix',   sub: 'Partial grass, drip-irrigated border', gradient: 'linear-gradient(135deg, #0a1e14 0%, #14321e 50%, #0a1a14 100%)' },
  { id: 11, label: 'Front Yard Focus',   sub: 'Curb appeal + water savings',         gradient: 'linear-gradient(135deg, #1e1400 0%, #322400 50%, #201800 100%)' },
  { id: 12, label: 'Backyard Retreat',   sub: 'Low-water sanctuary + seating area',  gradient: 'linear-gradient(135deg, #100a1e 0%, #1e1432 50%, #0e0a1a 100%)' },
]

export default function GalleryPage() {
  return (
    <>
      <SEO
        title="Yard Design Gallery"
        description="Browse ReScapeUtah yard design style directions — desert modern, xeriscape, native meadow, and more. All styles are drought-tolerant and Utah Water Savers eligible. Planning concepts only."
      />

      <div className="page-hero">
        <div className="container">
          <span className="eyebrow">Design Gallery</span>
          <h1 className="page-hero-title">Yard design styles for Utah homes</h1>
          <p className="page-hero-sub">
            Browse the types of design directions we create. Your report will include concepts tailored to your yard's shape, size, and goals — not generic templates.
          </p>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <div style={{ padding: '14px 18px', background: 'rgba(32,217,192,.05)', border: '1px solid rgba(32,217,192,.15)', borderRadius: 'var(--r)', marginBottom: 36, fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--teal)' }}>Design direction placeholders.</strong>{' '}
            These cards represent the style categories your ReScapeUtah report can explore. Your actual AI-powered concepts will be tailored to your specific yard dimensions, photos, terrain, and goals. Real report previews are shown in our{' '}
            <Link to="/examples" style={{ color: 'var(--teal)' }}>Examples section</Link>.
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(249,115,22,.05)', border: '1px solid rgba(249,115,22,.15)', borderRadius: 'var(--r)', marginBottom: 28, fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--orange)' }}>Your analysis includes concepts designed from YOUR yard's photos.</strong>{' '}
            When you order, you upload photos of your actual yard. We create AI-powered concepts based on your real space — not stock images or generic templates.
          </div>

          <div className="gallery-grid">
            {GALLERY_ITEMS.map(item => (
              <div key={item.id} className="gallery-card" style={{ background: item.gradient }}>
                <div className="gallery-card-inner" aria-hidden="true" />
                <div className="gallery-card-body">
                  <div className="gallery-card-label">{item.label}</div>
                  <div className="gallery-card-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              All designs are drought-tolerant and can be tailored for Utah Water Savers eligibility.
            </p>
            <Link to="/contact" className="btn btn--orange btn--lg">
              Get Your Custom Concepts
            </Link>
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Want concepts for your specific yard?</h2>
          <p className="final-cta-sub">
            We create AI-powered design concepts tailored to your square footage, terrain, and goals — not generic stock images.
          </p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Start My Analysis</Link>
            <Link to="/pricing" className="btn btn--ghost btn--lg">See Pricing</Link>
          </div>
        </div>
      </div>
    </>
  )
}
