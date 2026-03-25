import { Helmet } from 'react-helmet-async'

const SITE_NAME    = 'ReScape'
const DEFAULT_TITLE = 'ReScape — Yard Plans, Costs & Utah Rebate Guidance'
const DEFAULT_DESC  = 'AI-generated yard concepts, a CAD-style plan, and a personalized cost and Utah Water Savers rebate estimate — up to 1 week turnaround. For Utah homeowners.'

export default function SEO({ title, description, canonical, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const desc = description || DEFAULT_DESC

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta name="twitter:card"        content="summary" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
