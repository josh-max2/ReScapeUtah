import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

// City → { district, rate }
// Rate is $/sq ft for Utah Water Savers turf removal rebate
const CITY_DATA = {
  // Jordan Valley Water Conservancy District — up to $3.00/sq ft
  'Salt Lake City':     { district: 'JVWCD',  rate: 3.00 },
  'West Jordan':        { district: 'JVWCD',  rate: 3.00 },
  'South Jordan':       { district: 'JVWCD',  rate: 3.00 },
  'Murray':             { district: 'JVWCD',  rate: 3.00 },
  'Midvale':            { district: 'JVWCD',  rate: 3.00 },
  'Draper':             { district: 'JVWCD',  rate: 3.00 },
  'Riverton':           { district: 'JVWCD',  rate: 3.00 },
  'Herriman':           { district: 'JVWCD',  rate: 3.00 },
  'Bluffdale':          { district: 'JVWCD',  rate: 3.00 },
  'West Valley City':   { district: 'JVWCD',  rate: 3.00 },
  'Taylorsville':       { district: 'JVWCD',  rate: 3.00 },
  'Cottonwood Heights': { district: 'JVWCD',  rate: 3.00 },
  // Central Utah Water Conservancy District — ~$1.75–$2.75/sq ft, using $2.25 midpoint
  'Provo':              { district: 'CUWCD',  rate: 2.25 },
  'Orem':               { district: 'CUWCD',  rate: 2.25 },
  'Springville':        { district: 'CUWCD',  rate: 2.25 },
  'Spanish Fork':       { district: 'CUWCD',  rate: 2.25 },
  'Lehi':               { district: 'CUWCD',  rate: 2.25 },
  'American Fork':      { district: 'CUWCD',  rate: 2.25 },
  'Pleasant Grove':     { district: 'CUWCD',  rate: 2.25 },
  'Vineyard':           { district: 'CUWCD',  rate: 2.25 },
  // Weber Basin Water Conservancy District — ~$2.50/sq ft
  'Ogden':              { district: 'WBWCD',  rate: 2.50 },
  'Layton':             { district: 'WBWCD',  rate: 2.50 },
  'Clearfield':         { district: 'WBWCD',  rate: 2.50 },
  'Roy':                { district: 'WBWCD',  rate: 2.50 },
  'Kaysville':          { district: 'WBWCD',  rate: 2.50 },
  'Syracuse':           { district: 'WBWCD',  rate: 2.50 },
  'Clinton':            { district: 'WBWCD',  rate: 2.50 },
  'Bountiful':          { district: 'WBWCD',  rate: 2.50 },
  'North Salt Lake':    { district: 'WBWCD',  rate: 2.50 },
}

const CITY_LIST = Object.keys(CITY_DATA).sort()

// Gallons per sq ft per year for Utah turf (conservative estimate)
// Based on general Utah irrigation guidance (~55–65 gal/sqft/yr, using 58)
const GAL_PER_SQFT = 58

function fmt(n) { return Math.round(n).toLocaleString() }

// Formula from spec: adjusted_sqft × 0.925 × 0.623 × 26
// 0.925 = efficiency factor, 0.623 = conversion, 26 = billing cycles
function calcAnnualBillSavings(sqft, rate) {
  return sqft * 0.925 * 0.623 * 26 * (rate / 3.00)
}

export default function CalculatorWidget({ embedded = false }) {
  const [sqft, setSqft]   = useState(1500)
  const [city, setCity]   = useState('')

  const cityInfo = city && CITY_DATA[city] ? CITY_DATA[city] : null
  const rate     = cityInfo ? cityInfo.rate : 2.00  // default $2.00 if no city selected

  const results = useMemo(() => {
    const rebate        = Math.round(sqft * rate)
    const gallonsYear   = Math.round(sqft * GAL_PER_SQFT)
    const showers       = Math.round(gallonsYear / 17)
    const bathtubs      = Math.round(gallonsYear / 50)
    const poolPct       = ((gallonsYear / 660000) * 100).toFixed(1)
    const billSavingsEst = Math.round(calcAnnualBillSavings(sqft, rate))
    return { rebate, gallonsYear, showers, bathtubs, poolPct, billSavingsEst }
  }, [sqft, rate])

  return (
    <div className={`calc-widget${embedded ? ' calc-widget--embedded' : ''}`}>

      {/* Inputs */}
      <div className="calc-widget-inputs">
        {/* Square footage */}
        <div className="calc-field">
          <div className="calc-label">
            <span className="calc-label-text">Turf area to replace</span>
            <span className="calc-label-value">{sqft.toLocaleString()} sq ft</span>
          </div>
          <input
            type="range"
            min={200} max={5000} step={50}
            value={sqft}
            onChange={e => setSqft(Number(e.target.value))}
            className="calc-slider"
            aria-label={`Square footage: ${sqft}`}
          />
          <div className="calc-slider-bounds">
            <span>200 sq ft</span>
            <span>5,000 sq ft</span>
          </div>
        </div>

        {/* City dropdown */}
        <div className="calc-field">
          <label className="calc-label-text" htmlFor="calc-city">
            Your Utah city <span className="calc-optional">(optional — improves estimate)</span>
          </label>
          <select
            id="calc-city"
            className="calc-select"
            value={city}
            onChange={e => setCity(e.target.value)}
          >
            <option value="">— Select your city —</option>
            <optgroup label="Jordan Valley WCD">
              {CITY_LIST.filter(c => CITY_DATA[c].district === 'JVWCD').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Central Utah WCD">
              {CITY_LIST.filter(c => CITY_DATA[c].district === 'CUWCD').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Weber Basin WCD">
              {CITY_LIST.filter(c => CITY_DATA[c].district === 'WBWCD').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>
          {cityInfo && (
            <div className="calc-city-info">
              <span className="calc-city-district">{cityInfo.district}</span>
              <span>Estimated rate: <strong>${cityInfo.rate.toFixed(2)}/sq ft</strong></span>
            </div>
          )}
          {!city && (
            <p className="calc-help">Using default estimate of $2.00/sq ft. Select your city for a more tailored estimate.</p>
          )}
        </div>
      </div>

      {/* Outputs */}
      <div className="calc-widget-outputs">
        {/* Rebate */}
        <div className="calc-out-card calc-out-card--primary">
          <div className="calc-out-label">Estimated rebate</div>
          <div className="calc-out-value">${fmt(results.rebate)}</div>
          <div className="calc-out-sub">
            {sqft.toLocaleString()} sq ft × ${rate.toFixed(2)}/sq ft
            {cityInfo ? ` (${cityInfo.district} rate)` : ' (default estimate)'}
          </div>
        </div>

        {/* Water savings */}
        <div className="calc-out-card">
          <div className="calc-out-label">Est. annual water savings</div>
          <div className="calc-out-value calc-out-value--teal">~{fmt(results.gallonsYear)} gal/yr</div>
          <div className="calc-out-sub">Based on ~{GAL_PER_SQFT} gal/sq ft/yr Utah average</div>
        </div>

        {/* Fun facts */}
        <div className="calc-fun-facts">
          <div className="calc-fun-fact">
            <span className="calc-fun-icon">🚿</span>
            <span>That's ~<strong>{fmt(results.showers)}</strong> showers</span>
          </div>
          <div className="calc-fun-fact">
            <span className="calc-fun-icon">🛁</span>
            <span>Or ~<strong>{fmt(results.bathtubs)}</strong> bathtubs</span>
          </div>
          <div className="calc-fun-fact">
            <span className="calc-fun-icon">🏊</span>
            <span>~<strong>{results.poolPct}%</strong> of a standard pool</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="calc-widget-disclaimer">
        <strong>Planning estimate only.</strong> Rebate rates and availability vary by water provider and program year. Verify all figures directly with your water provider before making financial decisions.{' '}
        <Link to="/disclaimer" style={{ color: 'var(--text-sec)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Full disclaimer</Link>
      </div>

      {embedded && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/calculator" className="btn btn--outline">
            Open full calculator →
          </Link>
        </div>
      )}
    </div>
  )
}
