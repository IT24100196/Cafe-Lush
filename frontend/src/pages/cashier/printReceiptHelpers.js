export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function formatReceiptDate(value) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const KITCHEN_RECEIPT_CSS = `
  .print-stack {
    width: 80mm;
    margin: 0 auto;
    background: #fff;
  }
  .kitchen-receipt {
    width: 76mm;
    margin: 3mm auto 0;
    padding: 3mm 2mm 4mm;
    border-top: 1px dashed #111;
    font-family: "Courier New", Consolas, monospace;
    font-size: 11px;
    line-height: 1.25;
    color: #000;
    background: #fff;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .kitchen-title {
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .kitchen-line {
    border-top: 1px dashed #111;
    margin: 5px 0;
  }
  .kitchen-meta {
    display: grid;
    gap: 2px;
  }
  .kitchen-meta-row {
    display: grid;
    grid-template-columns: 17mm 1fr;
    gap: 2mm;
  }
  .kitchen-label {
    font-weight: 700;
  }
  .kitchen-items-title {
    font-weight: 700;
    margin-bottom: 3px;
  }
  .kitchen-item {
    display: grid;
    grid-template-columns: 13mm 1fr;
    gap: 2mm;
    margin: 2px 0;
    font-size: 12px;
    font-weight: 700;
  }
`

export function buildKitchenReceiptHtml(bill, {
  orderTypeLabel = '',
  customerLabel = 'CUSTOMER',
  customerValue = '',
} = {}) {
  const type = orderTypeLabel || (bill?.source === 'walk_in' ? 'WALK-IN' : 'ONLINE')
  const method = bill?.delivery_type ? String(bill.delivery_type).toUpperCase() : ''
  const person = customerValue || bill?.customer_name || bill?.student_name || ''
  const items = Array.isArray(bill?.items) ? bill.items : []

  const itemRows = items.map((line) => {
    const qty = line?.qty ?? line?.quantity ?? 0
    return `
      <div class="kitchen-item">
        <span>${escapeHtml(qty)} x</span>
        <span>${escapeHtml(line?.name || 'Item')}</span>
      </div>`
  }).join('')

  return `
    <div class="kitchen-receipt">
      <div class="kitchen-title">KITCHEN</div>
      <div class="kitchen-meta">
        <div class="kitchen-meta-row"><span class="kitchen-label">BILL</span><span>${escapeHtml(bill?.bill_number || '-')}</span></div>
        ${bill?.order_reference ? `<div class="kitchen-meta-row"><span class="kitchen-label">ORDER</span><span>${escapeHtml(bill.order_reference)}</span></div>` : ''}
        <div class="kitchen-meta-row"><span class="kitchen-label">TYPE</span><span>${escapeHtml(type)}</span></div>
        ${method ? `<div class="kitchen-meta-row"><span class="kitchen-label">METHOD</span><span>${escapeHtml(method)}</span></div>` : ''}
        <div class="kitchen-meta-row"><span class="kitchen-label">TIME</span><span>${escapeHtml(formatReceiptDate(bill?.generated_at))}</span></div>
        ${person ? `<div class="kitchen-meta-row"><span class="kitchen-label">${escapeHtml(customerLabel)}</span><span>${escapeHtml(person)}</span></div>` : ''}
      </div>
      <div class="kitchen-line"></div>
      <div class="kitchen-items-title">ITEMS</div>
      ${itemRows || '<div class="kitchen-item"><span>0 x</span><span>No items</span></div>'}
    </div>`
}
