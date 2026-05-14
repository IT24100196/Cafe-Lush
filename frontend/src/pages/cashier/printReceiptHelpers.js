import { finalizeBrowserPrint } from './browserPrint'

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function toAmount(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrency(value) {
  return `Rs.${toAmount(value).toFixed(2)}`
}

export function formatReceiptDate(value) {
  const stamp = value ? new Date(value) : null
  if (!stamp || Number.isNaN(stamp.getTime())) return '-'
  return stamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function buildReceiptViewModel(bill, options = {}) {
  const items = Array.isArray(bill?.items) ? bill.items : []
  const subtotal = toAmount(bill?.subtotal_amount)
  const deliveryFee = toAmount(bill?.delivery_fee)
  const total = toAmount(bill?.total_amount || subtotal + deliveryFee)
  const itemCount = items.reduce((sum, line) => sum + Number(line?.qty ?? line?.quantity ?? 0), 0)

  return {
    ...bill,
    items,
    subtotal_amount: subtotal,
    delivery_fee: deliveryFee,
    total_amount: total,
    item_count: itemCount,
    source_label: options.sourceLabel || (bill?.source === 'walk_in' ? 'Walk-in Bill' : 'Online Order Bill'),
    customer_label: options.customerLabel || (bill?.source === 'walk_in' ? 'Customer' : 'Student'),
    customer_value: options.customerValue || bill?.customer_name || bill?.student_name || '',
  }
}

export const RECEIPT_PRINT_CSS = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: "Courier New", Consolas, monospace;
  }
  body {
    padding: 0;
  }
  .receipt-page {
    width: 76mm;
    margin: 0 auto;
    padding: 2mm;
    background: #fff;
  }
  .receipt-card {
    background: #fff;
    border: none;
    border-radius: 0;
    overflow: visible;
    box-shadow: none;
  }
  .receipt-content {
    padding: 0;
  }
  .receipt-brand {
    text-align: center;
    padding-bottom: 6px;
    border-bottom: 1px dashed #000;
  }
  .receipt-logo {
    width: auto;
    max-width: 24mm;
    max-height: 10mm;
    object-fit: cover;
    margin: 0 auto 3px;
    display: block;
    filter: grayscale(1) contrast(2);
    image-rendering: crisp-edges;
  }
  .receipt-name {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .receipt-tagline {
    margin-top: 1px;
    font-size: 10px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #000;
  }
  .receipt-chip {
    display: inline-block;
    margin-top: 4px;
    padding: 1px 4px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #000;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .receipt-meta {
    padding: 7px 0 8px;
    border-bottom: 1px dashed #000;
  }
  .receipt-meta-block {
    padding: 0 0 5px;
  }
  .receipt-meta-block:last-child {
    padding-bottom: 0;
  }
  .receipt-label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #000;
    margin-bottom: 1px;
    font-weight: 700;
  }
  .receipt-value {
    display: block;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
    text-align: left;
  }
  .receipt-note {
    padding-top: 7px;
    border-bottom: 1px dashed #000;
    margin-bottom: 6px;
  }
  .receipt-items-title {
    padding: 6px 0 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .receipt-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }
  .receipt-table th {
    padding: 4px 0;
    text-align: left;
    font-size: 10px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #000;
    border-bottom: 1px solid #000;
  }
  .receipt-table th:nth-child(2),
  .receipt-table td:nth-child(2) {
    text-align: center;
    width: 10mm;
  }
  .receipt-table th:last-child,
  .receipt-table td:last-child {
    text-align: right;
    width: 16mm;
  }
  .receipt-table td {
    padding: 5px 0;
    border-bottom: 1px dotted #000;
    font-size: 11px;
    vertical-align: top;
  }
  .receipt-item-name {
    font-weight: 700;
    line-height: 1.25;
  }
  .receipt-item-meta {
    margin-top: 2px;
    font-size: 10px;
    color: #000;
  }
  .receipt-item-total {
    font-weight: 700;
    white-space: nowrap;
  }
  .receipt-summary {
    margin-top: 7px;
    margin-left: auto;
    width: 100%;
  }
  .receipt-summary-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 3px 0;
    font-size: 12px;
    color: #000;
  }
  .receipt-summary-row.total {
    margin-top: 3px;
    padding-top: 5px;
    border-top: 2px solid #000;
    color: #000;
    font-size: 14px;
    font-weight: 800;
  }
  .receipt-footer {
    margin-top: 7px;
    padding-top: 6px;
    border-top: 1px dashed #000;
    text-align: center;
    color: #000;
    font-size: 10px;
    line-height: 1.3;
  }
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      background: #fff;
    }
    body {
      padding: 0;
    }
    .receipt-page {
      width: 76mm;
      margin: 0;
      padding: 2mm;
    }
    .receipt-card {
      border: none;
      border-radius: 0;
      box-shadow: none;
    }
    .receipt-content {
      padding: 0;
    }
  }
`

export const RECEIPT_PRINT_WINDOW_FEATURES = 'width=900,height=700'

export function openReceiptPrintWindow(options = {}) {
  const printWindow = window.open('', '_blank', options.features || RECEIPT_PRINT_WINDOW_FEATURES)
  if (!printWindow) return null

  const title = escapeHtml(options.loadingTitle || 'Preparing receipt')
  const message = escapeHtml(options.loadingMessage || 'Preparing the receipt for printing...')

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          html, body {
            margin: 0;
            min-height: 100%;
            font-family: Georgia, "Times New Roman", serif;
            background: #f5efe6;
            color: #221711;
          }
          body {
            display: grid;
            place-items: center;
            padding: 24px;
          }
          .receipt-loading {
            width: min(100%, 420px);
            padding: 28px 24px;
            border: 1px solid #e5d8c7;
            border-radius: 18px;
            background: #fffdf9;
            box-shadow: 0 18px 48px rgba(34, 23, 17, 0.12);
            text-align: center;
          }
          .receipt-loading-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .receipt-loading-text {
            font-size: 14px;
            line-height: 1.6;
            color: #6b5b50;
          }
        </style>
      </head>
      <body>
        <div class="receipt-loading">
          <div class="receipt-loading-title">${title}</div>
          <div class="receipt-loading-text">${message}</div>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()

  return printWindow
}

export function buildReceiptHtml(bill, options = {}) {
  const model = buildReceiptViewModel(bill, options)
  const hasDeliveryNote = Boolean(model.delivery_type || model.delivery_address || model.phone_number)

  const metaBlocks = [
    { label: 'Bill Number', value: model.bill_number || '-' },
    { label: 'Generated', value: formatReceiptDate(model.generated_at) },
    { label: 'Order Reference', value: model.order_reference || '-' },
    { label: model.customer_label, value: model.customer_value || 'Walk-in customer' },
    { label: 'Cashier', value: model.cashier_name || 'Cashier' },
    { label: 'Items', value: `${model.item_count} item${model.item_count === 1 ? '' : 's'}` },
  ]

  const noteBlocks = [
    model.delivery_type
      ? { label: 'Delivery Type', value: String(model.delivery_type).replace(/^./, (char) => char.toUpperCase()) }
      : null,
    model.delivery_address ? { label: 'Address', value: model.delivery_address } : null,
    model.phone_number ? { label: 'Phone', value: model.phone_number } : null,
  ].filter(Boolean)

  const itemRows = model.items.map((line, index) => {
    const qty = Number(line?.qty ?? line?.quantity ?? 0)
    const unitPrice = toAmount(line?.unit_price)
    const lineTotal = toAmount(line?.line_total ?? qty * unitPrice)

    return `
      <tr>
        <td>
          <div class="receipt-item-name">${escapeHtml(line?.name || `Item ${index + 1}`)}</div>
          <div class="receipt-item-meta">${escapeHtml(formatCurrency(unitPrice))} each</div>
        </td>
        <td>${escapeHtml(qty)}</td>
        <td><span class="receipt-item-total">${escapeHtml(formatCurrency(lineTotal))}</span></td>
      </tr>
    `
  }).join('')

  return `
    <div class="receipt-page">
      <div class="receipt-card">
        <div class="receipt-content">
          <div class="receipt-brand">
            <img class="receipt-logo" src="/image/image6.jpeg" alt="Cafe Lush logo" />
            <div class="receipt-name">Cafe Lush</div>
            <div class="receipt-tagline">Thermal Receipt</div>
            <div class="receipt-chip">${escapeHtml(model.source_label)}</div>
          </div>

          <div class="receipt-meta">
            ${metaBlocks.map((block) => `
              <div class="receipt-meta-block">
                <span class="receipt-label">${escapeHtml(block.label)}</span>
                <span class="receipt-value">${escapeHtml(block.value)}</span>
              </div>
            `).join('')}
          </div>

          ${hasDeliveryNote ? `
            <div class="receipt-note">
              ${noteBlocks.map((block) => `
                <div class="receipt-meta-block">
                  <span class="receipt-label">${escapeHtml(block.label)}</span>
                  <span class="receipt-value">${escapeHtml(block.value)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="receipt-items-title">Items</div>
          <table class="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows || `
                <tr>
                  <td><div class="receipt-item-name">No items</div></td>
                  <td>0</td>
                  <td>${escapeHtml(formatCurrency(0))}</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="receipt-summary">
            <div class="receipt-summary-row">
              <span>Subtotal</span>
              <span>${escapeHtml(formatCurrency(model.subtotal_amount))}</span>
            </div>
            ${model.delivery_fee > 0 ? `
              <div class="receipt-summary-row">
                <span>Delivery fee</span>
                <span>${escapeHtml(formatCurrency(model.delivery_fee))}</span>
              </div>
            ` : ''}
            <div class="receipt-summary-row total">
              <span>Total</span>
              <span>${escapeHtml(formatCurrency(model.total_amount))}</span>
            </div>
          </div>

          <div class="receipt-footer">
            Thank you for choosing Cafe Lush
          </div>
        </div>
      </div>
    </div>
  `
}

export async function printReceiptDocument(bill, options = {}) {
  const printWindow = options.windowRef && !options.windowRef.closed
    ? options.windowRef
    : window.open('', '_blank', RECEIPT_PRINT_WINDOW_FEATURES)
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups and try printing again.')
  }

  const title = escapeHtml(options.title || bill?.bill_number || 'Receipt')
  const html = buildReceiptHtml(bill, options)

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>${RECEIPT_PRINT_CSS}</style>
      </head>
      <body>${html}</body>
    </html>
  `)
  printWindow.document.close()

  await finalizeBrowserPrint(printWindow)
}
