import { useState } from 'react'
import { sendBillEmail } from '../../api/endpoints'
import { EMAIL_MAX_LENGTH, isValidEmail } from '../../api/validation'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { finalizeThermalPrint } from './thermalPrint'
import { KITCHEN_RECEIPT_CSS, buildKitchenReceiptHtml } from './printReceiptHelpers'
import './PrintBillView.css'

const WALKIN_BILL_LOGO_SRC = '/image/image6.jpeg'

export default function PrintWalkinBill({ bill, onClose }) {
  useBodyScrollLock()

  const [email,    setEmail]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')

  const handleSendEmail = async () => {
    if (!email.trim()) { setEmailMsg('Please enter an email address.'); return }
    if (!isValidEmail(email.trim())) {
      setEmailMsg('Invalid email address. Example: user@example.com')
      return
    }
    setSending(true)
    setEmailMsg('')
    try {
      await sendBillEmail(bill.id, email.trim())
      setEmailSent(true)
      setEmailMsg(`Sent to ${email.trim()}`)
    } catch (err) {
      setEmailMsg(err.response?.data?.detail || 'Failed to send email.')
    } finally { setSending(false) }
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const logoUrl = `${window.location.origin}${WALKIN_BILL_LOGO_SRC}`
    const kitchenCopy = buildKitchenReceiptHtml(bill, {
      orderTypeLabel: 'WALK-IN',
      customerValue: bill.customer_name,
    })

    const rows = bill.items.map((line) => `
      <tr>
        <td>${line.name}</td>
        <td>${line.qty}</td>
        <td>Rs.${parseFloat(line.unit_price).toFixed(2)}</td>
        <td>Rs.${parseFloat(line.line_total).toFixed(2)}</td>
      </tr>`).join('')

    const dateStr = new Date(bill.generated_at).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill ${bill.bill_number}</title>
  <style id="receipt-page-size">@page { size: 80mm 140mm; margin: 0; }</style>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 80mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
    }
    .receipt {
      width: 76mm;
      margin: 0 auto;
      padding: 3mm 2mm 4mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 1px solid #111;
      margin-bottom: 12px;
    }
    .logo-wrap { margin-bottom: 10px; }
    .logo {
      width: 62px;
      height: 62px;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid #C9A84C;
      padding: 4px;
      background: #fff;
    }
    .org-name { font-size: 18px; font-weight: 700; letter-spacing: 0.6px; }
    .org-sub { font-size: 9px; color: #555; margin-top: 2px; }
    .copy-label {
      display: inline-block;
      margin-top: 8px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      border: 1.5px solid #111;
      padding: 2px 10px;
      border-radius: 3px;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      margin-bottom: 14px;
    }
    .meta-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #777;
    }
    .meta-value {
      font-size: 10px;
      font-weight: 600;
      color: #111;
      margin-top: 1px;
      word-break: break-word;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      table-layout: fixed;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    thead th {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      padding: 6px 4px;
      border-bottom: 1px solid #111;
      text-align: left;
    }
    thead th:first-child,
    tbody td:first-child {
      width: 39%;
      word-break: break-word;
    }
    thead th:nth-child(2),
    tbody td:nth-child(2) {
      width: 11%;
      text-align: center;
    }
    thead th:nth-child(3),
    tbody td:nth-child(3),
    thead th:nth-child(4),
    tbody td:nth-child(4) {
      width: 25%;
      text-align: right;
      white-space: nowrap;
    }
    tbody td {
      padding: 7px 4px;
      border-bottom: 1px solid #ddd;
      vertical-align: top;
      font-size: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0 0;
      border-top: 1px solid #111;
      margin-top: 4px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .total-label { font-size: 12px; font-weight: 700; }
    .total-value { font-size: 18px; font-weight: 700; }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #777;
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
    }
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
      <div class="copy-label">Counter Sale</div>
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
      ${bill.customer_name ? `
      <div>
        <div class="meta-label">Customer</div>
        <div class="meta-value">${bill.customer_name}</div>
      </div>` : ''}
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total-row">
      <span class="total-label">TOTAL</span>
      <span class="total-value">Rs.${parseFloat(bill.total_amount).toFixed(2)}</span>
    </div>
    <div class="footer">Thank you for dining with us!</div>
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
      <div className="pbv-modal">
        <div className="pbv-content">

          <div className="pbv-header">
            <div className="pbv-logo-wrap">
              <img className="pbv-logo" src={WALKIN_BILL_LOGO_SRC} alt="Cafe Lush logo" />
            </div>
            <div className="pbv-org-name">Cafe Lush</div>
            <div className="pbv-org-sub">Hotel POS &amp; Management System</div>
            <div className="pbv-copy-label">Counter Sale</div>
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
            {bill.cashier_name && (
              <div className="pbv-meta-row">
                <span className="pbv-meta-label">Cashier</span>
                <span className="pbv-meta-value">{bill.cashier_name}</span>
              </div>
            )}
            {bill.customer_name && (
              <div className="pbv-meta-row" style={{ gridColumn: '1 / -1' }}>
                <span className="pbv-meta-label">Customer</span>
                <span className="pbv-meta-value">{bill.customer_name}</span>
              </div>
            )}
          </div>

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

          <div className="pbv-total-row">
            <span className="pbv-total-label">TOTAL</span>
            <span className="pbv-total-value">Rs.{parseFloat(bill.total_amount).toFixed(2)}</span>
          </div>

          <div className="pbv-footer">Thank you for dining with us!</div>
        </div>

        <div className="pbv-actions">
          <button className="pbv-btn-print" onClick={handlePrint}>Print</button>
          <button className="pbv-btn-close" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #f0ebe3' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Send bill PDF to email</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailMsg('') }}
              maxLength={EMAIL_MAX_LENGTH}
              style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleSendEmail}
              disabled={sending || emailSent}
              style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', background: emailSent ? '#065f46' : '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: emailSent ? 'default' : 'pointer', opacity: sending ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {sending ? 'Sending...' : emailSent ? 'Sent' : 'Send'}
            </button>
          </div>
          {emailMsg && (
            <div style={{ fontSize: '12px', marginTop: '6px', color: emailSent ? '#065f46' : '#991b1b' }}>

              {emailMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
