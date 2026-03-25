import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'

const FAQ_GROUPS = [
  {
    id: 'about',
    title: 'About ReScapeUtah',
    items: [
      {
        q: 'What is ReScapeUtah?',
        a: 'ReScapeUtah is a digital planning and visualization service for Utah homeowners. We produce AI-powered design concepts, CAD-style yard blueprints, itemized cost estimates, and Utah Water Savers rebate preparation materials — all delivered as a downloadable PDF. We are not a landscaping company and do not perform installations of any kind.',
      },
      {
        q: 'Are you a landscaping company?',
        a: 'No. ReScapeUtah is a digital service. We produce design concepts, blueprints, and estimates. We do not perform any physical installation, landscape construction, or project management. Our role is to give you the information and visuals you need to make better decisions before hiring a contractor.',
      },
      {
        q: 'What do I actually receive?',
        a: 'Depending on your plan: up to 10–30 AI-powered design concepts exploring different styles, a CAD-style 2D blueprint of your yard with plant placement and dimensions, an itemized cost estimate with material and labor ranges, water savings projections, and Utah Water Savers rebate preparation guidance. All delivered as a downloadable PDF you can share with landscapers and your water provider.',
      },
      {
        q: 'How do the AI-powered design concepts work?',
        a: "Our design system generates multiple concept images based on your yard's actual photos, dimensions, terrain type, and the style preferences you specify. You review the concepts and select the direction you want to refine. Higher-tier plans include more concept variations and a refinement round.",
      },
    ],
  },
  {
    id: 'estimates',
    title: 'Estimates & Costs',
    items: [
      {
        q: 'How accurate are the cost estimates?',
        a: 'Our cost estimates are planning estimates based on general Utah market data for materials and labor. They are expressed as ranges and designed to help you budget and prepare for contractor conversations — not to replace those quotes. Actual costs depend on your contractor, material choices, and site conditions. Always get multiple contractor quotes before committing.',
      },
      {
        q: 'What Utah rebates are available?',
        a: 'Utah Water Savers programs are administered by local water conservancy districts. JVWCD cities (including West Jordan, South Jordan, Draper, Murray, and others in the Salt Lake metro) offer up to $3.00/sq ft for qualifying grass replacement. CUWCD cities (Provo, Orem, Lehi, and surrounding Utah County areas) typically offer $1.50–$3.00/sq ft. WBWCD cities (Ogden, Layton, Bountiful, and surrounding areas) offer approximately $2.50/sq ft. Rates and availability change — verify with your water provider before starting your project.',
      },
    ],
  },
  {
    id: 'water-savers',
    title: 'Utah Water Savers',
    items: [
      {
        q: 'Do you submit my Utah Water Savers application?',
        a: 'No. We help you prepare your materials and understand your provider\'s requirements. You submit your own application through utahwatersavers.com. We are not affiliated with Utah Water Savers or any government agency.',
      },
      {
        q: 'Will I definitely get approved for a rebate?',
        a: 'No. Approval depends on your city, water provider, project compliance, and inspection results. We cannot guarantee approval. Our Water Savers Prep package helps you prepare the strongest possible application, but the decision rests entirely with your water provider.',
      },
      {
        q: 'What if I have an HOA or need a design revision?',
        a: 'We offer a Design Revision add-on ($75) for any of the top three packages. This covers cases where you need your design updated — due to HOA feedback, contractor input, or a change in requirements. We revisit your plan with your new parameters and deliver a fresh concept set. White Glove customers receive one complimentary revision. Visit the Design Revision page or contact us to get started.',
      },
    ],
  },
  {
    id: 'process',
    title: 'The Process',
    items: [
      {
        q: 'Can I convert just part of my yard?',
        a: 'Absolutely. Most of our clients start with the front yard or a specific section. Our intake form lets you specify exactly which areas you\'re targeting. Your blueprint and cost estimate will reflect the scope you define.',
      },
      {
        q: 'How long does the process take?',
        a: 'From intake to delivery, the process takes up to 1 week. This covers concept generation, your selection, blueprint production, cost estimation, and rebate preparation where applicable. Turnaround times are targets, not guarantees.',
      },
      {
        q: 'Can I share my plan with a contractor?',
        a: 'Yes. Your PDF report is formatted specifically to be shareable with contractors. The blueprint and cost breakdown make it easy to get comparable quotes and spot outliers.',
      },
    ],
  },
  {
    id: 'service',
    title: 'Service & Mission',
    items: [
      {
        q: 'Do you serve areas outside Utah?',
        a: 'Not currently. ReScapeUtah is designed specifically for Utah homeowners and the Utah Water Savers program. Our rebate guidance is calibrated to Utah water districts. We plan to expand, but for now we are Utah-only.',
      },
      {
        q: "What's the difference between the packages?",
        a: "Visual Concept ($50): AI-powered design concepts only. Plan + Estimate ($150): concepts + CAD blueprint + cost estimate. Water Savers Prep ($300): full plan + rebate guidance + document prep. White Glove ($500): everything plus extended consultation, one complimentary design revision, and contractor referral assistance.",
      },
      {
        q: 'How does this help the Great Salt Lake?',
        a: "According to the Great Salt Lake Commissioner's 2024 Strategic Plan, 60% of Utah's residential water use goes toward outdoor irrigation. Every grass-to-landscape conversion reduces demand on the water systems that feed the Great Salt Lake watershed. It's one of the most direct things a Utah homeowner can do to help. Source: Great Salt Lake Commissioner's 2024 Strategic Plan; Utah Division of Water Resources.",
      },
    ],
  },
]

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GROUPS.flatMap(g => g.items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  }))),
}

export default function FAQPage() {
  return (
    <>
      <SEO
        title="Frequently Asked Questions"
        description="Answers to common questions about ReScapeUtah — our yard planning reports, Utah Water Savers rebate guidance, packages, turnaround, and how the process works."
        jsonLd={FAQ_SCHEMA}
      />

      <div className="page-hero">
        <div className="container">
          <span className="eyebrow">FAQ</span>
          <h1 className="page-hero-title">Frequently Asked Questions</h1>
          <p className="page-hero-sub">
            Everything you need to know before ordering. Don't see your question?{' '}
            <Link to="/contact" style={{ color: 'var(--teal)' }}>Contact us →</Link>
          </p>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <div className="faq-page-layout">

            <nav className="faq-sidebar" aria-label="FAQ sections">
              {FAQ_GROUPS.map(g => (
                <a key={g.id} href={`#faq-${g.id}`} className="faq-sidebar-link">
                  {g.title}
                </a>
              ))}
            </nav>

            <div className="faq-sections">
              {FAQ_GROUPS.map(g => (
                <div key={g.id} id={`faq-${g.id}`}>
                  <h2 className="faq-group-title">{g.title}</h2>
                  <FAQAccordion items={g.items} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="container">
          <h2 className="final-cta-title">Still have questions?</h2>
          <p className="final-cta-sub">We're happy to help before you order.</p>
          <div className="final-cta-actions">
            <Link to="/contact" className="btn btn--orange btn--lg">Contact Us</Link>
            <Link to="/pricing" className="btn btn--ghost btn--lg">See Pricing</Link>
          </div>
        </div>
      </div>
    </>
  )
}
