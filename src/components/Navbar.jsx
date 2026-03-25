import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C12 2 16.5 8 21 9C21 9 18 15.5 20.5 20C20.5 20 15.5 18 12 21C12 21 8.5 18 3.5 20C3.5 20 6 15.5 3 9C3 9 7.5 8 12 2Z" fill="#20d9c0" />
  </svg>
)

const NAV_LINKS = [
  { to: '/calculator',   label: 'Calculator'   },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing',      label: 'Pricing'      },
  { to: '/gallery',      label: 'Gallery'      },
  { to: '/faq',          label: 'FAQ'          },
  { to: '/rebate-info',  label: 'Rebate Info'  },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const close = () => setOpen(false)

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="container nav-inner">
          <Link to="/" className="nav-logo" onClick={close} aria-label="ReScape home">
            <LogoIcon />
            ReScape
          </Link>

          <ul className="nav-links" role="list">
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <Link to="/contact" className="btn btn--orange nav-cta" aria-label="Get started">
            Get Started
          </Link>

          <button
            className={`nav-toggle${open ? ' open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="nav-drawer"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div
        id="nav-drawer"
        className={`nav-drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Navigation menu"
      >
        {NAV_LINKS.map(l => (
          <NavLink key={l.to} to={l.to} onClick={close}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="drawer-cta">
          <Link to="/contact" className="btn btn--orange btn--full btn--lg" onClick={close}>
            Get Started
          </Link>
        </div>
      </div>
    </>
  )
}
