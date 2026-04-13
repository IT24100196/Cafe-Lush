import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getBillPrint, sendBillEmail } from '../../api/endpoints'
import { Spinner } from '../../components/UI'
import { finalizeThermalPrint } from './thermalPrint'
import { KITCHEN_RECEIPT_CSS, buildKitchenReceiptHtml } from './printReceiptHelpers'
import './PrintBillView.css'

const ONLINE_BILL_LOGO_SRC = '/image/image6.jpeg'

export default function PrintBillView({ billId, anchorRect, onClose }) {
  const [bill,       setBill]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [emailSent,   setEmailSent]  = useState(false)
  const [emailMsg,    setEmailMsg]   = useState('')
  const [modalTop,    setModalTop]   = useState(null)
  const modalRef = useRef(null)

  useEffect(() => {
    getBillPrint(billId)
      .then(({ data }) => setBill(data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load bill.'))
      .finally(() => setLoading(false))
  }, [billId])

  const repositionModal = useCallback(() => {
    if (!anchorRect || !modalRef.current) {
      setModalTop(null)
      return
    }

    const viewportH = window.innerHeight
    const modalH = modalRef.current.offsetHeight || 0
    const minTop = 20
    const maxTop = Math.max(minTop, viewportH - modalH - 20)
    const anchorCenterY = anchorRect.top + ((anchorRect.height || 0) / 2)
    const desiredTop = anchorCenterY - (modalH / 2)
    const clamped = Math.min(maxTop, Math.max(minTop, desiredTop))
    setModalTop(clamped)
  }, [anchorRect])

  useLayoutEffect(() => {
    if (!loading) repositionModal()
  }, [loading, bill, error, repositionModal])

  useEffect(() => {
    if (!anchorRect) return undefined
    const onResize = () => repositionModal()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [anchorRect, repositionModal])

  const handleSendEmail = async () => {
    if (!bill) return
    setSending(true)
    setEmailMsg('')
    try {
      await sendBillEmail(billId, bill.student_email)
      setEmailSent(true)
      setEmailMsg(`✅ Sent to ${bill.student_email}`)
    } catch (err) {
      setEmailMsg(`❌ ${err.response?.data?.detail || 'Failed to send email.'}`)
    } finally { setSending(false) }
  }

  const copyLabel = bill?.delivery_type === 'delivery' ? 'delivery' : 'takeaway'

  const handlePrint = () => {
    if (!bill) return
    const win = window.open('', '_blank')
    if (!win) return
    const logoUrl = `${window.location.origin}${ONLINE_BILL_LOGO_SRC}`
    const printCopyLabel = bill.delivery_type === 'delivery' ? 'delivery' : 'takeaway'
    const kitchenCopy = buildKitchenReceiptHtml(bill, {
      orderTypeLabel: 'ONLINE',
      customerLabel: 'STUDENT',
      customerValue: bill.student_name,
    })

    const rows = bill.items.map((line) => `
      <tr>
        <td>${line.name}</td>
        <td style="text-align:center">${line.qty}</td>
        <td style="text-align:right">Rs.${parseFloat(line.unit_price).toFixed(2)}</td>
        <td style="text-align:right">Rs.${parseFloat(line.line_total).toFixed(2)}</td>
      </tr>`).join('')

    const dateStr = new Date(bill.generated_at).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const subtotalAmount = parseFloat(bill.subtotal_amount ?? bill.total_amount ?? 0)
    const deliveryFee = parseFloat(bill.delivery_fee ?? 0)
    const totalAmount = parseFloat(bill.total_amount ?? 0)

    const deliveryBlock = bill.delivery_type === 'delivery' && bill.delivery_address ? `
      <div class="delivery-box">
        <div class="delivery-title">Deliver To</div>
        <div class="delivery-value">${bill.delivery_address}</div>
        ${bill.phone_number ? `<div class="delivery-value" style="margin-top:4px">📞 ${bill.phone_number}</div>` : ''}
      </div>` : ''

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill ${bill.bill_number}</title>
  <style id="receipt-page-size">@page { size: 80mm 160mm; margin: 0; }</style>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 80mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
    }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; }
    .receipt {
      width: 76mm;
      margin: 0 auto;
      padding: 3mm 2mm 4mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .header { text-align: center; padding-bottom: 10px; border-bottom: 1px solid #111; margin-bottom: 12px; }
    .logo-wrap { margin-bottom: 8px; }
    .logo {
      width: 54px;
      height: 54px;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid #C9A84C;
      padding: 3px;
      background: #fff;
    }
    .org-name { font-size: 18px; font-weight: 700; letter-spacing: 0.6px; }
    .org-sub { font-size: 9px; color: #555; margin-top: 2px; }
    .copy-label { display: inline-block; margin-top: 8px; font-size: 9px; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; border: 1.5px solid #111;
      padding: 2px 10px; border-radius: 3px; }
    .meta { display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 14px; }
    .meta-label { font-size: 8px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #777; }
    .meta-value { font-size: 10px; font-weight: 600; color: #111; margin-top: 1px; word-break: break-word; }
    .delivery-box { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px;
      padding: 8px 10px; margin-bottom: 14px; }
    .delivery-title { font-size: 8px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #777; margin-bottom: 4px; }
    .delivery-value { font-size: 10px; font-weight: 600; color: #111; line-height: 1.4; word-break: break-word; }
    .summary-row { display: flex; justify-content: space-between; align-items: center;
      padding: 4px 0; font-size: 10px; color: #333; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      table-layout: fixed;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    thead th { font-size: 8px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #555; padding: 6px 4px;
      border-bottom: 1px solid #111; text-align: left; }
    thead th:first-child, tbody td:first-child { width: 39%; word-break: break-word; }
    thead th:nth-child(2), tbody td:nth-child(2) { width: 11%; text-align: center; }
    thead th:nth-child(3), tbody td:nth-child(3),
    thead th:nth-child(4), tbody td:nth-child(4) { width: 25%; text-align: right; white-space: nowrap; }
    tbody td { padding: 7px 4px; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 10px; }
    .total-row { display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0 0; border-top: 1px solid #111; margin-top: 4px;
      break-inside: avoid; page-break-inside: avoid; }
    .total-label { font-size: 12px; font-weight: 700; }
    .total-value { font-size: 18px; font-weight: 700; }
    .footer { text-align: center; font-size: 9px; color: #777;
      margin-top: 16px; padding-top: 10px; border-top: 1px dashed #ccc; }
    ${KITCHEN_RECEIPT_CSS}
  </style>
</head>
<body>
  <div class="print-stack">
  <div class="receipt">
    <div class="header">
    <div class="logo-wrap">
      <img class="logo" src="${logoUrl}" alt="Cafe Lush logo" />
    </div>
    <div class="org-name">Cafe Lush</div>
    <div class="org-sub">Hotel POS &amp; Management System</div>
    <div class="copy-label">${printCopyLabel}</div>
    </div>
    <div class="meta">
    ${bill.order_reference ? `
    <div>
      <div class="meta-label">Order Ref</div>
      <div class="meta-value">${bill.order_reference}</div>
    </div>` : ''}
    <div>
      <div class="meta-label">Bill No (Internal)</div>
      <div class="meta-value">${bill.bill_number}</div>
    </div>
    <div>
      <div class="meta-label">Date &amp; Time</div>
      <div class="meta-value">${dateStr}</div>
    </div>
    ${bill.cashier_name ? `
    <div>
      <div class="meta-label">Cashier</div>
      <div class="meta-value">${bill.cashier_name}</div>
    </div>` : ''}
    <div>
      <div class="meta-label">Student Name</div>
      <div class="meta-value">${bill.student_name || '—'}</div>
    </div>
    ${bill.student_email ? `
    <div style="grid-column:1/-1">
      <div class="meta-label">Email</div>
      <div class="meta-value">${bill.student_email}</div>
    </div>` : ''}
  </div>
    ${deliveryBlock}
    <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
    <div class="summary-row">
      <span>Subtotal</span>
      <span>Rs.${subtotalAmount.toFixed(2)}</span>
    </div>
    ${bill.delivery_type === 'delivery' ? `
    <div class="summary-row">
      <span>Delivery Fee</span>
      <span>Rs.${deliveryFee.toFixed(2)}</span>
    </div>` : ''}
    <div class="total-row">
      <span class="total-label">TOTAL</span>
      <span class="total-value">Rs.${totalAmount.toFixed(2)}</span>
    </div>
    <div class="footer">Thank you for your order! Please hand this copy to the delivery person.</div>
  </div>
  ${kitchenCopy}
  </div>
</body>
</html>`)

    win.document.close()
    void finalizeThermalPrint(win, { selector: '.print-stack', minHeightMm: 90 })
  }

  return (
    <div className="pbv-overlay">
      <div
        ref={modalRef}
        className="pbv-modal"
        style={anchorRect ? {
          position: 'fixed',
          left: '50%',
          top: modalTop == null ? 20 : modalTop,
          transform: 'translateX(-50%)',
          margin: 0,
        } : undefined}
      >

        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#991b1b' }}>
            {error}
            <br />
            <button className="pbv-btn-close" style={{ marginTop: '16px' }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="pbv-content">

              <div className="pbv-header">
                <div className="pbv-logo-wrap">
                  <img className="pbv-logo pbv-logo--compact" src={ONLINE_BILL_LOGO_SRC} alt="Cafe Lush logo" />
                </div>
                <div className="pbv-org-name">Cafe Lush</div>
                <div className="pbv-org-sub">Hotel POS &amp; Management System</div>
                <div className="pbv-copy-label">{copyLabel}</div>
              </div>

              <div className="pbv-meta">
                {bill.order_reference && (
                  <div className="pbv-meta-row">
                    <span className="pbv-meta-label">Order Ref</span>
                    <span className="pbv-meta-value">{bill.order_reference}</span>
                  </div>
                )}
                <div className="pbv-meta-row">
                  <span className="pbv-meta-label">Bill No (Internal)</span>
                  <span className="pbv-meta-value">{bill.bill_number}</span>
                </div>
                <div className="pbv-meta-row">
                  <span className="pbv-meta-label">Date &amp; Time</span>
                  <span className="pbv-meta-value">
                    {new Date(bill.generated_at).toLocaleString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="pbv-meta-row">
                  <span className="pbv-meta-label">Student Name</span>
                  <span className="pbv-meta-value">{bill.student_name || '—'}</span>
                </div>
                {bill.cashier_name && (
                  <div className="pbv-meta-row">
                    <span className="pbv-meta-label">Cashier</span>
                    <span className="pbv-meta-value">{bill.cashier_name}</span>
                  </div>
                )}
                {bill.student_email && (
                  <div className="pbv-meta-row" style={{ gridColumn: '1 / -1' }}>
                    <span className="pbv-meta-label">Email</span>
                    <span className="pbv-meta-value">{bill.student_email}</span>
                  </div>
                )}
              </div>

              {bill.delivery_type === 'delivery' && bill.delivery_address && (
                <div className="pbv-delivery-box">
                  <div className="pbv-delivery-title">Deliver To</div>
                  <div className="pbv-delivery-value">{bill.delivery_address}</div>
                  {bill.phone_number && (
                    <div className="pbv-delivery-value" style={{ marginTop: '4px' }}>
                      📞 {bill.phone_number}
                    </div>
                  )}
                </div>
              )}

              <table className="pbv-table">
                <thead>
                  <tr>
                    <th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((line, i) => (
                    <tr key={i}>
                      <td><span className="pbv-item-name">{line.name}</span></td>
                      <td>{line.qty}</td>
                      <td>Rs.{parseFloat(line.unit_price).toFixed(2)}</td>
                      <td>Rs.{parseFloat(line.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pbv-summary-row">
                <span>Subtotal</span>
                <span>Rs.{parseFloat(bill.subtotal_amount ?? bill.total_amount).toFixed(2)}</span>
              </div>
              {bill.delivery_type === 'delivery' && (
                <div className="pbv-summary-row">
                  <span>Delivery Fee</span>
                  <span>Rs.{parseFloat(bill.delivery_fee ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="pbv-total-row">
                <span className="pbv-total-label">TOTAL</span>
                <span className="pbv-total-value">Rs.{parseFloat(bill.total_amount).toFixed(2)}</span>
              </div>

              <div className="pbv-footer">
                Thank you for your order! Please hand this copy to the delivery person.
              </div>
            </div>

            <div className="pbv-actions">
              <button className="pbv-btn-print" onClick={handlePrint}>🖨️ Print</button>
              {bill.student_email && (
                <button
                  className="pbv-btn-print"
                  style={{ background: emailSent ? '#065f46' : '#1d4ed8' }}
                  onClick={handleSendEmail}
                  disabled={sending || emailSent}
                >
                  {sending ? 'Sending…' : emailSent ? '✅ Sent' : '✉️ Send to Email'}
                </button>
              )}
              <button className="pbv-btn-close" onClick={onClose}>Close</button>
            </div>
            {emailMsg && (
              <div style={{ textAlign: 'center', fontSize: '12px', padding: '8px 16px', color: emailMsg.startsWith('✅') ? '#065f46' : '#991b1b' }}>
                {emailMsg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
