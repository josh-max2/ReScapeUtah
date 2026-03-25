import { useState, useMemo, useCallback } from 'react'

const CITY_DATA = {
  // JVWCD — $3.00/sqft
  'West Jordan':        { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'South Jordan':       { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Riverton':           { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Herriman':           { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Bluffdale':          { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Draper':             { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Sandy':              { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Midvale':            { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Murray':             { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Cottonwood Heights': { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Holladay':           { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Taylorsville':       { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'West Valley City':   { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Kearns':             { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  'Magna':              { district: 'JVWCD', rate: 3.00, rateLabel: '$3.00/sq ft' },
  // CUWCD — $2.25/sqft midpoint, range $1.50–$3.00
  'Provo':              { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Orem':               { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Lehi':               { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'American Fork':      { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Pleasant Grove':     { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Springville':        { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Spanish Fork':       { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Payson':             { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Saratoga Springs':   { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Eagle Mountain':     { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Cedar Hills':        { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Highland':           { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Alpine':             { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Lindon':             { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  'Vineyard':           { district: 'CUWCD', rate: 2.25, rateLabel: '~$2.25/sq ft (range $1.50–$3.00)' },
  // WBWCD — $2.50/sqft
  'Ogden':              { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Layton':             { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Bountiful':          { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Farmington':         { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Kaysville':          { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Syracuse':           { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Roy':                { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Clinton':            { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Clearfield':         { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'North Salt Lake':    { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Woods Cross':        { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
  'Centerville':        { district: 'WBWCD', rate: 2.50, rateLabel: '~$2.50/sq ft' },
}

const MANUAL_RATES = [
  { value: 1.00, label: '$1.00/sq ft' },
  { value: 2.00, label: '$2.00/sq ft' },
  { value: 2.50, label: '$2.50/sq ft' },
  { value: 3.00, label: '$3.00/sq ft' },
]

function fmt(n) { return Math.round(n).toLocaleString() }

export default function CalculatorWidget({ embedded = false }) {
  const [sqft, setSqft]             = useState(1000)
  const [city, setCity]             = useState('')
  const [manualRate, setManualRate] = useState(null)
  const [monthlyBill, setMonthlyBill] = useState('')
  const [copied, setCopied]         = useState(false)

  const cityInfo      = city && CITY_DATA[city] ? CITY_DATA[city] : null
  const effectiveRate = manualRate !== null ? manualRate : (cityInfo ? cityInfo.rate : 2.00)
  const adjustedSqft  = Math.round(sqft * 0.925)

  const results = useMemo(() => {
    const rebate        = Math.round(adjustedSqft * effectiveRate)
    const gallonsYear   = Math.round(adjustedSqft * 0.623 * 26)
    const swimmingPools = parseFloat((gallonsYear / 20000).toFixed(1))
    const showers       = parseFloat((gallonsYear / 17).toFixed(1))
    const bathtubs      = parseFloat((gallonsYear / 50).toFixed(1))
    const billNum  = parseFloat(monthlyBill)
    const hasBill  = !isNaN(billNum) && billNum > 0
    const billLow  = hasBill ? Math.round(billNum * 0.30) : null
    const billHigh = hasBill ? Math.round(billNum * 0.50) : null
    return { rebate, gallonsYear, swimmingPools, showers, bathtubs, hasBill, billLow, billHigh }
  }, [adjustedSqft, effectiveRate, monthlyBill])

  const handleShare = useCallback(() => {
    const text = `ReScapeUtah Estimate: ${sqft.toLocaleString()} sq ft grass area → ~$${fmt(results.rebate)} estimated rebate | ~${fmt(results.gallonsYear)} gallons/year water savings. Get your plan at rescapeutah.com`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }, [sqft, results])

  const handleDownload = useCallback(() => {
    const rateSource = cityInfo
      ? `${cityInfo.district} (${cityInfo.rateLabel})`
      : manualRate !== null
        ? `Manual rate ($${manualRate.toFixed(2)}/sq ft)`
        : 'Default estimate ($2.00/sq ft)'
    const billLine = results.hasBill
      ? `Est. monthly bill reduction:  $${results.billLow}–$${results.billHigh}/month (irrigation season)\n`
      : ''
    const lines = [
      'ReScapeUtah — Rebate & Water Savings Estimate',
      '='.repeat(46),
      '',
      `Grass area entered:        ${sqft.toLocaleString()} sq ft`,
      `Eligible area estimate:    ${adjustedSqft.toLocaleString()} sq ft (accounts for hardscape)`,
      `Rate used:                 ${rateSource}`,
      '',
      `Estimated rebate:          $${fmt(results.rebate)}`,
      `Est. annual water savings: ${fmt(results.gallonsYear)} gallons/year`,
      billLine,
      'What that water represents:',
      `  • ${results.showers.toLocaleString()} average showers (17 gal each)`,
      `  • ${results.bathtubs.toLocaleString()} bathtubs filled (50 gal each)`,
      `  • ${results.swimmingPools.toLocaleString()} swimming pools (20,000 gal each)`,
      '',
      '-'.repeat(46),
      'IMPORTANT: These are planning estimates only.',
      'Actual rebate eligibility, amounts, and water savings depend on your city,',
      'water provider, project scope, and compliance with program requirements.',
      'Visit utahwatersavers.com for official program details.',
      '',
      `Generated by ReScapeUtah (rescapeutah.com)`,
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'ReScapeUtah_Estimate.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [sqft, adjustedSqft, cityInfo, manualRate, results])

  return (
    <div className={`calc-widget${embedded ? ' calc-widget--embedded' : ''}`} id="calculator">
      <div className="calc-widget-inputs">

        <div className="calc-inputs-header">
          <span className="calc-inputs-title">Your details</span>
          <span className="calc-inputs-live">Results update live ↓</span>
        </div>

        <div className="calc-field">
          <div className="calc-label">
            <span className="calc-label-text">📏 Grass area to replace</span>
            <span className="calc-label-value">{sqft.toLocaleString()} sq ft</span>
          </div>
          <input
            type="range" min={200} max={5000} step={50}
            value={sqft}
            onChange={e => setSqft(Number(e.target.value))}
            className="calc-slider"
            aria-label={`Grass area: ${sqft} sq ft`}
          />
          <div className="calc-slider-bounds">
            <span>200 sq ft</span><span>5,000 sq ft</span>
          </div>
          <div className="calc-adjusted-note">
            Eligible area estimate: <strong>{adjustedSqft.toLocaleString()} sq ft</strong>
            <span className="calc-adjusted-sub"> (accounts for existing hardscape)</span>
          </div>
        </div>

        <div className="calc-field">
          <label className="calc-label-text" htmlFor="calc-city" style={{ display: 'block', marginBottom: 8 }}>
            🏙️ Your Utah city <span className="calc-optional">(improves estimate)</span>
          </label>
          <select
            id="calc-city" className="calc-select"
            value={city} onChange={e => { setCity(e.target.value); setManualRate(null) }}
          >
            <option value="">— Select your city —</option>
            <option value="__unsure">I'm not sure</option>
            <optgroup label="Jordan Valley WCD ($3.00/sq ft)">
              {Object.keys(CITY_DATA).filter(c => CITY_DATA[c].district === 'JVWCD').sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Central Utah WCD (~$2.25/sq ft)">
              {Object.keys(CITY_DATA).filter(c => CITY_DATA[c].district === 'CUWCD').sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Weber Basin WCD (~$2.50/sq ft)">
              {Object.keys(CITY_DATA).filter(c => CITY_DATA[c].district === 'WBWCD').sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>
          {cityInfo && (
            <div className="calc-city-info">
              <span className="calc-city-district">{cityInfo.district}</span>
              <span>Estimated rate: <strong>{cityInfo.rateLabel}</strong></span>
            </div>
          )}
          {city === '__unsure' && (
            <p className="calc-help">Using $2.00/sq ft default. <a href="https://utahwatersavers.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Visit utahwatersavers.com</a> to check your city's program.</p>
          )}
          {!city && (
            <p className="calc-help">Using $2.00/sq ft default. Select your city for a more accurate estimate.</p>
          )}
        </div>

        <div className="calc-field">
          <div className="calc-label-text" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            📊 Or manually select rate <span className="calc-optional">(overrides city selection)</span>
          </div>
          <div className="calc-radio-group" role="radiogroup" aria-label="Manual rate selection">
            {MANUAL_RATES.map(r => (
              <label key={r.value} className="calc-radio">
                <input
                  type="radio" name="manual-rate" value={r.value}
                  checked={manualRate === r.value}
                  onChange={() => { setManualRate(r.value); setCity('') }}
                />
                {r.label}
              </label>
            ))}
          </div>
          {manualRate !== null && (
            <button onClick={() => setManualRate(null)} className="calc-clear-rate">
              ✕ Clear manual selection
            </button>
          )}
        </div>

        <div className="calc-field calc-field--bill">
          <label className="calc-label-text" htmlFor="calc-bill" style={{ display: 'block', marginBottom: 8 }}>
            💧 Monthly water bill <span className="calc-optional">(optional)</span>
          </label>
          <div className="calc-bill-input-wrap">
            <span className="calc-bill-prefix">$</span>
            <input
              id="calc-bill" type="number" min={0}
              placeholder="e.g., 120"
              value={monthlyBill}
              onChange={e => setMonthlyBill(e.target.value)}
              className="calc-input calc-input--bill"
              aria-label="Monthly water bill in dollars"
            />
          </div>
          <p className="calc-help">Enter your summer bill to see an estimated monthly reduction. Not saved or transmitted.</p>
        </div>

      </div>

      <div className="calc-widget-outputs">

        <div className="calc-out-card calc-out-card--primary">
          <div className="calc-out-label">Estimated rebate</div>
          <div className="calc-out-value">${fmt(results.rebate)}</div>
          <div className="calc-out-sub">
            {adjustedSqft.toLocaleString()} eligible sq ft × ${effectiveRate.toFixed(2)}/sq ft
            {cityInfo ? ` (${cityInfo.district})` : manualRate !== null ? ' (manual)' : ' (default est.)'}
          </div>
        </div>

        <div className="calc-out-card">
          <div className="calc-out-label">Est. annual water savings</div>
          <div className="calc-out-value calc-out-value--teal">~{fmt(results.gallonsYear)} gal/yr</div>
          <div className="calc-out-sub">Eligible area × 0.623 gal/sq ft/week × 26 weeks</div>
        </div>

        <div className="calc-fun-facts">
          <div className="calc-fun-fact">
            <span className="calc-fun-icon">🚿</span>
            <div className="calc-fun-body">
              <span className="calc-fun-num">{results.showers.toLocaleString()}</span>
              <span className="calc-fun-label">average showers</span>
              <span className="calc-fun-detail">at 17 gal each</span>
            </div>
          </div>
          <div className="calc-fun-fact">
            <span className="calc-fun-icon">🛁</span>
            <div className="calc-fun-body">
              <span className="calc-fun-num">{results.bathtubs.toLocaleString()}</span>
              <span className="calc-fun-label">bathtubs filled</span>
              <span className="calc-fun-detail">at 50 gal each</span>
            </div>
          </div>
          <div className="calc-fun-fact">
            <span className="calc-fun-icon">🏊</span>
            <div className="calc-fun-body">
              <span className="calc-fun-num">{results.swimmingPools.toLocaleString()}</span>
              <span className="calc-fun-label">swimming pools</span>
              <span className="calc-fun-detail">at 20,000 gal each</span>
            </div>
          </div>
        </div>

        {results.hasBill ? (
          <div className="calc-out-card calc-out-card--bill">
            <div className="calc-out-label">💧 Est. monthly bill reduction</div>
            <div className="calc-out-value calc-out-value--orange">
              ${results.billLow}–${results.billHigh}
              <span style={{ fontSize: '0.5em', fontWeight: 400, marginLeft: 4 }}>/mo</span>
            </div>
            <div className="calc-out-sub">Rough estimate based on typical Utah outdoor water patterns (30–50% of summer bill). Planning estimate only.</div>
          </div>
        ) : (
          <div className="calc-bill-prompt">
            <span className="calc-bill-prompt-icon">💧</span>
            <span>Enter your monthly water bill above to see estimated bill savings</span>
          </div>
        )}

        <div className="calc-actions">
          <button className="btn btn--ghost btn--sm" onClick={handleShare} aria-label="Copy estimate to clipboard">
            {copied ? '✓ Copied!' : '📋 Copy estimate'}
          </button>
          <button className="btn btn--teal btn--sm" onClick={handleDownload} aria-label="Download estimate as text file">
            ⬇ Download estimate
          </button>
        </div>

      </div>

      <div className="calc-widget-disclaimer">
        These are planning estimates only. Actual rebate eligibility, amounts, and water savings depend on your city, water provider, project scope, and compliance with program requirements. Visit <a href="https://utahwatersavers.com" target="_blank" rel="noopener noreferrer">utahwatersavers.com</a> for official details. We do not save, store, or transmit any information entered into this calculator.
      </div>
    </div>
  )
}
