import { useState } from 'react'
import { sendBillEmail } from '../../api/endpoints'
import './PrintBillView.css'

export default function PrintWalkinBill({ bill, onClose }) {
  const [email,    setEmail]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')

  const handleSendEmail = async () => {
    if (!email.trim()) { setEmailMsg('❌ Please enter an email address.'); return }
    setSending(true)
    setEmailMsg('')
    try {
      await sendBillEmail(bill.id, email.trim())
      setEmailSent(true)
      setEmailMsg(`✅ Sent to ${email.trim()}`)
    } catch (err) {
      setEmailMsg(`❌ ${err.response?.data?.detail || 'Failed to send email.'}`)
    } finally { setSending(false) }
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return

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

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill ${bill.bill_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; padding: 24px; }
    .header { text-align: center; padding-bottom: 14px; border-bottom: 2px solid #111; margin-bottom: 16px; }
    .org-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .org-sub { font-size: 11px; color: #555; margin-top: 3px; }
    .copy-label { display: inline-block; margin-top: 10px; font-size: 11px; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; border: 1.5px solid #111;
      padding: 2px 10px; border-radius: 3px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 18px; }
    .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #777; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111; margin-top: 1px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #555; padding: 6px 4px;
      border-bottom: 1.5px solid #111; text-align: left; }
    thead th:nth-child(2) { text-align: center; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 8px 4px; border-bottom: 1px solid #ddd; vertical-align: top; }
    tbody td:nth-child(2) { text-align: center; }
    tbody td:last-child { text-align: right; }
    .total-row { display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0 0; border-top: 2px solid #111; margin-top: 4px; }
    .total-label { font-size: 14px; font-weight: 700; }
    .total-value { font-size: 22px; font-weight: 700; }
    .footer { text-align: center; font-size: 11px; color: #777;
      margin-top: 20px; padding-top: 14px; border-top: 1px dashed #ccc; }
    @page { size: A4 portrait; margin: 18mm 16mm; }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">Cafe Lush</div>
    <div class="org-sub">Hotel POS &amp; Management System</div>
    <div class="copy-label">Counter Sale</div>
  </div>
  <div class="meta">
    <div>
      <div class="meta-label">Bill No</div>
      <div class="meta-value">${bill.bill_number}</div>
    </div>
    <div>
      <div class="meta-label">Date &amp; Time</div>
      <div class="meta-value">${dateStr}</div>
    </div>
    ${bill.customer_name ? `
    <div style="grid-column:1/-1">
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
  <div class="footer">Thank you for dining with us! 🙏</div>
</body>
</html>`)

    win.document.close()
    win.focus()
    win.onload = () => { win.print(); win.close() }
  }

  return (
    <div className="pbv-overlay">
      <div className="pbv-modal">
        <div className="pbv-content">

          <div className="pbv-header">
            <div className="pbv-org-name">Cafe Lush</div>
            <div className="pbv-org-sub">Hotel POS &amp; Management System</div>
            <div className="pbv-copy-label">Counter Sale</div>
          </div>

          <div className="pbv-meta">
            <div className="pbv-meta-row">
              <span className="pbv-meta-label">Bill No</span>
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

          <div className="pbv-footer">Thank you for dining with us! 🙏</div>
        </div>

        <div className="pbv-actions">
          <button className="pbv-btn-print" onClick={handlePrint}>🖨️ Print</button>
          <button className="pbv-btn-close" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #f0ebe3' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>✉️ Send bill PDF to email</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailMsg('') }}
              style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleSendEmail}
              disabled={sending || emailSent}
              style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', background: emailSent ? '#065f46' : '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: emailSent ? 'default' : 'pointer', opacity: sending ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {sending ? 'Sending…' : emailSent ? '✅ Sent' : 'Send'}
            </button>
          </div>
          {emailMsg && (
            <div style={{ fontSize: '12px', marginTop: '6px', color: emailMsg.startsWith('✅') ? '#065f46' : '#991b1b' }}>
              {emailMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
