import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import './PrintBillView.css'
import { buildReceiptViewModel, formatCurrency, formatReceiptDate, printReceiptDocument } from './printReceiptHelpers'

export default function PrintWalkinBill({ bill, onClose, initialPrintWindow = null }) {
  useBodyScrollLock()

  const [error, setError] = useState('')
  const [printing, setPrinting] = useState(false)
  const autoPrintAttempted = useRef(false)
  const printWindowRef = useRef(initialPrintWindow)

  useEffect(() => {
    if (initialPrintWindow && !initialPrintWindow.closed) {
      printWindowRef.current = initialPrintWindow
    }
  }, [initialPrintWindow])

  const attemptPrint = useEffectEvent(async (targetBill) => {
    if (!targetBill) return
    setPrinting(true)
    setError('')
    try {
      await printReceiptDocument(targetBill, {
        title: targetBill.bill_number || 'walk-in-bill',
        sourceLabel: 'Walk-in Bill',
        customerLabel: 'Customer',
        windowRef: printWindowRef.current,
      })
    } catch (err) {
      setError(err.message || 'Failed to open the print dialog.')
    } finally {
      setPrinting(false)
    }
  })

  const receipt = useMemo(
    () => buildReceiptViewModel(bill, { sourceLabel: 'Walk-in Bill', customerLabel: 'Customer' }),
    [bill],
  )

  const handlePrint = async () => {
    await attemptPrint(bill)
  }

  useEffect(() => {
    if (!bill || autoPrintAttempted.current) return
    autoPrintAttempted.current = true
    attemptPrint(bill)
  }, [bill, attemptPrint])

  return createPortal(
    <div className="pbv-overlay" onClick={onClose}>
      <div className="pbv-modal" onClick={(event) => event.stopPropagation()}>
        <div className="pbv-shell">
          <div className="pbv-head">
            <div>
              <h2 className="pbv-title">Print walk-in bill</h2>
              <div className="pbv-subtitle">
                This receipt uses the browser HTML/CSS print layout.
              </div>
            </div>
            <button type="button" className="pbv-close" onClick={onClose} aria-label="Close print dialog">
              x
            </button>
          </div>

          <div className="pbv-card">
            <span className="pbv-badge">{receipt.source_label}</span>
            <div className="pbv-grid">
              <div className="pbv-field">
                <div className="pbv-label">Bill Number</div>
                <div className="pbv-value">{receipt.bill_number || '-'}</div>
              </div>
              <div className="pbv-field">
                <div className="pbv-label">Generated</div>
                <div className="pbv-value">{formatReceiptDate(receipt.generated_at)}</div>
              </div>
              <div className="pbv-field">
                <div className="pbv-label">Order Reference</div>
                <div className="pbv-value">{receipt.order_reference || '-'}</div>
              </div>
              <div className="pbv-field">
                <div className="pbv-label">Customer</div>
                <div className="pbv-value">{receipt.customer_value || 'Walk-in customer'}</div>
              </div>
              <div className="pbv-field">
                <div className="pbv-label">Items</div>
                <div className="pbv-value">{receipt.item_count}</div>
              </div>
              <div className="pbv-field">
                <div className="pbv-label">Cashier</div>
                <div className="pbv-value">{receipt.cashier_name || 'Cashier'}</div>
              </div>
            </div>

            <div className="pbv-items">
              <div className="pbv-items-head">
                <span>Item</span>
                <span style={{ textAlign: 'right' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {(receipt.items || []).map((line, index) => {
                const qty = Number(line?.qty ?? line?.quantity ?? 0)
                const unitPrice = Number(line?.unit_price ?? 0)
                const lineTotal = Number(line?.line_total ?? qty * unitPrice)

                return (
                  <div key={`${line?.item_id ?? line?.name ?? 'item'}-${index}`} className="pbv-item-row">
                    <div>
                      <div className="pbv-item-name">{line?.name || `Item ${index + 1}`}</div>
                      <div className="pbv-item-meta">{formatCurrency(unitPrice)} each</div>
                    </div>
                    <div className="pbv-item-qty">{qty}</div>
                    <div className="pbv-item-total">{formatCurrency(lineTotal)}</div>
                  </div>
                )
              })}
            </div>

            <div className="pbv-summary">
              <div className="pbv-summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.subtotal_amount)}</span>
              </div>
              <div className="pbv-summary-row total">
                <span>Total</span>
                <span>{formatCurrency(receipt.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="pbv-message">
            If the browser blocked the pop-up, use the print button below to try again.
          </div>

          {error && <div className="pbv-error">{error}</div>}

          <div className="pbv-actions">
            <button type="button" className="pbv-btn pbv-btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="pbv-btn pbv-btn-primary"
              onClick={handlePrint}
              disabled={!bill || printing}
            >
              {printing ? 'Opening print dialog...' : 'Print receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
