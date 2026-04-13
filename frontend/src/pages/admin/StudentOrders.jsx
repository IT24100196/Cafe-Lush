import { useState, useEffect, useCallback } from 'react'
import { getOnlineOrders } from '../../api/endpoints'
import { useOrderSocket } from '../../hooks/useOrderSocket'
import { Spinner, EmptyState, PageHeader } from '../../components/UI'

const statusColor = (status) => ({
  pending:   { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  confirmed: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
  completed: { bg: '#eef2ff', color: '#3730a3', border: '#a5b4fc' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
}[status] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' })

const formatMoney = (value) => `Rs.${Number(value || 0).toFixed(2)}`

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

const getSessionKey = (session, index) => session.session_id || `single-${session.orders?.[0]?.id || index}`

const getOrderLabel = (order) => order.package_label || (order.order_type === 'item' ? order.item_name : order.meal_type_name) || 'Order item'

const getOrderUnitPrice = (order) => Number(order.unit_price ?? order.price ?? 0)

const getOrderLineTotal = (order) => {
  const direct = Number(order.line_total ?? order.total_amount)
  if (Number.isFinite(direct) && direct > 0) return direct
  return getOrderUnitPrice(order) * Number(order.quantity || 1)
}

const getSessionTotals = (session) => {
  const orders = session.orders || []
  const quantity = orders.reduce((sum, order) => sum + Number(order.quantity || 1), 0)
  const subtotal = orders.reduce((sum, order) => sum + getOrderLineTotal(order), 0)
  const deliveryFee = session.delivery_type === 'delivery' ? Number(session.delivery_fee || 0) : 0

  return {
    uniqueItems: orders.length,
    quantity,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  }
}

const getOrderEvidence = (session) => {
  const evidenceFields = [
    'payment_evidence',
    'payment_evidence_url',
    'attachment',
    'attachment_url',
    'receipt_url',
    'proof_url',
    'evidence_url',
  ]

  return (session.orders || []).flatMap((order) => evidenceFields
    .map((field) => order[field])
    .filter(Boolean)
    .map((url) => ({ id: `${order.id}-${url}`, url, label: getOrderLabel(order) }))
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="ad-order-detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

function StudentOrderCard({ session, index, expanded, onToggle }) {
  const sc = statusColor(session.status)
  const key = getSessionKey(session, index)
  const totals = getSessionTotals(session)
  const evidence = getOrderEvidence(session)
  const orderRef = session.order_reference || session.orders?.[0]?.order_reference || '-'
  const billNumber = session.bill_number || session.orders?.find((order) => order.bill_number)?.bill_number || ''
  const deliveryLabel = session.delivery_type === 'delivery' ? 'Delivery' : 'Takeaway'
  const isExpanded = expanded === key

  return (
    <article className={`ad-card ad-order-card${isExpanded ? ' expanded' : ''}`} style={{ borderLeftColor: sc.border }}>
      <button
        type="button"
        className="ad-order-summary"
        onClick={() => onToggle(isExpanded ? '' : key)}
        aria-expanded={isExpanded}
      >
        <div className="ad-order-summary-main">
          <div className="ad-order-avatar">{(session.student_name || 'S').charAt(0).toUpperCase()}</div>
          <div className="ad-order-title-block">
            <div className="ad-order-student-row">
              <span className="ad-order-student">{session.student_name || 'Student'}</span>
              <span className="ad-order-muted">{formatDateTime(session.created_at)}</span>
            </div>
            <div className="ad-order-ref">Order Ref: {orderRef}</div>
          </div>
        </div>

        <div className="ad-order-summary-meta">
          <span className={`ad-order-chip ${session.delivery_type === 'delivery' ? 'delivery' : 'takeaway'}`}>{deliveryLabel}</span>
          <span className="ad-order-chip">{totals.quantity} item{totals.quantity === 1 ? '' : 's'}</span>
          <span className="ad-order-total">{formatMoney(totals.total)}</span>
          <span className="ad-order-status" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>{session.status}</span>
          <span className="ad-order-toggle">{isExpanded ? 'Hide details' : 'View details'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="ad-order-details">
          <section className="ad-order-section ad-order-section-wide">
            <div className="ad-order-section-head">
              <h3>Order Items</h3>
              <span>{totals.uniqueItems} unique</span>
            </div>
            <div className="ad-order-lines">
              {session.orders.map((order) => (
                <div key={order.id} className="ad-order-line">
                  <div>
                    <div className="ad-order-line-name">{getOrderLabel(order)}</div>
                    <div className="ad-order-line-meta">
                      <span className={`ad-order-type ${order.order_type === 'item' ? 'item' : 'package'}`}>
                        {order.order_type === 'item' ? 'Menu item' : 'Meal package'}
                      </span>
                      {order.order_type !== 'item' && order.order_date && <span>{order.order_date}</span>}
                      {order.preference && <span>{order.preference}</span>}
                    </div>
                  </div>
                  <div className="ad-order-line-amount">
                    <strong>x{order.quantity || 1}</strong>
                    <span>{formatMoney(getOrderLineTotal(order))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>Student</h3>
            </div>
            <div className="ad-order-detail-grid">
              <DetailItem label="Name" value={session.student_name} />
              <DetailItem label="Email" value={session.student_email} />
              <DetailItem label="Phone" value={session.phone_number} />
            </div>
          </section>

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>{deliveryLabel} Details</h3>
            </div>
            <div className="ad-order-detail-grid">
              <DetailItem label="Method" value={deliveryLabel} />
              <DetailItem label="Address / Pickup" value={session.delivery_type === 'delivery' ? session.delivery_address : 'Pickup from Cafe Lush'} />
              <DetailItem label="Delivery Fee" value={session.delivery_type === 'delivery' ? formatMoney(totals.deliveryFee) : 'No delivery fee'} />
            </div>
          </section>

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>Billing</h3>
            </div>
            <div className="ad-order-detail-grid">
              <DetailItem label="Order Ref" value={orderRef} />
              <DetailItem label="Bill No" value={billNumber || 'Not generated yet'} />
              <DetailItem label="Cashier" value={session.cashier_name || (billNumber ? 'Not recorded' : 'Not generated yet')} />
              <DetailItem label="Subtotal" value={formatMoney(totals.subtotal)} />
              <DetailItem label="Total" value={formatMoney(totals.total)} />
            </div>
          </section>

          <section className="ad-order-section">
            <div className="ad-order-section-head">
              <h3>Attachment Evidence</h3>
              <span>Preview hidden</span>
            </div>
            {evidence.length > 0 ? (
              <div className="ad-order-evidence-list">
                {evidence.map((file) => (
                  <a key={file.id} className="ad-order-evidence-link" href={file.url} target="_blank" rel="noreferrer">
                    Open evidence for {file.label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="ad-order-empty-note">No attachment evidence is recorded for this order.</p>
            )}
          </section>
        </div>
      )}
    </article>
  )
}

export default function StudentOrders() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getOnlineOrders()
      setSessions(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleNewOrder = useCallback((order) => {
    setSessions((prev) => {
      const sid = order.session_id || ''
      if (sid) {
        const existing = prev.find((session) => session.session_id === sid)
        if (existing) {
          if (existing.orders.find((existingOrder) => existingOrder.id === order.id)) return prev
          return prev.map((session) => session.session_id === sid
            ? {
              ...session,
              order_reference: session.order_reference || order.order_reference || '-',
              bill_number: session.bill_number || order.bill_number || '',
              cashier_name: session.cashier_name || order.cashier_name || '',
              delivery_fee: session.delivery_fee ?? order.delivery_fee ?? '0.00',
              orders: [...session.orders, order],
            }
            : session
          )
        }

        setNewCount((count) => count + 1)
        return [{
          session_id: sid,
          student_name: order.student_name,
          student_email: order.student_email,
          order_reference: order.order_reference || '-',
          bill_number: order.bill_number || '',
          cashier_name: order.cashier_name || '',
          created_at: order.created_at,
          delivery_type: order.delivery_type,
          delivery_address: order.delivery_address,
          delivery_fee: order.delivery_fee ?? '0.00',
          phone_number: order.phone_number,
          status: order.status,
          orders: [order],
        }, ...prev]
      }

      if (prev.find((session) => !session.session_id && session.orders[0]?.id === order.id)) return prev
      setNewCount((count) => count + 1)
      return [{
        session_id: null,
        student_name: order.student_name,
        student_email: order.student_email,
        order_reference: order.order_reference || '-',
        bill_number: order.bill_number || '',
        cashier_name: order.cashier_name || '',
        created_at: order.created_at,
        delivery_type: order.delivery_type,
        delivery_address: order.delivery_address,
        delivery_fee: order.delivery_fee ?? '0.00',
        phone_number: order.phone_number,
        status: order.status,
        orders: [order],
      }, ...prev]
    })
  }, [])

  const handleOrderUpdated = useCallback((order) => {
    setSessions((prev) => prev.map((session) => ({
      ...session,
      order_reference: session.order_reference || order.order_reference || '-',
      bill_number: session.bill_number || order.bill_number || '',
      cashier_name: session.cashier_name || order.cashier_name || '',
      delivery_fee: session.orders.some((existingOrder) => existingOrder.id === order.id)
        ? (order.delivery_fee ?? session.delivery_fee ?? '0.00')
        : session.delivery_fee,
      orders: session.orders.map((existingOrder) => existingOrder.id === order.id ? { ...existingOrder, ...order } : existingOrder),
      status: session.orders.some((existingOrder) => existingOrder.id === order.id) ? order.status : session.status,
    })))
  }, [])

  useOrderSocket({ onNewOrder: handleNewOrder, onOrderUpdated: handleOrderUpdated })

  const displayed = filter ? sessions.filter((session) => session.status === filter) : sessions
  const total = sessions.length
  const pending = sessions.filter((session) => session.status === 'pending').length
  const confirmed = sessions.filter((session) => session.status === 'confirmed').length
  const completed = sessions.filter((session) => session.status === 'completed').length
  const cancelled = sessions.filter((session) => session.status === 'cancelled').length

  return (
    <div>
      <PageHeader title="Student Orders" />

      {newCount > 0 && (
        <div className="ad-order-live-badge">
          <span />
          {newCount} new order{newCount > 1 ? 's' : ''} received live
          <button onClick={() => setNewCount(0)}>dismiss</button>
        </div>
      )}

      <div className="ad-stats-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginBottom: '16px' }}>
        {[
          { label: 'Total Sessions', value: total },
          { label: 'Pending', value: pending },
          { label: 'Confirmed', value: confirmed },
          { label: 'Completed', value: completed },
          { label: 'Cancelled', value: cancelled },
        ].map(({ label, value }) => (
          <div key={label} className="ad-stat-card" style={{ textAlign: 'center' }}>
            <p className="ad-stat-value">{value}</p>
            <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="ad-order-toolbar">
        <div className="ad-order-filter-pills">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status || 'all'}
              onClick={() => {
                setFilter(status)
                setExpanded('')
              }}
              className={filter === status ? 'active' : ''}
            >
              {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <button className="ad-order-refresh" onClick={fetchOrders}>Refresh</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <EmptyState message="No orders match the selected filter." />
      ) : (
        <div className="ad-order-list">
          {displayed.map((session, index) => (
            <StudentOrderCard
              key={getSessionKey(session, index)}
              session={session}
              index={index}
              expanded={expanded}
              onToggle={setExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
