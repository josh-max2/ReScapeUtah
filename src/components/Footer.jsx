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
              ReScapeUtah
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
            ReScapeUtah is a digital planning and visualization service. We do not perform landscape installation, submit government applications, or guarantee rebate approval. We provide AI-powered design concepts, planning documents, cost estimates, and preparation guidance. All estimates are for planning purposes only. The homeowner is responsible for contractor selection, application submission through utahwatersavers.com, and project execution. Utah Water Savers rebate programs are administered by participating water conservancy districts. Eligibility and rates vary by city and provider. Program data sourced from utahwatersavers.com, JVWCD, CUWCD, WBWCD, and the Utah Division of Water Resources.
          </p>
        </div>

        <div className="footer-bottom">
          <p className="footer-bottom-left">
            © {new Date().getFullYear()} ReScapeUtah. All rights reserved. &nbsp;·&nbsp; Not a landscape company. Digital planning service only. Utah only.
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
