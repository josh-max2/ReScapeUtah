import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home            from './pages/Home'
import PricingPage     from './pages/PricingPage'
import CalculatorPage  from './pages/CalculatorPage'
import ExamplesPage    from './pages/ExamplesPage'
import HowItWorksPage  from './pages/HowItWorksPage'
import FAQPage         from './pages/FAQPage'
import ContactPage     from './pages/ContactPage'
import GalleryPage     from './pages/GalleryPage'
import RebateInfoPage  from './pages/RebateInfoPage'
import PrivacyPage     from './pages/PrivacyPage'
import TermsPage       from './pages/TermsPage'
import DisclaimerPage  from './pages/DisclaimerPage'
import ReferralPage      from './pages/ReferralPage'
import DesignRevisionPage from './pages/DesignRevisionPage'

import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <>
      <div className="page-ambient" aria-hidden="true" />
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/"             element={<Home />}            />
        <Route path="/pricing"      element={<PricingPage />}     />
        <Route path="/calculator"   element={<CalculatorPage />}  />
        <Route path="/examples"     element={<ExamplesPage />}    />
        <Route path="/how-it-works" element={<HowItWorksPage />}  />
        <Route path="/faq"          element={<FAQPage />}         />
        <Route path="/contact"      element={<ContactPage />}     />
        <Route path="/gallery"      element={<GalleryPage />}     />
        <Route path="/rebate-info"  element={<RebateInfoPage />}  />
        <Route path="/privacy"      element={<PrivacyPage />}     />
        <Route path="/terms"        element={<TermsPage />}       />
        <Route path="/disclaimer"      element={<DisclaimerPage />}      />
        <Route path="/referral"        element={<ReferralPage />}        />
        <Route path="/design-revision" element={<DesignRevisionPage />}  />
      </Routes>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
