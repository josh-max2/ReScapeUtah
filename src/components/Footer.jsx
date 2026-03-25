import { Link } from 'react-router-dom'

const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C12 2 16.5 8 21 9C21 9 18 15.5 20.5 20C20.5 20 15.5 18 12 21C12 21 8.5 18 3.5 20C3.5 20 6 15.5 3 9C3 9 7.5 8 12 2Z" fill="#20d9c0" />
  </svg>
)

const PRODUCT_LINKS = [
  { to: '/calculator',   label: 'Calculator'   },
  { to: '/pricing',      label: 'Pricing'      },
  { to: '/gallery',      label: 'Gallery'      },
  { to: '/examples',     label: 'Examples'     },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/rebate-info',  label: 'Rebate Info'  },
]

const COMPANY_LINKS = [
  { to: '/faq',     label: 'FAQ'     },
  { to: '/contact', label: 'Contact' },
]

const LEGAL_LINKS = [
  { to: '/privacy',    label: 'Privacy Policy'   },
  { to: '/terms',      label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Disclaimer'       },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">

          <div>
            <Link to="/" className="footer-brand-logo">
              <LogoIcon />
              ReScape
            </Link>
            <p className="footer-tagline">
              AI-powered yard planning for Utah homeowners. Concepts, costs, and rebate guidance — before you hire anyone.
            </p>
            <p className="footer-disclaimer-note">
              Digital planning service only. Not a landscape company. We do not perform installations.
            </p>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                {PRODUCT_LINKS.map(l => (
                  <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                {COMPANY_LINKS.map(l => (
                  <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                {LEGAL_LINKS.map(l => (
                  <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Full legal disclaimer */}
        <div className="footer-legal">
          <p>
            <strong>About This Service:</strong> ReScape is a digital planning and analysis service. We provide informational reports to help Utah homeowners plan yard projects. We are not licensed contractors, landscape architects, civil engineers, or financial advisors. Nothing in our reports constitutes professional contracting, engineering, architectural, financial, or legal advice. We do not perform any physical work, installation, construction, grading, planting, or landscaping.
          </p>
          <p>
            All cost estimates, rebate projections, water savings estimates, water bill impact estimates, square footage calculations, and other numerical figures are <strong>planning estimates only</strong>. They are based on general market data, publicly available program information, and general Utah irrigation guidelines. Actual project costs may vary significantly. Always obtain multiple contractor quotes before committing to a project.
          </p>
          <p>
            ReScape is not affiliated with Utah Water Savers, the Central Utah Water Conservancy District (CUWCD), or any water provider or municipality. We do not determine rebate eligibility. We do not submit Utah Water Savers applications on behalf of homeowners. Rebate eligibility, approval, and payment are determined solely by your water provider. Nothing on this site constitutes a guarantee that you will receive any rebate or that any specific rebate amount will be available to you.
          </p>
          <p>
            Our reports are planning documents. They are not stamped engineering drawings and are not guaranteed to satisfy HOA requirements, municipal building permit requirements, or any other regulatory standard. You are responsible for confirming compliance with all applicable rules, codes, and restrictions before proceeding with any project.
          </p>
        </div>

        <div className="footer-bottom">
          <p className="footer-bottom-left">
            © {new Date().getFullYear()} ReScape. All rights reserved. &nbsp;·&nbsp; Not a landscape company. Digital planning service only. Utah only.
          </p>
          <div className="footer-bottom-right">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
