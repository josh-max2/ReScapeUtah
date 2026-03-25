import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import FAQAccordion from '../components/FAQAccordion'

const FAQ_GROUPS = [
  {
    id: 'about',
    title: 'About ReScape',
    items: [
      {
        q: 'What exactly is ReScape?',
        a: 'ReScape is a digital planning and analysis service for Utah homeowners. We deliver AI-generated yard design concepts, a CAD-style top-down plan, an itemized cost estimate, and Utah Water Savers rebate guidance — all in one downloadable report. We are not a landscaping company and do not perform installations of any kind.',
      },
      {
        q: 'Are you a landscaping company?',
        a: 'No. ReScape is a digital service. We produce planning reports and analysis documents. We do not design-build, install, or manage landscaping projects. Our role is to give you the information and visuals you need to make better decisions before hiring a contractor.',
      },
      {
        q: 'Who is this service for?',
        a: 'ReScape is designed for Utah homeowners who are considering replacing turf, planning a yard project, or exploring Utah Water Savers rebate eligibility — and who want to understand their options and see real numbers before committing to a landscaper or a project.',
      },
      {
        q: 'What do I receive when I order?',
        a: 'Depending on your package: a set of AI-generated yard concept images, a top-down CAD-style plan, an itemized cost estimate, a water-saving projection, and/or Utah Water Savers rebate guidance. All deliverables are included in a downloadable PDF report.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery and Turnaround',
    items: [
      {
        q: 'How long does it take to receive my analysis?',
        a: 'Reports are delivered within up to 1 week from order submission and payment confirmation. Turnaround times are targets, not guarantees — complex yards or high-volume periods may take longer. We will communicate proactively if there is a delay.',
      },
      {
        q: 'How is the report delivered?',
        a: 'Your report is delivered as a downloadable PDF via email. The file is sized to be printable and shareable with contractors or water providers.',
      },
      {
        q: 'Can I share the report with a contractor?',
        a: 'Yes. The report PDF is formatted to be shareable. The top-down plan and cost breakdown are particularly useful for getting accurate contractor quotes and for comparing bids.',
      },
    ],
  },
  {
    id: 'rebates',
    title: 'Utah Water Savers and Rebates',
    items: [
      {
        q: 'What is Utah Water Savers?',
        a: 'Utah Water Savers is a state-promoted water conservation initiative where participating local water providers offer rebates to homeowners who replace water-intensive turf with water-efficient landscaping. The program is run at the local level — rates, requirements, and availability vary by water provider.',
      },
      {
        q: 'Do you submit the Utah Water Savers application for me?',
        a: 'No. Utah Water Savers applications are submitted directly by the homeowner to their water provider. Our Utah Water Savers Prep package helps you understand the process, prepares the documents and information you will likely need, and gets you organized — but you submit the application yourself, directly to your provider.',
      },
      {
        q: 'How do I know if I qualify for a rebate?',
        a: 'Eligibility depends on your specific water provider, their current program availability, and whether your project meets their requirements. The best way to confirm eligibility is to contact your water provider directly. Our rebate guidance helps you understand what your provider generally offers, but we cannot guarantee your eligibility.',
      },
      {
        q: 'How accurate are the rebate estimates?',
        a: 'Our rebate estimates are planning estimates based on publicly available Utah Water Savers rate information. Rates range from approximately $1.00–$3.00 per square foot depending on your provider and program. Actual rebate amounts depend on your provider\'s current program, funding availability, and your project meeting their eligibility requirements.',
      },
      {
        q: 'What documents do I need for the Utah Water Savers application?',
        a: 'Requirements vary by provider. Common requirements include: before-and-after photos of the turf area, a 2D design plan showing the proposed layout, proof of residence, and a completed application form from your provider. Some providers require an on-site inspection before the project begins. Our Utah Water Savers Prep package helps you organize and prepare these materials.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing and Orders',
    items: [
      {
        q: 'What packages do you offer?',
        a: 'We offer four packages: Visual Concept ($50) — AI yard concept images. Plan + Estimate ($150) — concepts + CAD plan + cost estimate. Utah Water Savers Prep ($300) — full plan + rebate guidance + document prep. White Glove ($500) — everything plus extended consultation and contractor referral support.',
      },
      {
        q: 'Can I upgrade my package after ordering?',
        a: 'Yes. If you order a lower-tier package and later want to upgrade, contact us and we can apply the amount you already paid toward the higher-tier package.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'If you are not satisfied with your analysis, contact us within 7 days of delivery and we will work to make it right or issue a refund at our discretion.',
      },
      {
        q: 'Is this a subscription?',
        a: 'No. Every package is a one-time payment per report. There are no recurring charges or subscriptions.',
      },
    ],
  },
  {
    id: 'report',
    title: 'About the Report',
    items: [
      {
        q: 'How accurate are the cost estimates?',
        a: 'Our cost estimates are planning estimates based on general market pricing data for materials, plants, and labor in Utah. They are expressed as ranges and are designed to help you budget and plan — not to replace a contractor quote. Actual costs will vary depending on contractor, materials availability, and site conditions. Always get multiple contractor quotes before committing to a project.',
      },
      {
        q: 'Is the top-down plan usable for HOA applications or permits?',
        a: 'Our plans are design and planning documents. They are not stamped engineering drawings and are not guaranteed to satisfy all HOA or municipal permit requirements. For official permit submissions, consult a licensed landscape architect or contractor. Our HOA Design Review Add-On can help adjust the design to align with common HOA restriction categories.',
      },
      {
        q: 'What AI tools do you use?',
        a: "We use AI-assisted design tools to generate yard concept images tailored to your yard's specifications, climate, and style preferences. The concept images are starting points for planning and visualization — they are not photorealistic renderings of the finished project.",
      },
      {
        q: 'Does this service work outside of Utah?',
        a: 'ReScape is designed specifically for Utah homeowners and the Utah Water Savers program. Our rebate guidance is calibrated to Utah water districts. We do not currently serve other states.',
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
        description="Answers to common questions about ReScape — our yard planning reports, Utah Water Savers rebate guidance, packages, turnaround, and how the process works."
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
