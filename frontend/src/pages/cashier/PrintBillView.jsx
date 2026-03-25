import { useState, useEffect } from 'react'
import { getBillPrint, sendBillEmail } from '../../api/endpoints'
import { Spinner } from '../../components/UI'
import './PrintBillView.css'

export default function PrintBillView({ billId, onClose }) {
  const [bill,       setBill]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [emailSent,   setEmailSent]  = useState(false)
  const [emailMsg,    setEmailMsg]   = useState('')

  useEffect(() => {
    getBillPrint(billId)
      .then(({ data }) => setBill(data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load bill.'))
      .finally(() => setLoading(false))
  }, [billId])

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

  const handlePrint = () => {
    if (!bill) return
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
    .delivery-box { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px;
      padding: 10px 14px; margin-bottom: 18px; }
    .delivery-title { font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #777; margin-bottom: 4px; }
    .delivery-value { font-size: 13px; font-weight: 600; color: #111; line-height: 1.5; }
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
    <div class="copy-label">Delivery Copy</div>
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
    <div>
      <div class="meta-label">Student Name</div>
      <div class="meta-value">${bill.student_name || '—'}</div>
    </div>
    <div>
      <div class="meta-label">Order #</div>
      <div class="meta-value">${bill.order_id || '—'}</div>
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
  <div class="total-row">
    <span class="total-label">TOTAL</span>
    <span class="total-value">Rs.${parseFloat(bill.total_amount).toFixed(2)}</span>
  </div>
  <div class="footer">Thank you for your order! Please hand this copy to the delivery person.</div>
</body>
</html>`)

    win.document.close()
    win.focus()
    win.onload = () => { win.print(); win.close() }
  }

  return (
    <div className="pbv-overlay">
      <div className="pbv-modal">

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
                <div className="pbv-org-name">Cafe Lush</div>
                <div className="pbv-org-sub">Hotel POS &amp; Management System</div>
                <div className="pbv-copy-label">Delivery Copy</div>
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
                <div className="pbv-meta-row">
                  <span className="pbv-meta-label">Student Name</span>
                  <span className="pbv-meta-value">{bill.student_name || '—'}</span>
                </div>
                <div className="pbv-meta-row">
                  <span className="pbv-meta-label">Order #</span>
                  <span className="pbv-meta-value">{bill.order_id || '—'}</span>
                </div>
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
