import { useState, useEffect, useCallback } from 'react'
import { getWalkInBills } from '../../api/endpoints'
import { Spinner, EmptyState, PageHeader } from '../../components/UI'

const toAmount = (value) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value) => `Rs.${toAmount(value).toFixed(2)}`

const formatDateTime = (value) => {
  const stamp = value ? new Date(value) : null
  if (!stamp || Number.isNaN(stamp.getTime())) return '-'
  return stamp.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getBillItemCount = (bill) => (bill.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0)

const getBillSubtotal = (bill) => {
  const snapshotSubtotal = toAmount(bill.subtotal_amount)
  if (snapshotSubtotal > 0) return snapshotSubtotal
  return (bill.items || []).reduce((sum, item) => sum + toAmount(item.line_total), 0)
}

function DetailItem({ label, value }) {
  return (
    <div className="ad-order-detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

function WalkInBillCard({ bill, expanded, onToggle }) {
  const items = bill.items || []
  const originalItems = bill.original_items || []
  const itemCount = getBillItemCount(bill)
  const subtotal = getBillSubtotal(bill)
  const total = toAmount(bill.total_amount || subtotal)
  const isExpanded = expanded === String(bill.id)
  const isEdited = Boolean(bill.is_edited || Number(bill.edit_count || 0) > 0 || bill.edited_at)

  return (
    <article className={`ad-card ad-order-card ad-walk-card${isExpanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className="ad-order-summary"
        onClick={() => onToggle(isExpanded ? '' : String(bill.id))}
        aria-expanded={isExpanded}
      >
        <div className="ad-order-summary-main">
          <div className="ad-order-avatar">W</div>
          <div className="ad-order-title-block">
            <div className="ad-order-student-row">
              <span className="ad-order-student">{bill.customer_name || 'Walk-in Customer'}</span>
              <span className="ad-order-muted">{formatDateTime(bill.generated_at)}</span>
            </div>
            <div className="ad-order-ref">Bill No: {bill.bill_number || '-'}</div>
          </div>
        </div>

        <div className="ad-order-summary-meta">
          <span className="ad-order-chip takeaway">Walk-in</span>
          {isEdited && (
            <span className="ad-order-chip" style={{ background: 'rgba(201,168,76,0.16)', color: '#7a4b0a', borderColor: 'rgba(201,168,76,0.3)' }}>
              Edited{Number(bill.edit_count || 0) > 1 ? ` x${bill.edit_count}` : ''}
            </span>
          )}
          <span className="ad-order-chip">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
          <span className="ad-order-total">{formatCurrency(total)}</span>
          <span className="ad-order-toggle">{isExpanded ? 'Hide details' : 'View details'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="ad-order-details ad-walk-details">
          {isEdited && (
            <section className="ad-order-section ad-order-section-wide" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.26)' }}>
              <div className="ad-order-section-head">
                <h3>Edited Bill</h3>
                <span>{Number(bill.edit_count || 0)} save{Number(bill.edit_count || 0) === 1 ? '' : 's'}</span>
              </div>
              <div className="ad-order-detail-grid">
                <DetailItem label="Edited At" value={formatDateTime(bill.edited_at)} />
                <DetailItem label="Edited By" value={bill.edited_by_name || 'Cashier'} />
                <DetailItem label="Original Total" value={formatCurrency(bill.original_total_amount || bill.total_amount)} />
                <DetailItem label="Current Total" value={formatCurrency(bill.total_amount)} />
              </div>
            </section>
          )}

          <section className="ad-order-section ad-order-section-wide">
            <div className="ad-order-section-head">
              <h3>Bill Items</h3>
              <span>{items.length} unique</span>
            </div>

            {items.length === 0 ? (
              <p className="ad-order-empty-note">No items recorded for this bill.</p>
            ) : (
              <div className="ad-order-lines">
                {items.map((item, index) => (
                  <div key={`${bill.id}-${index}`} className="ad-order-line">
                    <div>
                      <div className="ad-order-line-name">{item.name || 'Item'}</div>
                      <div className="ad-order-line-meta">
                        <span>{Number(item.qty || 0)} x {formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                    <div className="ad-order-line-amount">
                      <strong>x{Number(item.qty || 0)}</strong>
                      <span>{formatCurrency(item.line_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>Bill Summary</h3>
            </div>
            <div className="ad-order-detail-grid">
              <DetailItem label="Subtotal" value={formatCurrency(subtotal)} />
              <DetailItem label="Total" value={formatCurrency(total)} />
              <DetailItem label="Total Quantity" value={itemCount} />
            </div>
          </section>

          {isEdited && originalItems.length > 0 && (
            <section className="ad-order-section ad-order-section-wide">
              <div className="ad-order-section-head">
                <h3>Original Snapshot</h3>
                <span>{originalItems.length} unique</span>
              </div>
              <div className="ad-order-lines">
                {originalItems.map((item, index) => (
                  <div key={`original-${bill.id}-${index}`} className="ad-order-line">
                    <div>
                      <div className="ad-order-line-name">{item.name || 'Item'}</div>
                      <div className="ad-order-line-meta">
                        <span>{Number(item.qty || 0)} x {formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                    <div className="ad-order-line-amount">
                      <strong>x{Number(item.qty || 0)}</strong>
                      <span>{formatCurrency(item.line_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>Reference</h3>
            </div>
            <div className="ad-order-detail-grid">
              <DetailItem label="Bill Number" value={bill.bill_number} />
              <DetailItem label="Order Reference" value={bill.order_reference} />
              <DetailItem label="Generated At" value={formatDateTime(bill.generated_at)} />
            </div>
          </section>

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>Customer</h3>
            </div>
            <div className="ad-order-detail-grid">
              <DetailItem label="Customer Name" value={bill.customer_name || 'Walk-in Customer'} />
              <DetailItem label="Cashier" value={bill.cashier_name || 'Not recorded'} />
              <DetailItem label="Source" value="Walk-in sale" />
            </div>
          </section>
        </div>
      )}
    </article>
  )
}

export default function WalkInOrders() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState('')

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getWalkInBills()
      setBills(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const query = search.trim().toLowerCase()
  const displayedBills = query
    ? bills.filter((bill) => {
        const matchesTopLevel = [bill.customer_name, bill.bill_number, bill.order_reference, bill.cashier_name, bill.edited_by_name]
          .some((value) => (value || '').toLowerCase().includes(query))
        const matchesItems = (bill.items || []).some((item) =>
          (item.name || '').toLowerCase().includes(query)
        )
        return matchesTopLevel || matchesItems
      })
    : bills

  const totalAmount = displayedBills.reduce((sum, bill) => sum + toAmount(bill.total_amount), 0)
  const totalItems = displayedBills.reduce((sum, bill) => sum + getBillItemCount(bill), 0)
  const editedBills = displayedBills.filter((bill) => bill.is_edited || Number(bill.edit_count || 0) > 0 || bill.edited_at).length

  return (
    <div>
      <PageHeader
        title="Walk-in Orders"
        action={<button className="ad-order-refresh" onClick={fetchBills}>Refresh</button>}
      />

      <div className="ad-stats-grid ad-walk-stats">
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-value">{displayedBills.length}</p>
          <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>Walk-in Bills</p>
        </div>
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-value">{totalItems}</p>
          <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>Items Sold</p>
        </div>
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-value">{formatCurrency(totalAmount)}</p>
          <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>Displayed Total</p>
        </div>
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-value">{editedBills}</p>
          <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>Edited Bills</p>
        </div>
      </div>

      <div className="ad-walk-search">
        <input
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setExpanded('')
          }}
          placeholder="Search by customer, bill no, order ref, cashier, or item"
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      ) : displayedBills.length === 0 ? (
        <EmptyState message={query ? `No walk-in bills match "${search.trim()}".` : 'No walk-in orders found.'} />
      ) : (
        <div className="ad-order-list">
          {displayedBills.map((bill) => (
            <WalkInBillCard
              key={bill.id}
              bill={bill}
              expanded={expanded}
              onToggle={setExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
