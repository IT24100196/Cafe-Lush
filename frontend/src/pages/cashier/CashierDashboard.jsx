import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getDailySummary, getPosOrders, getOnlineOrders, generateOnlineBill, generateWalkInBill, getWalkInBills, getItems, getCategories, updateOrderStatus } from '../../api/endpoints'
import { Spinner, EmptyState } from '../../components/UI'
import { useOrderSocket } from '../../hooks/useOrderSocket'
import { useReactToPrint } from 'react-to-print'
import PrintBillView from './PrintBillView'
import PrintWalkinBill from './PrintWalkinBill'
import './CashierDashboard.css'

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '360px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗑️</div>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#2C1A0E', marginBottom: '8px' }}>Clear Confirmation</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>{message}</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '8px 22px', borderRadius: '7px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 22px', borderRadius: '7px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Yes, Clear</button>
        </div>
      </div>
    </div>
  )
}

// ── Per-bill printable receipt (Bill History tab) ────────────────────────────
function BillReceipt({ order, innerRef }) {
  return (
    <div ref={innerRef} style={{ padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: '#2C1A0E' }}>Cafe Lush</div>
        <div style={{ fontSize: '11px', color: '#4A7C45', marginTop: '4px' }}>Official Receipt</div>
        {order.bill_id && <div style={{ fontSize: '11px', color: '#4A7C45', marginTop: '2px', fontWeight: 700 }}>{order.bill_id}</div>}
        <div style={{ fontSize: '11px', color: '#4A7C45', marginTop: '2px' }}>{new Date(order.created_at).toLocaleString()}</div>
        {order.cashier_name && <div style={{ fontSize: '11px', color: '#4A7C45' }}>Cashier: {order.cashier_name}</div>}
      </div>
      <div style={{ borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600, fontSize: '11px' }}>
          <span>ITEM</span><span>AMOUNT</span>
        </div>
        {order.order_items?.map((line) => (
          <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{line.item_name}</div>
              <div style={{ fontSize: '10px', color: '#4A7C45' }}>Rs.{parseFloat(line.unit_price).toFixed(2)} × {line.quantity}</div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Rs.{parseFloat(line.line_total).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px dashed #ccc', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#3D6B38' }}>TOTAL</span>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#C9A84C' }}>Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#4A7C45', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
        Thank you for dining with us! 🙏
      </div>
    </div>
  )
}

// ── Bill History Panel ────────────────────────────────────────────────────────
function BillHistoryPanel({ historyDate, setHistoryDate, orders, loadingOrders, summary, onClear }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [search, setSearch] = useState('')

  const totalBills = summary?.total_orders ?? orders.length
  const totalSales = parseFloat(summary?.total_sales ?? orders.reduce((s, o) => s + parseFloat(o.total_amount), 0)).toFixed(2)

  const filteredOrders = search.trim()
    ? orders.filter((o) => (o.bill_id || '').toLowerCase().includes(search.trim().toLowerCase()))
    : orders

  return (
    <div className="cd-history-col cd-panel-anim">
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to clear the billing history? This won't affect the database."
          onConfirm={() => { setShowConfirm(false); onClear() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="cd-history-topbar">
        <div>
          <div className="cd-history-heading">Bill History</div>
          <div className="cd-history-subheading">
            {new Date(historyDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="cd-btn-clear" onClick={() => setShowConfirm(true)}>Clear</button>
          <input
            type="date"
            className="cd-history-date-input"
            value={historyDate}
            onChange={(e) => setHistoryDate(e.target.value)}
          />
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 0 12px 0' }}>
        <input
          type="text"
          placeholder="Search by Bill ID (e.g. BILL-20250101-0001)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '9px 14px',
            borderRadius: '8px', border: '1.5px solid #e5e7eb',
            fontSize: '13px', outline: 'none', background: '#f9fafb',
            fontFamily: 'inherit', color: '#2C1A0E',
          }}
        />
      </div>

      <div className="cd-history-summary">
        <div className="cd-history-summary-box">
          <div className="cd-history-summary-val">{totalBills}</div>
          <div className="cd-history-summary-label">Bills Today</div>
        </div>
        <div className="cd-history-summary-box">
          <div className="cd-history-summary-val gold">Rs.{totalSales}</div>
          <div className="cd-history-summary-label">Total Income</div>
        </div>
      </div>

      {loadingOrders ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="cd-history-empty">
          <div className="cd-history-empty-icon">📋</div>
          {search.trim() ? `No bill found for "${search.trim()}".` : 'No bills found for this date.'}
        </div>
      ) : (
        <div className="cd-history-list">
          {filteredOrders.map((order) => (
            <HistoryRow key={order.id} order={order} billNum={orders.length - orders.indexOf(order)} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryRow({ order, billNum }) {
  const [expanded, setExpanded] = useState(false)
  const printRef = useRef()
  const handlePrint = useReactToPrint({ contentRef: printRef })

  const createdAt = new Date(order.created_at)
  const dateStr = createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const billLabel = order.bill_id || `Bill #${String(billNum).padStart(3, '0')}`
  const lineTotal = (line) => parseFloat(line.line_total ?? line.unit_price * line.quantity).toFixed(2)

  return (
    <div className={`cd-hbill-card${expanded ? ' expanded' : ''}`}>
      <button className="cd-hbill-header" onClick={() => setExpanded((v) => !v)}>
        <div className="cd-hbill-header-left">
          <span className="cd-hbill-num">{billLabel}</span>
          <span className="cd-hbill-time">{dateStr} — {timeStr}</span>
        </div>
        <div className="cd-hbill-header-right">
          <span className="cd-hbill-total">Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
          <span className="cd-hbill-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="cd-hbill-body">
          <div className="cd-hbill-items">
            {order.order_items?.map((line) => (
              <div key={line.id} className="cd-hbill-item-row">
                <span className="cd-hbill-item-name">
                  {line.item_name} <span className="cd-hbill-item-qty">× {line.quantity}</span>
                </span>
                <span className="cd-hbill-item-price">Rs.{lineTotal(line)}</span>
              </div>
            ))}
          </div>
          <div className="cd-hbill-divider" />
          <div className="cd-hbill-subtotal-row">
            <span>Subtotal</span>
            <span>Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          <div className="cd-hbill-total-row">
            <span className="cd-hbill-total-label">TOTAL</span>
            <span className="cd-hbill-total-val">Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          <div className="cd-hbill-footer">
            {order.cashier_name && <span className="cd-hbill-cashier">Cashier: {order.cashier_name}</span>}
            <button className="cd-hbill-print-btn" onClick={handlePrint}>🖨️ Print Receipt</button>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <BillReceipt order={order} innerRef={printRef} />
      </div>
    </div>
  )
}

// ── Online Orders Panel ──────────────────────────────────────────────────────
const HIDDEN_KEY = 'onlineOrders_hidden'
const getHidden  = () => { try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')) } catch { return new Set() } }
const saveHidden = (set) => localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]))

function OnlineOrdersPanel({ orders, setOrders, newBadge, setNewBadge }) {
  const [loading,      setLoading]      = useState(true)
  const [generating,   setGenerating]   = useState(null)
  const [confirming,   setConfirming]   = useState(null)
  const [cancelling,   setCancelling]   = useState(null)
  const [printBillId,  setPrintBillId]  = useState(null)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [hiddenKeys,   setHiddenKeys]   = useState(getHidden)

  const sessionKey = (s) => s.session_id || `single-${s.orders[0]?.id}`

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await getOnlineOrders()
      setOrders(data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [setOrders])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Confirm all orders in a session → sends notification to student
  const handleConfirm = async (session) => {
    const key = session.session_id || session.orders[0]?.id
    setConfirming(key)
    try {
      await Promise.all(session.orders.map((o) => updateOrderStatus(o.id, 'confirmed')))
      setOrders((prev) => prev.map((s) => {
        if ((session.session_id && s.session_id === session.session_id) || s === session) {
          return { ...s, status: 'confirmed', orders: s.orders.map((o) => ({ ...o, status: 'confirmed' })) }
        }
        return s
      }))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm order.')
    } finally { setConfirming(null) }
  }

  // Cancel all orders in a session
  const handleCancel = async (session) => {
    const key = session.session_id || session.orders[0]?.id
    setCancelling(key)
    try {
      await Promise.all(session.orders.map((o) => updateOrderStatus(o.id, 'cancelled')))
      setOrders((prev) => prev.map((s) => {
        if ((session.session_id && s.session_id === session.session_id) || s === session) {
          return { ...s, status: 'cancelled', orders: s.orders.map((o) => ({ ...o, status: 'cancelled' })) }
        }
        return s
      }))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel order.')
    } finally { setCancelling(null) }
  }

  // Generate bill (only for confirmed sessions)
  const handleGenerateBill = async (session) => {
    const firstOrderId = session.orders[0]?.id
    if (!firstOrderId) return
    setGenerating(session.session_id || firstOrderId)
    try {
      const { data } = await generateOnlineBill(firstOrderId)
      setPrintBillId(data.id)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate bill.')
    } finally { setGenerating(null) }
  }

  const statusColor = (s) => ({
    pending:   { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
    confirmed: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
    cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  }[s] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' })

  return (
    <div className="cd-history-col cd-panel-anim">
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to clear the online orders? This won't affect the database."
          onConfirm={() => {
            setShowConfirm(false)
            const next = new Set(hiddenKeys)
            orders.forEach((s) => next.add(sessionKey(s)))
            saveHidden(next)
            setHiddenKeys(next)
            setNewBadge(0)
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="cd-history-topbar">
        <div>
          <div className="cd-history-heading">Online Orders</div>
          <div className="cd-history-subheading">Live student orders — generate bill to confirm</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {newBadge > 0 && (
            <span
              style={{ background: '#ef4444', color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setNewBadge(0)}
            >
              {newBadge} new
            </span>
          )}
          <button className="cd-btn-clear" onClick={() => setShowConfirm(true)}>Clear</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
      ) : orders.filter((s) => !hiddenKeys.has(sessionKey(s))).length === 0 ? (
        <div className="cd-history-empty">
          <div className="cd-history-empty-icon">📭</div>
          No online orders yet.
        </div>
      ) : (
        <div className="cd-history-list">
          {orders.filter((s) => !hiddenKeys.has(sessionKey(s))).map((session, idx) => {
            const sc       = statusColor(session.status)
            const key      = session.session_id || `single-${idx}`
            const genKey   = session.session_id || session.orders[0]?.id
            return (
              <div key={key} className="cd-hbill-card" style={{ borderLeft: `3px solid ${sc.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--espresso)', marginBottom: '4px' }}>
                      {session.student_name}
                    </div>
                    {/* List all order lines */}
                    {session.orders.map((o) => (
                      <div key={o.id} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--espresso)' }}>
                          {o.package_label || (o.order_type === 'item' ? o.item_name : o.meal_type_name)}
                        </span>
                        {' × '}{o.quantity}
                        {o.order_type !== 'item' && o.order_date && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', background: '#f3f4f6', borderRadius: '4px', padding: '1px 5px', color: '#6b7280' }}>
                            📅 {o.order_date}
                          </span>
                        )}
                        <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.6 }}>
                          ({o.order_type === 'item' ? 'Menu Item' : 'Package'})
                        </span>
                      </div>
                    ))}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {session.delivery_type === 'delivery' ? '🚚 Delivery' : '🥡 Takeaway'} &nbsp;·&nbsp;
                      {new Date(session.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {session.student_email && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>✉ {session.student_email}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {session.status}
                    </span>
                    {session.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          onClick={() => handleConfirm(session)}
                          disabled={confirming === genKey || cancelling === genKey}
                          style={{ background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: (confirming === genKey || cancelling === genKey) ? 0.6 : 1 }}
                        >
                          {confirming === genKey ? '…' : '✅ Confirm'}
                        </button>
                        <button
                          onClick={() => handleCancel(session)}
                          disabled={confirming === genKey || cancelling === genKey}
                          style={{ background: '#fef2f2', color: '#991b1b', border: '1.5px solid #fca5a5', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: (confirming === genKey || cancelling === genKey) ? 0.6 : 1 }}
                        >
                          {cancelling === genKey ? '…' : '✕ Reject'}
                        </button>
                      </div>
                    )}
                    {session.status === 'confirmed' && (
                      <button
                        onClick={() => handleGenerateBill(session)}
                        disabled={generating === genKey}
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #93c5fd', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: generating === genKey ? 0.6 : 1 }}
                      >
                        {generating === genKey ? '…' : '🧾 Generate Bill'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {printBillId && (
        <PrintBillView billId={printBillId} onClose={() => setPrintBillId(null)} />
      )}
    </div>
  )
}

// ── Checkout Confirmation Modal ──────────────────────────────────────────────
function CheckoutConfirmModal({ billLines, totalAmount, submitting, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '28px 28px 24px', maxWidth: '400px', width: '92%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '30px', marginBottom: '6px' }}>🧾</div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#2C1A0E' }}>Checkout Confirmation</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Review the bill before generating</div>
        </div>

        {/* Bill lines */}
        <div style={{ borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb', padding: '12px 0', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
            <span>Item</span><span>Amount</span>
          </div>
          {billLines.map(({ item, qty }) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C1A0E' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Rs.{parseFloat(item.price).toFixed(2)} × {qty}</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#2C1A0E' }}>Rs.{(qty * parseFloat(item.price)).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#3D6B38' }}>TOTAL</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, color: '#C9A84C' }}>Rs.{totalAmount.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--forest, #3D6B38)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          >{submitting ? 'Generating…' : '✅ Confirm & Generate Bill'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Walk-in Sale Tab (POS) ───────────────────────────────────────────────────
function WalkinSaleTab({ onBillCreated }) {
  const [allItems,    setAllItems]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [search,      setSearch]      = useState('')
  const [activeCat,   setActiveCat]   = useState('all')
  // bill: { [itemId]: { item, qty } }
  const [bill,        setBill]        = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [printBill,   setPrintBill]   = useState(null)

  // Load menu items + categories once
  useEffect(() => {
    Promise.all([getItems(), getCategories()])
      .then(([itemsRes, catsRes]) => {
        setAllItems(itemsRes.data)
        setCategories(catsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoadingMenu(false))
  }, [])

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return allItems
      .filter((i) => i.is_available)
      .filter((i) => activeCat === 'all' || i.category === Number(activeCat))
      .filter((i) => i.name.toLowerCase().includes(q) || (i.item_id || '').toLowerCase().includes(q))
  }, [allItems, activeCat, search])

  // Bill helpers
  const billLines   = Object.values(bill)
  const totalAmount = billLines.reduce((s, l) => s + l.qty * parseFloat(l.item.price), 0)

  const addItem = (item) => {
    setBill((prev) => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], qty: prev[item.id].qty + 1 }
        : { item, qty: 1 },
    }))
    setError('')
  }

  const setQty = (itemId, val) => {
    const qty = Math.max(1, parseInt(val) || 1)
    setBill((prev) => ({ ...prev, [itemId]: { ...prev[itemId], qty } }))
  }

  const removeLine = (itemId) => {
    setBill((prev) => { const { [itemId]: _, ...rest } = prev; return rest })
  }

  const clearBill = () => { setBill({}); setError('') }

  // Open confirmation modal
  const handleCheckoutClick = () => {
    if (!billLines.length) { setError('Add at least one item.'); return }
    setError('')
    setShowCheckout(true)
  }

  // Actually generate bill after confirmation
  const handleConfirmCheckout = async () => {
    setSubmitting(true)
    try {
      const payload = {
        items: billLines.map((l) => ({
          name:       l.item.name,
          quantity:   l.qty,
          unit_price: parseFloat(l.item.price),
        }))
      }
      const { data } = await generateWalkInBill(payload)
      onBillCreated(data)
      clearBill()
      setShowCheckout(false)
      setPrintBill(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed.')
      setShowCheckout(false)
    } finally { setSubmitting(false) }
  }

  if (loadingMenu) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
  }

  return (
    <>
      {/* ── Left: item browser ── */}
      <div className="cd-products-col cd-panel-anim">

        {/* Search */}
        <div className="cd-search-wrap">
          <input
            className="cd-search"
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category pills */}
        <div className="cd-cat-row">
          <button
            className={`cd-cat-pill${activeCat === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCat('all')}
          >All</button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`cd-cat-pill${activeCat === String(c.id) ? ' active' : ''}`}
              onClick={() => setActiveCat(String(c.id))}
            >{c.name}</button>
          ))}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <EmptyState message={search ? `No items match "${search}".` : 'No items available.'} />
        ) : (
          <div className="cd-items-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="cd-item-card" onClick={() => addItem(item)}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="cd-item-img" />
                  : <div className="cd-item-placeholder">🍽️</div>
                }
                <div className="cd-item-body">
                  {item.item_id && <div className="cd-item-id">{item.item_id}</div>}
                  <div className="cd-item-name">{item.name}</div>
                  <div className="cd-item-price">Rs.{parseFloat(item.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: bill panel ── */}
      <div className="cd-bill-panel cd-panel-anim">

        <div className="cd-bill-header">
          <span className="cd-bill-title">🧾 Bill</span>
          {billLines.length > 0 && <span className="cd-bill-count">{billLines.length}</span>}
        </div>

        <div className="cd-bill-items">
          {error && <div className="cd-alert-error">{error}</div>}

          {billLines.length === 0 ? (
            <div className="cd-bill-empty">
              <div className="cd-bill-empty-icon">🛒</div>
              <div className="cd-bill-empty-text">Click an item to add it here</div>
            </div>
          ) : (
            billLines.map(({ item, qty }) => (
              <div key={item.id} className="cd-bill-row">
                <div className="cd-bill-row-info">
                  <div className="cd-bill-row-name">{item.name}</div>
                  <div className="cd-bill-row-qty-line">Rs.{parseFloat(item.price).toFixed(2)} each</div>
                  <div className="cd-bill-qty-controls">
                    <button className="cd-bill-qty-btn" onClick={() => qty > 1 ? setQty(item.id, qty - 1) : removeLine(item.id)}>−</button>
                    <span className="cd-bill-qty-num">{qty}</span>
                    <button className="cd-bill-qty-btn" onClick={() => setQty(item.id, qty + 1)}>+</button>
                  </div>
                </div>
                <div className="cd-bill-row-right">
                  <span className="cd-bill-row-price">Rs.{(qty * parseFloat(item.price)).toFixed(2)}</span>
                  <button className="cd-bill-remove" onClick={() => removeLine(item.id)}>×</button>
                </div>
              </div>
            ))
          )}
        </div>

        {billLines.length > 0 && (
          <div className="cd-bill-footer">
            {billLines.map(({ item, qty }) => (
              <div key={item.id} className="cd-bill-subtotal-row">
                <span>{item.name} × {qty}</span>
                <span>Rs.{(qty * parseFloat(item.price)).toFixed(2)}</span>
              </div>
            ))}
            <div className="cd-bill-divider" />
            <div className="cd-bill-total-row">
              <span className="cd-bill-total-label">TOTAL</span>
              <span className="cd-bill-total-val">Rs.{totalAmount.toFixed(2)}</span>
            </div>
            <button
              className="cd-btn-create"
              onClick={handleCheckoutClick}
            >
              🛒 Checkout
            </button>
            <button className="cd-btn-clear" onClick={clearBill}>Clear bill</button>
          </div>
        )}
      </div>

      {printBill && <PrintWalkinBill bill={printBill} onClose={() => setPrintBill(null)} />}
      {showCheckout && (
        <CheckoutConfirmModal
          billLines={billLines}
          totalAmount={totalAmount}
          submitting={submitting}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function CashierDashboard() {
  const { user, logout } = useAuth()

  const today = new Date().toISOString().split('T')[0]

  const [activeTab,      setActiveTab]      = useState('pos')
  const [historyDate,    setHistoryDate]    = useState(today)
  const [historyOrders,  setHistoryOrders]  = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySummary, setHistorySummary] = useState(null)
  const [onlineOrders,   setOnlineOrders]   = useState([])
  const [onlineBadge,    setOnlineBadge]    = useState(0)

  const handleNewOrder = useCallback((order) => {
    // If this session was hidden (cleared), unhide it so the new order shows
    const sid = order.session_id || ''
    const key = sid || `single-${order.id}`
    const hidden = getHidden()
    if (hidden.has(key)) {
      hidden.delete(key)
      saveHidden(hidden)
    }
    setOnlineOrders((prev) => {
      if (sid) {
        const existing = prev.find((s) => s.session_id === sid)
        if (existing) {
          if (existing.orders.find((o) => o.id === order.id)) return prev
          return prev.map((s) => s.session_id === sid
            ? { ...s, orders: [...s.orders, order] }
            : s
          )
        }
        setOnlineBadge((c) => c + 1)
        return [{ session_id: sid, student_name: order.student_name, student_email: order.student_email,
          created_at: order.created_at, delivery_type: order.delivery_type, delivery_address: order.delivery_address,
          phone_number: order.phone_number, status: order.status, orders: [order] }, ...prev]
      }
      // No session — standalone
      if (prev.find((s) => !s.session_id && s.orders[0]?.id === order.id)) return prev
      setOnlineBadge((c) => c + 1)
      return [{ session_id: null, student_name: order.student_name, student_email: order.student_email,
        created_at: order.created_at, delivery_type: order.delivery_type, delivery_address: order.delivery_address,
        phone_number: order.phone_number, status: order.status, orders: [order] }, ...prev]
    })
  }, [])

  const handleOrderUpdated = useCallback((order) => {
    setOnlineOrders((prev) => prev.map((s) => ({
      ...s,
      orders: s.orders.map((o) => o.id === order.id ? { ...o, ...order } : o),
      status: s.orders.some((o) => o.id === order.id) ? order.status : s.status,
    })))
  }, [])

  useOrderSocket({ onNewOrder: handleNewOrder, onOrderUpdated: handleOrderUpdated })

  const fetchHistory = useCallback(async (date) => {
    setHistoryLoading(true)
    try {
      const [ordersRes, billsRes, summaryRes] = await Promise.all([
        getPosOrders(date),
        getWalkInBills(),
        getDailySummary(date),
      ])
      // Normalize walk-in Bills into the same shape as PosOrder
      const walkInNormalized = billsRes.data
        .filter((b) => new Date(b.generated_at).toISOString().split('T')[0] === date)
        .map((b) => ({
          id:           `bill-${b.id}`,
          bill_id:      b.bill_number,
          created_at:   b.generated_at,
          total_amount: b.total_amount,
          order_items:  b.items.map((it, i) => ({
            id:         i,
            item_name:  it.name,
            quantity:   it.qty,
            unit_price: it.unit_price,
            line_total: it.line_total,
          })),
        }))
      const merged = [...ordersRes.data, ...walkInNormalized]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setHistoryOrders(merged)
      setHistorySummary(summaryRes.data)
    } catch {
      setHistoryOrders([])
      setHistorySummary(null)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory(historyDate)
  }, [activeTab, historyDate, fetchHistory])

  return (
    <div className="cd-root">

      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-brand">
          <div className="cd-brand-logo">
            <img src="/image/image6.jpeg" alt="Shantha logo" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2.5px #C9A84C, 0 0 14px rgba(201,168,76,0.35)' }} />
            <div>
              <div className="cd-brand-name">Cafe Lush</div>
              <div className="cd-brand-sub">Cashier Portal</div>
            </div>
          </div>
        </div>

        <div className="cd-user">
          <div className="cd-avatar">{user?.username?.[0]?.toUpperCase() || 'C'}</div>
          <div>
            <div className="cd-username">{user?.username}</div>
            <div className="cd-userrole">Cashier</div>
          </div>
        </div>

        <nav className="cd-nav">
          <div className="cd-nav-label">POS Terminal</div>
          <button onClick={() => setActiveTab('pos')} className={`cd-nav-item${activeTab === 'pos' ? ' active' : ''}`}>
            Walk-in Sale
          </button>
          <button onClick={() => setActiveTab('online')} className={`cd-nav-item${activeTab === 'online' ? ' active' : ''}`}>
            Online Orders
          </button>
          <button onClick={() => setActiveTab('history')} className={`cd-nav-item${activeTab === 'history' ? ' active' : ''}`}>
            Bill History
          </button>
        </nav>

        <div className="cd-sidebar-footer">
          <button onClick={logout} className="cd-logout-btn">Logout</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="cd-main">
        <header className="cd-topbar">
          <div>
            <div className="cd-topbar-title">
              {activeTab === 'online' ? 'Online Orders' : activeTab === 'history' ? 'Bill History' : 'Walk-in Sale'}
            </div>
            <div className="cd-topbar-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="cd-topbar-right">
            Welcome, <strong>{user?.username}</strong>
          </div>
        </header>

        <div className="cd-content">
          {activeTab === 'history' ? (
            <BillHistoryPanel
              historyDate={historyDate}
              setHistoryDate={setHistoryDate}
              orders={historyOrders}
              loadingOrders={historyLoading}
              summary={historySummary}
              onClear={() => { setHistoryOrders([]); setHistorySummary(null) }}
            />
          ) : activeTab === 'online' ? (
            <OnlineOrdersPanel orders={onlineOrders} setOrders={setOnlineOrders} newBadge={onlineBadge} setNewBadge={setOnlineBadge} />
          ) : (
            <WalkinSaleTab onBillCreated={(data) => {
              const normalized = {
                id:           `bill-${data.id}`,
                bill_id:      data.bill_number,
                created_at:   data.generated_at,
                total_amount: data.total_amount,
                order_items:  data.items.map((it, i) => ({
                  id:         i,
                  item_name:  it.name,
                  quantity:   it.qty,
                  unit_price: it.unit_price,
                  line_total: it.line_total,
                })),
              }
              setHistoryOrders((prev) => [normalized, ...prev])
              setHistorySummary((prev) => ({
                ...(prev || { date: today, total_orders: 0, total_sales: 0 }),
                total_orders: ((prev?.total_orders) || 0) + 1,
                total_sales:  (parseFloat(prev?.total_sales) || 0) + parseFloat(data.total_amount),
              }))
            }} />
          )}
        </div>
      </div>

    </div>
  )
}
