import { useState } from 'react'

/**
 * Reusable accordion.
 * items: [{ q: string, a: string | ReactNode }]
 * allowMultiple: bool (default false)
 */
export default function FAQAccordion({ items = [], allowMultiple = false }) {
  const [open, setOpen] = useState(new Set())

  const toggle = (i) => {
    setOpen(prev => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(i)) { next.delete(i) }
      else             { next.add(i) }
      return next
    })
  }

  return (
    <div className="faq-list" role="list">
      {items.map((item, i) => {
        const isOpen = open.has(i)
        return (
          <div key={i} className={`faq-item${isOpen ? ' open' : ''}`} role="listitem">
            <button
              className="faq-question"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
            >
              <span>{item.q}</span>
              <span className="faq-icon" aria-hidden="true">+</span>
            </button>
            {isOpen && (
              <div className="faq-answer" id={`faq-answer-${i}`} role="region">
                {typeof item.a === 'string'
                  ? <p>{item.a}</p>
                  : item.a
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
