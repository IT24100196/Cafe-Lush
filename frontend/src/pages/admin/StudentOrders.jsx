import { useState, useEffect, useCallback } from 'react'
import { getOnlineOrders } from '../../api/endpoints'
import { useOrderSocket } from '../../hooks/useOrderSocket'
import { Spinner, EmptyState, PageHeader } from '../../components/UI'

const statusColor = (s) => ({
  pending:   { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  confirmed: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
}[s] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' })

export default function StudentOrders() {
  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [newCount,  setNewCount]  = useState(0)
  const [filter,    setFilter]    = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getOnlineOrders()
      setSessions(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── WebSocket live updates ──────────────────────────────────────────────────
  const handleNewOrder = useCallback((order) => {
    setSessions((prev) => {
      const sid = order.session_id || ''
      if (sid) {
        const existing = prev.find((s) => s.session_id === sid)
        if (existing) {
          if (existing.orders.find((o) => o.id === order.id)) return prev
          return prev.map((s) => s.session_id === sid
            ? { ...s, orders: [...s.orders, order] }
            : s
          )
        }
        setNewCount((c) => c + 1)
        return [{
          session_id: sid, student_name: order.student_name, student_email: order.student_email,
          created_at: order.created_at, delivery_type: order.delivery_type,
          delivery_address: order.delivery_address, phone_number: order.phone_number,
          status: order.status, orders: [order],
        }, ...prev]
      }
      if (prev.find((s) => !s.session_id && s.orders[0]?.id === order.id)) return prev
      setNewCount((c) => c + 1)
      return [{
        session_id: null, student_name: order.student_name, student_email: order.student_email,
        created_at: order.created_at, delivery_type: order.delivery_type,
        delivery_address: order.delivery_address, phone_number: order.phone_number,
        status: order.status, orders: [order],
      }, ...prev]
    })
  }, [])

  const handleOrderUpdated = useCallback((order) => {
    setSessions((prev) => prev.map((s) => ({
      ...s,
      orders: s.orders.map((o) => o.id === order.id ? { ...o, ...order } : o),
      status: s.orders.some((o) => o.id === order.id) ? order.status : s.status,
    })))
  }, [])

  useOrderSocket({ onNewOrder: handleNewOrder, onOrderUpdated: handleOrderUpdated })

  // ── Confirm / Cancel a whole session ───────────────────────────────────────
  // Removed — cashier handles confirm/cancel, admin is read-only

  const displayed = filter ? sessions.filter((s) => s.status === filter) : sessions

  // Stats
  const total     = sessions.length
  const pending   = sessions.filter((s) => s.status === 'pending').length
  const confirmed = sessions.filter((s) => s.status === 'confirmed').length
  const cancelled = sessions.filter((s) => s.status === 'cancelled').length

  return (
    <div>
      <PageHeader title="📋 Student Orders" />

      {/* Live badge */}
      {newCount > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '8px 14px', marginBottom: '16px', fontSize: '13px', color: '#065f46', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          {newCount} new order{newCount > 1 ? 's' : ''} received live
          <button onClick={() => setNewCount(0)} style={{ marginLeft: '8px', fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="ad-stats-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: '16px' }}>
        {[
          { label: 'Total Sessions', value: total     },
          { label: 'Pending',        value: pending   },
          { label: 'Confirmed',      value: confirmed },
          { label: 'Cancelled',      value: cancelled },
        ].map(({ label, value }) => (
          <div key={label} className="ad-stat-card" style={{ textAlign: 'center' }}>
            <p className="ad-stat-value">{value}</p>
            <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['', 'pending', 'confirmed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              border: filter === s ? 'none' : '1.5px solid #e5e7eb',
              background: filter === s ? '#2C1A0E' : '#f9fafb',
              color: filter === s ? '#fff' : '#374151' }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button onClick={fetchOrders} style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Session cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <EmptyState message="No orders match the selected filter." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayed.map((session, idx) => {
            const sc  = statusColor(session.status)
            const key = session.session_id || `single-${idx}`
            return (
              <div key={key} className="ad-card" style={{ padding: '16px 20px', borderLeft: `4px solid ${sc.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>

                  {/* Left: order details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#2C1A0E', marginBottom: '6px' }}>
                      {session.student_name}
                      {session.student_email && (
                        <span style={{ fontWeight: 400, fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>✉ {session.student_email}</span>
                      )}
                    </div>

                    {/* Order lines */}
                    <div style={{ marginBottom: '8px' }}>
                      {session.orders.map((o) => (
                        <div key={o.id} style={{ fontSize: '13px', color: '#4b5563', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px',
                            background: o.order_type === 'item' ? '#ede9fe' : '#fef3c7',
                            color: o.order_type === 'item' ? '#6d28d9' : '#92400e' }}>
                            {o.order_type === 'item' ? '🍽️ Item' : '📦 Package'}
                          </span>
                          <span style={{ fontWeight: 600 }}>{o.package_label || (o.order_type === 'item' ? o.item_name : o.meal_type_name)}</span>
                          <span style={{ color: '#9ca3af' }}>× {o.quantity}</span>
                          {o.order_type !== 'item' && o.order_date && (
                            <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', borderRadius: '4px', padding: '1px 6px' }}>
                              📅 {o.order_date}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Meta */}
                    <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>{session.delivery_type === 'delivery' ? '🚚 Delivery' : '🥡 Takeaway'}</span>
                      {session.delivery_address && <span>📍 {session.delivery_address}</span>}
                      {session.phone_number && <span>📞 {session.phone_number}</span>}
                      <span>🕐 {new Date(session.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Right: status only — actions handled by cashier */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {session.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
