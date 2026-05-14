import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/authContextCore'
import { getDailySummary, getPosOrders, getOnlineOrders, generateOnlineBill, generateWalkInBill, getWalkInBills, getMenuGroups, getMenuItems, updateOrderStatus, updateOrderSessionStatus, updateWalkInBill } from '../../api/endpoints'
import { Spinner, EmptyState } from '../../components/UI'
import { useOrderSocket } from '../../hooks/useOrderSocket'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import PrintBillView from './PrintBillView'
import PrintWalkinBill from './PrintWalkinBill'
import { openReceiptPrintWindow } from './printReceiptHelpers'
import './CashierDashboard.css'

// Confirm dialog
function ConfirmDialog({
  title = 'Clear Confirmation',
  message,
  confirmLabel = 'Yes, Clear',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  zIndex = 1400,
}) {
  useBodyScrollLock()

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '360px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{'\u{1F5D1}\uFE0F'}</div>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#2C1A0E', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>{message}</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '8px 22px', borderRadius: '7px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ padding: '8px 22px', borderRadius: '7px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function getToastItemLabel(order = {}) {
  return order.package_label || order.item_name || order.meal_type_name || 'Order'
}

function formatToastTime(value) {
  const stamp = value ? new Date(value) : new Date()
  if (Number.isNaN(stamp.getTime())) return ''
  return stamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeWalkInBillForHistory(bill) {
  return {
    id: `bill-${bill.id}`,
    bill_pk: bill.id,
    bill_id: bill.bill_number,
    order_reference: bill.order_reference || '',
    source: bill.source || 'walk_in',
    created_at: bill.generated_at,
    total_amount: bill.total_amount,
    subtotal_amount: bill.subtotal_amount,
    cashier_name: bill.cashier_name || '',
    customer_name: bill.customer_name || '',
    is_edited: Boolean(bill.is_edited || Number(bill.edit_count || 0) > 0 || bill.edited_at),
    edited_at: bill.edited_at || '',
    edited_by_name: bill.edited_by_name || '',
    edit_count: Number(bill.edit_count || 0),
    original_total_amount: bill.original_total_amount,
    original_items: Array.isArray(bill.original_items) ? bill.original_items : [],
    order_items: Array.isArray(bill.items) ? bill.items.map((it, i) => ({
      id: i,
      item_id: it.item_id ?? null,
      item_name: it.name,
      quantity: it.qty,
      unit_price: it.unit_price,
      line_total: it.line_total,
    })) : [],
  }
}

function buildWalkInBillStateFromHistoryOrder(order) {
  return (order.order_items || []).reduce((acc, line, index) => {
    const fallbackId = `history-${order.bill_pk || 'bill'}-${index}`
    const itemId = line.item_id ?? fallbackId
    acc[itemId] = {
      item: {
        id: itemId,
        item_id: line.item_code || '',
        name: line.item_name || 'Item',
        price: Number(line.unit_price || 0),
        image_url: '',
        is_available: true,
      },
      qty: Math.max(1, Number(line.quantity || 1)),
    }
    return acc
  }, {})
}

function getWalkInPayloadItemId(itemId) {
  return String(itemId).startsWith('history-') ? null : itemId
}

function buildOrderToast(source = {}) {
  if (source.variant === 'aggregate') {
    const count = Number(source.count || 0)
    return {
      id: source.id || `aggregate-${Date.now()}`,
      kind: 'aggregate',
      headline: `${count} more online order${count === 1 ? '' : 's'} waiting`,
      message: 'Open Online Orders to review the latest pending sessions.',
      time: formatToastTime(source.created_at),
    }
  }

  const orders = Array.isArray(source.orders) && source.orders.length ? source.orders : [source]
  const first = orders[0] || {}
  const firstLabel = getToastItemLabel(first)
  const firstQty = Number(first.quantity || 1)
  const extraItems = Math.max(orders.length - 1, 0)
  const itemSummary = extraItems > 0
    ? `${firstLabel} x${firstQty} + ${extraItems} more item${extraItems > 1 ? 's' : ''}`
    : `${firstLabel} x${firstQty}`

  return {
    id: source.id || `${source.session_id || first.id || 'order'}-${Date.now()}`,
    kind: 'order',
    studentName: source.student_name || first.student_name || 'Student',
    orderReference: source.order_reference || first.order_reference || '',
    deliveryType: (source.delivery_type || first.delivery_type || 'takeaway').toLowerCase(),
    itemSummary,
    time: formatToastTime(source.created_at || first.created_at),
  }
}

function NewOrderToast({ toast, onOpen, onClose }) {
  if (!toast) return null
  const isAggregate = toast.kind === 'aggregate'
  const deliveryLabel = toast.deliveryType === 'delivery' ? 'Delivery' : 'Takeaway'

  return (
    <div className={`cd-order-toast${isAggregate ? ' aggregate' : ''}`} role="status" aria-live="polite">
      <div className="cd-order-toast-head">
        <div className="cd-order-toast-title">{isAggregate ? 'New Online Orders' : 'New Online Order'}</div>
        <button className="cd-order-toast-close" onClick={onClose} aria-label="Close notification">X</button>
      </div>

      {isAggregate ? (
        <>
          <div className="cd-order-toast-student">{toast.headline}</div>
          <div className="cd-order-toast-body">{toast.message}</div>
          {toast.time && <div className="cd-order-toast-time">Received at {toast.time}</div>}
        </>
      ) : (
        <>
          <div className="cd-order-toast-topline">
            <div className="cd-order-toast-student">{toast.studentName}</div>
            <span className={`cd-order-toast-badge ${toast.deliveryType === 'delivery' ? 'delivery' : 'takeaway'}`}>
              {deliveryLabel}
            </span>
          </div>

          <div className="cd-order-toast-details">
            {!!toast.orderReference && toast.orderReference !== '-' && (
              <div className="cd-order-toast-detail">
                <span className="cd-order-toast-detail-label">Order Ref</span>
                <span className="cd-order-toast-detail-value">{toast.orderReference}</span>
              </div>
            )}
            <div className="cd-order-toast-detail">
              <span className="cd-order-toast-detail-label">Items</span>
              <span className="cd-order-toast-detail-value">{toast.itemSummary}</span>
            </div>
            <div className="cd-order-toast-detail">
              <span className="cd-order-toast-detail-label">Received</span>
              <span className="cd-order-toast-detail-value">{toast.time || '-'}</span>
            </div>
          </div>
        </>
      )}

      <button className="cd-order-toast-open" onClick={onOpen}>Open Online Orders</button>
    </div>
  )
}

function buildHistoryPrintBill(order) {
  return {
    id: order.bill_pk,
    bill_number: order.bill_id,
    order_reference: order.order_reference || '',
    generated_at: order.created_at,
    total_amount: order.total_amount,
    subtotal_amount: order.subtotal_amount ?? order.total_amount,
    cashier_name: order.cashier_name || '',
    customer_name: order.customer_name || '',
    items: Array.isArray(order.order_items)
      ? order.order_items.map((line) => ({
          item_id: line.item_id ?? null,
          name: line.item_name,
          qty: Number(line.quantity || 0),
          unit_price: Number(line.unit_price || 0),
          line_total: Number(line.line_total ?? Number(line.unit_price || 0) * Number(line.quantity || 0)),
        }))
      : [],
  }
}

function EditWalkInBillModal({ order, onClose, onSaved }) {
  useBodyScrollLock()

  const [allItems, setAllItems] = useState([])
  const [menuGroups, setMenuGroups] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('all')
  const [customerName, setCustomerName] = useState(order.customer_name || '')
  const [bill, setBill] = useState(() => buildWalkInBillStateFromHistoryOrder(order))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingRemoveLine, setPendingRemoveLine] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [variantPickerItem, setVariantPickerItem] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([getMenuItems(), getMenuGroups()])
      .then(([itemsRes, groupsRes]) => {
        if (!alive) return
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data : [])
        setMenuGroups(Array.isArray(groupsRes.data) ? groupsRes.data : [])
      })
      .catch(() => {
        if (!alive) return
        setError('Failed to load menu items for editing.')
      })
      .finally(() => {
        if (alive) setLoadingMenu(false)
      })
    return () => { alive = false }
  }, [])

  const groupMeta = useMemo(() => {
    const meta = {}
    menuGroups.forEach((group) => {
      const items = allItems.filter((item) => String(item.menu_group) === String(group.id) && item.is_available)
      const sorted = [...items].sort(compareMenuItemsByCode)
      meta[group.id] = {
        firstItem: sorted[0] || null,
        codeRange: buildItemCodeRange(sorted),
      }
    })
    return meta
  }, [menuGroups, allItems])

  const sortedMenuGroups = useMemo(
    () => [...menuGroups].sort((a, b) => {
      const firstA = groupMeta[a.id]?.firstItem
      const firstB = groupMeta[b.id]?.firstItem
      if (firstA && firstB) return compareMenuItemsByCode(firstA, firstB)
      if (firstA && !firstB) return -1
      if (!firstA && firstB) return 1
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
    }),
    [menuGroups, groupMeta]
  )

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    const availableItems = allItems.filter((item) => item.is_available)
    const matchesSearch = (item) => {
      if (!q) return true
      const variantText = getActiveVariants(item).map((variant) => variant.name || '').join(' ').toLowerCase()
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.item_id || '').toLowerCase().includes(q) ||
        variantText.includes(q)
      )
    }

    if (activeGroup === 'all') {
      return sortedMenuGroups.flatMap((group) =>
        availableItems
          .filter((item) => String(item.menu_group) === String(group.id))
          .filter(matchesSearch)
          .sort(compareMenuItemsByCode)
      )
    }

    return availableItems
      .filter((item) => String(item.menu_group) === String(activeGroup))
      .filter(matchesSearch)
      .sort(compareMenuItemsByCode)
  }, [allItems, activeGroup, search, sortedMenuGroups])

  const billLines = Object.values(bill)
  const totalQuantity = billLines.reduce((sum, line) => sum + Number(line.qty || 0), 0)
  const totalAmount = billLines.reduce((sum, line) => sum + Number(line.item?.price || 0) * Number(line.qty || 0), 0)

  const addBillItem = (item) => {
    setBill((prev) => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], qty: prev[item.id].qty + 1 }
        : { item, qty: 1 },
    }))
    setError('')
  }

  const setQty = (itemId, qtyValue) => {
    const qty = Math.max(1, Number.parseInt(qtyValue, 10) || 1)
    setBill((prev) => ({ ...prev, [itemId]: { ...prev[itemId], qty } }))
  }

  const removeLine = (itemId) => {
    setBill((prev) => {
      const { [itemId]: _, ...rest } = prev
      return rest
    })
  }

  const toBillMenuItem = (item) => ({
    id: getMenuItemLineKey(item),
    snapshot_item_id: getMenuItemLineKey(item),
    item_id: item.item_id || '',
    name: item.name,
    price: Number(item.price || 0),
    image_url: item.image_url || '',
    is_available: item.is_available,
  })

  const toBillVariantItem = (item, variant) => ({
    id: getVariantLineKey(item, variant),
    snapshot_item_id: getVariantLineKey(item, variant),
    item_id: item.item_id || '',
    name: buildVariantBillName(item, variant),
    price: Number(variant.price || 0),
    image_url: item.image_url || '',
    is_available: item.is_available,
    variant_name: variant.name || '',
  })

  const getVariantQty = (item, variant) => bill[getVariantLineKey(item, variant)]?.qty || 0

  const handleAddVariant = (item, variant) => {
    addBillItem(toBillVariantItem(item, variant))
    setError('')
  }

  const handleDecreaseVariant = (item, variant) => {
    const billItem = toBillVariantItem(item, variant)
    const qty = bill[billItem.id]?.qty || 0
    if (qty <= 0) return
    if (qty === 1) {
      removeLine(billItem.id)
      return
    }
    setQty(billItem.id, qty - 1)
  }

  const handleDecrease = (item, qty) => {
    if (qty > 1) {
      setQty(item.id, qty - 1)
      return
    }
    setPendingRemoveLine(item)
  }

  const clearBill = () => {
    setBill({})
    setError('')
    setPendingRemoveLine(null)
    setShowClearConfirm(false)
  }

  const handleSave = async () => {
    if (!billLines.length) {
      setError('Add at least one item before saving the bill.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        customer_name: customerName.trim(),
        items: billLines.map(({ item, qty }) => ({
          item_id: getWalkInPayloadItemId(item.snapshot_item_id || item.id),
          name: item.name,
          quantity: qty,
          unit_price: Number(item.price || 0),
        })),
      }
      const { data } = await updateWalkInBill(order.bill_pk, payload)
      onSaved?.(normalizeWalkInBillForHistory(data))
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save bill changes.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="cd-editbill-overlay">
      <div className="cd-editbill-modal">
        <div className="cd-editbill-header">
          <div>
            <div className="cd-editbill-eyebrow">Walk-in bill editor</div>
            <div className="cd-editbill-title">Edit {order.bill_id || 'Bill'}</div>
            <div className="cd-editbill-subtitle">Update items and quantities, then save the corrected bill.</div>
          </div>
          <button type="button" className="cd-editbill-close" onClick={onClose} aria-label="Close editor">X</button>
        </div>

        <div className="cd-editbill-layout">
          <div className="cd-editbill-browser">
            <div className="cd-products-col">
              <div className="cd-editbill-customer">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="cd-editbill-browser-scroll">
                <div className="cd-search-wrap">
                  <input
                    className="cd-search"
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="cd-cat-row">
                  <button
                    className={`cd-cat-pill${activeGroup === 'all' ? ' active' : ''}`}
                    onClick={() => setActiveGroup('all')}
                  >
                    All
                  </button>
                  {sortedMenuGroups.map((group) => (
                    <button
                      key={group.id}
                      className={`cd-cat-pill${activeGroup === String(group.id) ? ' active' : ''}`}
                      onClick={() => setActiveGroup(String(group.id))}
                    >
                      {group.name}{groupMeta[group.id]?.codeRange ? `(${groupMeta[group.id].codeRange})` : ''}
                    </button>
                  ))}
                </div>

                {loadingMenu ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Spinner />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <EmptyState message={search ? `No items match "${search}".` : 'No items available.'} />
                ) : (
                  <div className="cd-items-grid cd-editbill-items-grid">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`cd-item-card${hasVariantChoices(item) ? ' has-variants' : ''}`}
                        data-item-name={item.name}
                        onClick={() => {
                          if (!hasVariantChoices(item)) addBillItem(toBillMenuItem(item))
                        }}
                      >
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="cd-item-img" />
                          : <div className="cd-item-placeholder">+</div>
                        }
                        <div className="cd-item-body">
                          {item.item_id && <div className="cd-item-id">{item.item_id}</div>}
                          <div className="cd-item-name">{item.name}</div>
                          <div className="cd-item-price">Rs.{parseFloat(item.price).toFixed(2)}</div>
                          {hasVariantChoices(item) && (
                            <div className="cd-item-actions">
                              <button
                                type="button"
                                className="cd-item-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setVariantPickerItem(item)
                                }}
                              >
                                View Variants
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="cd-bill-panel cd-editbill-panel">
            <div className="cd-bill-header">
              <div>
                <span className="cd-bill-title">Updated Bill</span>
                <span className="cd-bill-subtitle">Changes will replace the saved walk-in bill</span>
              </div>
              {totalQuantity > 0 && <span className="cd-bill-count">{totalQuantity} items</span>}
            </div>

            <div className="cd-bill-items">
              {error && <div className="cd-alert-error">{error}</div>}

              {billLines.length === 0 ? (
                <div className="cd-bill-empty">
                  <div className="cd-bill-empty-icon">+</div>
                  <div className="cd-bill-empty-text">Add items from the left to rebuild this bill</div>
                </div>
              ) : (
                billLines.map(({ item, qty }) => (
                  <div key={item.id} className="cd-bill-row">
                    <div className="cd-bill-row-info">
                      <div className="cd-bill-row-name">{item.name}</div>
                      <div className="cd-bill-row-qty-line">Rs.{Number(item.price || 0).toFixed(2)} each</div>
                      <div className="cd-bill-qty-controls">
                        <button type="button" className="cd-bill-qty-btn" onClick={() => handleDecrease(item, qty)}>-</button>
                        <span className="cd-bill-qty-num">{qty}</span>
                        <button type="button" className="cd-bill-qty-btn" onClick={() => setQty(item.id, qty + 1)}>+</button>
                      </div>
                    </div>
                    <div className="cd-bill-row-right">
                      <span className="cd-bill-row-price">Rs.{(Number(item.price || 0) * Number(qty || 0)).toFixed(2)}</span>
                      <button type="button" className="cd-bill-remove" onClick={() => setPendingRemoveLine(item)}>X</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cd-bill-footer">
              <div className="cd-bill-summary">
                <div className="cd-bill-summary-row">
                  <span>Unique items</span>
                  <strong>{billLines.length}</strong>
                </div>
                <div className="cd-bill-summary-row">
                  <span>Total quantity</span>
                  <strong>{totalQuantity}</strong>
                </div>
              </div>
              <div className="cd-bill-divider" />
              <div className="cd-bill-total-row">
                <span className="cd-bill-total-label">TOTAL</span>
                <span className="cd-bill-total-val">Rs.{totalAmount.toFixed(2)}</span>
              </div>
              <div className="cd-editbill-actions">
                <button type="button" className="cd-btn-clear" onClick={() => setShowClearConfirm(true)} disabled={saving || billLines.length === 0}>Clear Bill</button>
                <button type="button" className="cd-btn-create" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving changes...' : 'Save Bill Changes'}
                </button>
              </div>
              <button type="button" className="cd-btn-clear cd-editbill-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      </div>

      {pendingRemoveLine && (
        <ConfirmDialog
          title="Remove item?"
          message={`Do you want to remove ${pendingRemoveLine.name} from this bill?`}
          confirmLabel="Yes, Remove"
          cancelLabel="No, Keep"
          zIndex={1401}
          onConfirm={() => {
            removeLine(pendingRemoveLine.id)
            setPendingRemoveLine(null)
          }}
          onCancel={() => setPendingRemoveLine(null)}
        />
      )}
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear edited bill?"
          message="Do you want to remove all items from this edited bill?"
          confirmLabel="Yes, Clear"
          cancelLabel="No, Keep"
          zIndex={1401}
          onConfirm={clearBill}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      {variantPickerItem && (
        <VariantPickerModal
          item={variantPickerItem}
          getQty={getVariantQty}
          onAdd={handleAddVariant}
          onDecrease={handleDecreaseVariant}
          onClose={() => setVariantPickerItem(null)}
        />
      )}
    </div>,
    document.body
  )
}

// Bill History panel
function BillHistoryPanel({ historyDate, setHistoryDate, orders, loadingOrders, summary, onClear, onBillUpdated }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [search, setSearch] = useState('')

  const totalBills = summary?.total_orders ?? orders.length
  const totalSales = parseFloat(summary?.total_sales ?? orders.reduce((s, o) => s + parseFloat(o.total_amount), 0)).toFixed(2)

  const filteredOrders = search.trim()
    ? orders.filter((o) => {
        const q = search.trim().toLowerCase()
        return (
          (o.bill_id || '').toLowerCase().includes(q) ||
          (o.order_reference || '').toLowerCase().includes(q) ||
          (o.customer_name || '').toLowerCase().includes(q)
        )
      })
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
          placeholder="Search by customer, order ref, or bill no"
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
          <div className="cd-history-empty-icon">{'\u{1F4CB}'}</div>
          {search.trim() ? `No bill found for "${search.trim()}".` : 'No bills found for this date.'}
        </div>
      ) : (
        <div className="cd-history-list">
          {filteredOrders.map((order) => (
            <HistoryRow
              key={order.id}
              order={order}
              billNum={orders.length - orders.indexOf(order)}
              onBillUpdated={onBillUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryRow({ order, billNum, onBillUpdated }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [printing, setPrinting] = useState(false)

  const createdAt = new Date(order.created_at)
  const dateStr = createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const editedStamp = order.edited_at ? new Date(order.edited_at) : null
  const editedLabel = editedStamp && !Number.isNaN(editedStamp.getTime())
    ? editedStamp.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
  const billLabel = order.bill_id || `Bill #${String(billNum).padStart(3, '0')}`
  const orderRef = order.order_reference || '-'
  const primaryLabel = orderRef !== '-' ? orderRef : billLabel
  const lineTotal = (line) => parseFloat(line.line_total ?? line.unit_price * line.quantity).toFixed(2)

  return (
    <div className={`cd-hbill-card${expanded ? ' expanded' : ''}`}>
      <button className="cd-hbill-header" onClick={() => setExpanded((v) => !v)}>
        <div className="cd-hbill-header-left">
          <span className="cd-hbill-num">{primaryLabel}</span>
          <span className="cd-hbill-time">{dateStr}{' \u2014 '}{timeStr}</span>
          {orderRef !== '-' && (
            <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Bill No (Internal): {billLabel}</span>
          )}
          {order.is_edited && (
            <span className="cd-hbill-edited-note">
              Edited{order.edit_count > 1 ? ` ${order.edit_count} times` : ''}{order.edited_by_name ? ` by ${order.edited_by_name}` : ''}{editedLabel ? ` on ${editedLabel}` : ''}
            </span>
          )}
        </div>
        <div className="cd-hbill-header-right">
          {order.is_edited && <span className="cd-hbill-edited-badge">Edited</span>}
          <span className="cd-hbill-total">Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
          <span className="cd-hbill-chevron">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {expanded && (
        <div className="cd-hbill-body">
          <div className="cd-hbill-items">
            {order.order_items?.map((line) => (
              <div key={line.id} className="cd-hbill-item-row">
                <span className="cd-hbill-item-name">
                  {line.item_name} <span className="cd-hbill-item-qty">{'\u00D7'} {line.quantity}</span>
                </span>
                <span className="cd-hbill-item-price">Rs.{lineTotal(line)}</span>
              </div>
            ))}
          </div>
          <div className="cd-hbill-divider" />
          <div className="cd-hbill-subtotal-row">
            <span>Subtotal</span>
            <span>Rs.{parseFloat(order.subtotal_amount ?? order.total_amount).toFixed(2)}</span>
          </div>
          {order.is_edited && order.original_total_amount && (
            <div className="cd-hbill-subtotal-row">
              <span>Original total</span>
              <span>Rs.{parseFloat(order.original_total_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="cd-hbill-total-row">
            <span className="cd-hbill-total-label">TOTAL</span>
            <span className="cd-hbill-total-val">Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          <div className="cd-hbill-footer">
            {order.cashier_name && <span className="cd-hbill-cashier">Cashier: {order.cashier_name}</span>}
            {order.source === 'walk_in' && (
              <button className="cd-hbill-edit-btn" onClick={() => setEditing(true)}>Edit Bill</button>
            )}
            <button className="cd-hbill-print-btn" onClick={() => setPrinting(true)}>{'\u{1F5A8}\uFE0F Print Receipt'}</button>
          </div>
        </div>
      )}

      {editing && order.source === 'walk_in' && (
        <EditWalkInBillModal
          order={order}
          onClose={() => setEditing(false)}
          onSaved={onBillUpdated}
        />
      )}
      {printing && (
        <PrintWalkinBill
          bill={buildHistoryPrintBill(order)}
          onClose={() => setPrinting(false)}
        />
      )}
    </div>
  )
}

// Online Orders panel
const HIDDEN_KEY = 'onlineOrders_hidden'
const getHidden  = () => { try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')) } catch { return new Set() } }
const saveHidden = (set) => localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]))
const SEEN_ONLINE_KEY = 'cashier_seen_online_sessions'
const LAST_ONLINE_VISIT_KEY = 'cashier_online_last_visit_at'
const RECENT_BOOTSTRAP_NOTIFY_MS = 10 * 60 * 1000
const loadSeenOnline = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_ONLINE_KEY) || '[]')) } catch { return new Set() }
}
const saveSeenOnline = (set) => {
  try { localStorage.setItem(SEEN_ONLINE_KEY, JSON.stringify([...set].slice(-800))) } catch { /* ignore */ }
}
const loadLastOnlineVisit = () => {
  try { return localStorage.getItem(LAST_ONLINE_VISIT_KEY) || '' } catch { return '' }
}
const saveLastOnlineVisit = (value) => {
  try { localStorage.setItem(LAST_ONLINE_VISIT_KEY, value) } catch { /* ignore */ }
}

const ONLINE_STATUS_GROUPS = [
  { key: 'pending', label: 'Pending Orders' },
  { key: 'confirmed', label: 'Confirmed Orders' },
  { key: 'completed', label: 'Completed Orders' },
  { key: 'cancelled', label: 'Rejected / Cancelled Orders' },
]

const ONLINE_TYPE_GROUPS = [
  { key: 'combined', label: 'Meal Package + Menu Items' },
  { key: 'package', label: 'Meal Package Orders' },
  { key: 'item', label: 'Menu Item Orders' },
]

function getOnlineSessionType(session) {
  const orders = session.orders || []
  const hasPackage = orders.some((order) => order.order_type === 'package')
  const hasItems = orders.some((order) => order.order_type === 'item')
  if (hasPackage && hasItems) return 'combined'
  if (hasPackage) return 'package'
  return 'item'
}

function getOnlineSessionStatus(session) {
  const statuses = new Set((session.orders || []).map((order) => order.status || session.status || 'pending'))
  if (statuses.has('pending')) return 'pending'
  if (statuses.has('confirmed')) return 'confirmed'
  if (statuses.has('completed')) return 'completed'
  if (statuses.has('cancelled')) return 'cancelled'
  return session.status || 'pending'
}

function latestTimestamp(...values) {
  return values
    .filter(Boolean)
    .map((value) => {
      const time = new Date(value).getTime()
      return Number.isFinite(time) ? time : 0
    })
    .reduce((latest, time) => Math.max(latest, time), 0)
}

function getLatestOrderTimestamp(session, field) {
  return latestTimestamp(...(session.orders || []).map((order) => order[field]))
}

function getOnlineSessionSortTimestamp(session) {
  if (session.status === 'pending') {
    return latestTimestamp(
      session.cashier_received_at,
      getLatestOrderTimestamp(session, 'cashier_received_at'),
      session.created_at,
    )
  }
  if (session.status === 'confirmed') {
    return latestTimestamp(session.confirmed_at, getLatestOrderTimestamp(session, 'confirmed_at'))
  }
  if (session.status === 'completed') {
    return latestTimestamp(session.completed_at, getLatestOrderTimestamp(session, 'completed_at'))
  }
  if (session.status === 'cancelled') {
    return latestTimestamp(session.cancelled_at, getLatestOrderTimestamp(session, 'cancelled_at'))
  }
  return latestTimestamp(session.created_at)
}

function getOnlineOrderLabel(order) {
  return order.package_label || (order.order_type === 'item' ? order.item_name : order.meal_type_name) || 'Order item'
}

function getPackageReadyLabel(session) {
  const packageOrder = (session.orders || []).find((order) => order.order_type === 'package')
  if (!packageOrder) return ''
  const meal = (packageOrder.meal_type_name || '').toLowerCase()
  if (meal === 'breakfast') return 'Breakfast package at 7:30 AM'
  if (meal === 'dinner') return 'Dinner package at 7:00 PM'
  return packageOrder.meal_type_name ? `${packageOrder.meal_type_name} package` : ''
}

function getSessionTotalQuantity(session) {
  return (session.orders || []).reduce((sum, order) => sum + Number(order.quantity || 0), 0)
}

const PREP_GROUPS = [
  { key: 'breakfast_veg', label: 'Breakfast Veg', ready: '7:30 AM' },
  { key: 'breakfast_nonveg', label: 'Breakfast Non-Veg', ready: '7:30 AM' },
  { key: 'dinner_veg', label: 'Dinner Veg', ready: '7:00 PM' },
  { key: 'dinner_nonveg', label: 'Dinner Non-Veg', ready: '7:00 PM' },
  { key: 'weekend_lunch', label: 'Weekend Lunch', ready: 'Lunch time' },
]

const PREP_ALLOWED_STATUSES = new Set(['pending', 'confirmed'])
const PREP_STATUS_FILTERS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
]

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isWeekendDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  return date.getDay() === 0 || date.getDay() === 6
}

function getPackagePrepKey(order) {
  const meal = (order.meal_type_name || '').toLowerCase()
  const preference = (order.preference || '').toLowerCase()

  if (meal === 'breakfast' && preference === 'veg') return 'breakfast_veg'
  if (meal === 'breakfast' && preference === 'non-veg') return 'breakfast_nonveg'
  if (meal === 'dinner' && preference === 'veg') return 'dinner_veg'
  if (meal === 'dinner' && preference === 'non-veg') return 'dinner_nonveg'
  if (meal === 'lunch' && isWeekendDate(order.order_date)) return 'weekend_lunch'
  return ''
}

function buildMealPackagePrep(orders, prepDate, methodFilter, combinedOnly, statusFilter = 'all') {
  const groups = PREP_GROUPS.reduce((acc, group) => ({ ...acc, [group.key]: [] }), {})

  orders.forEach((session) => {
    const sessionOrders = session.orders || []
    const packageOrders = sessionOrders.filter((order) => {
      const status = String(order.status || session.status || 'pending').toLowerCase()
      return order.order_type === 'package'
        && PREP_ALLOWED_STATUSES.has(status)
        && (statusFilter === 'all' || status === statusFilter)
    })
    const menuItems = sessionOrders.filter((order) => order.order_type === 'item')
    const hasMenuItems = menuItems.length > 0

    if (combinedOnly && !hasMenuItems) return
    if (methodFilter !== 'all' && session.delivery_type !== methodFilter) return

    packageOrders.forEach((pkg) => {
      if (pkg.order_date !== prepDate) return
      const key = getPackagePrepKey(pkg)
      if (!key || !groups[key]) return
      const status = String(pkg.status || session.status || 'pending').toLowerCase()

      groups[key].push({
        id: pkg.id,
        session_id: session.session_id,
        order_reference: session.order_reference || pkg.order_reference || '-',
        student_name: session.student_name || pkg.student_name || 'Student',
        phone_number: session.phone_number || pkg.phone_number || '',
        student_email: session.student_email || pkg.student_email || '',
        delivery_type: session.delivery_type || pkg.delivery_type || 'takeaway',
        delivery_address: session.delivery_address || pkg.delivery_address || '',
        order_date: pkg.order_date,
        meal_type_name: pkg.meal_type_name,
        preference: pkg.preference,
        quantity: Number(pkg.quantity || 1),
        status,
        has_menu_items: hasMenuItems,
        menu_items: menuItems,
      })
    })
  })

  return groups
}

function OnlineOrdersPanel({ orders, setOrders, loading, newBadge, setNewBadge }) {
  const [generating,   setGenerating]   = useState(null)
  const [confirming,   setConfirming]   = useState(null)
  const [cancelling,   setCancelling]   = useState(null)
  const [completing,   setCompleting]   = useState(null)
  const [printBillId,  setPrintBillId]  = useState(null)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [hiddenKeys,   setHiddenKeys]   = useState(getHidden)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const pendingPrintWindowRef = useRef(null)

  const sessionKey = (s) => s.session_id || `single-${s.orders[0]?.id}`

  const updateOnlineSessionStatus = async (session, nextStatus) => {
    if (session.session_id) {
      const { data } = await updateOrderSessionStatus(session.session_id, nextStatus)
      return Array.isArray(data) ? data : []
    }
    const updatedResponses = await Promise.all(session.orders.map((o) => updateOrderStatus(o.id, nextStatus)))
    return updatedResponses.map(({ data }) => data)
  }

  // Confirm all orders in a session and notify the student
  const handleConfirm = async (session, anchorEl) => {
    const key = session.session_id || session.orders[0]?.id
    setConfirming(key)
    try {
      const updatedOrdersData = await updateOnlineSessionStatus(session, 'confirmed')
      const updatedById = new Map(updatedOrdersData.map((data) => [data.id, data]))
      const confirmedSession = {
        ...session,
        status: 'confirmed',
        orders: session.orders.map((o) => ({ ...o, ...(updatedById.get(o.id) || {}), status: 'confirmed' })),
      }
      setOrders((prev) => prev.map((s) => {
        if ((session.session_id && s.session_id === session.session_id) || s === session) {
          const updatedOrders = s.orders.map((o) => ({ ...o, ...(updatedById.get(o.id) || {}), status: 'confirmed' }))
          return {
            ...s,
            status: 'confirmed',
            confirmed_at: latestTimestamp(...updatedOrders.map((o) => o.confirmed_at))
              ? updatedOrders.find((o) => o.confirmed_at)?.confirmed_at || s.confirmed_at
              : s.confirmed_at,
            orders: updatedOrders,
          }
        }
        return s
      }))
      await handleGenerateBill(confirmedSession, anchorEl)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm order.')
    } finally { setConfirming(null) }
  }

  // Cancel all orders in a session
  const handleCancel = async (session) => {
    const key = session.session_id || session.orders[0]?.id
    setCancelling(key)
    try {
      const updatedOrdersData = await updateOnlineSessionStatus(session, 'cancelled')
      const updatedById = new Map(updatedOrdersData.map((data) => [data.id, data]))
      setOrders((prev) => prev.map((s) => {
        if ((session.session_id && s.session_id === session.session_id) || s === session) {
          const updatedOrders = s.orders.map((o) => ({ ...o, ...(updatedById.get(o.id) || {}), status: 'cancelled' }))
          return {
            ...s,
            status: 'cancelled',
            cancelled_at: updatedOrders.find((o) => o.cancelled_at)?.cancelled_at || s.cancelled_at,
            orders: updatedOrders,
          }
        }
        return s
      }))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel order.')
    } finally { setCancelling(null) }
  }

  const handleRejectClick = (session) => {
    setRejectTarget(session)
  }

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    const session = rejectTarget
    setRejectTarget(null)
    await handleCancel(session)
  }

  const handleComplete = async (session) => {
    const key = session.session_id || session.orders[0]?.id
    setCompleting(key)
    try {
      const updatedOrdersData = await updateOnlineSessionStatus(session, 'completed')
      const updatedById = new Map(updatedOrdersData.map((data) => [data.id, data]))
      setOrders((prev) => prev.map((s) => {
        if ((session.session_id && s.session_id === session.session_id) || s === session) {
          const updatedOrders = s.orders.map((o) => ({ ...o, ...(updatedById.get(o.id) || {}), status: 'completed' }))
          return {
            ...s,
            status: 'completed',
            completed_at: updatedOrders.find((o) => o.completed_at)?.completed_at || s.completed_at,
            orders: updatedOrders,
          }
        }
        return s
      }))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete order.')
    } finally { setCompleting(null) }
  }

  // Generate bill (only for confirmed sessions)
  const handleGenerateBill = async (session) => {
    const firstOrderId = session.orders[0]?.id
    if (!firstOrderId) return
    setGenerating(session.session_id || firstOrderId)
    pendingPrintWindowRef.current = openReceiptPrintWindow({
      loadingTitle: 'Preparing online bill',
      loadingMessage: 'Generating the bill and opening the print dialog...',
    })
    try {
      const { data } = await generateOnlineBill(firstOrderId)
      setOrders((prev) => prev.map((s) => {
        const sameSession = session.session_id
          ? s.session_id === session.session_id
          : s.orders?.[0]?.id === firstOrderId
        if (!sameSession) return s
        return {
          ...s,
          bill_number: data.bill_number || s.bill_number || '',
          cashier_name: data.cashier_name || s.cashier_name || '',
          orders: s.orders.map((o) => ({ ...o, bill_number: data.bill_number || o.bill_number || '' })),
        }
      }))
      setPrintBillId(data.id)
    } catch (err) {
      if (pendingPrintWindowRef.current && !pendingPrintWindowRef.current.closed) {
        pendingPrintWindowRef.current.close()
      }
      pendingPrintWindowRef.current = null
      alert(err.response?.data?.detail || 'Failed to generate bill.')
    } finally { setGenerating(null) }
  }

  const statusColor = (s) => ({
    pending:   { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
    confirmed: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
    completed: { bg: '#eef2ff', color: '#3730a3', border: '#a5b4fc' },
    cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  }[s] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' })

  const visibleOrders = useMemo(() => {
    return orders
      .filter((session) => !hiddenKeys.has(sessionKey(session)))
      .map((session) => ({
        ...session,
        status: getOnlineSessionStatus(session),
        orderGroup: getOnlineSessionType(session),
      }))
      .filter((session) => statusFilter === 'all' || session.status === statusFilter)
      .filter((session) => typeFilter === 'all' || session.orderGroup === typeFilter)
      .sort((a, b) => getOnlineSessionSortTimestamp(b) - getOnlineSessionSortTimestamp(a))
  }, [orders, hiddenKeys, statusFilter, typeFilter])

  const counts = useMemo(() => {
    const visible = orders
      .filter((session) => !hiddenKeys.has(sessionKey(session)))
      .map((session) => ({ ...session, status: getOnlineSessionStatus(session), orderGroup: getOnlineSessionType(session) }))
    return {
      all: visible.length,
      pending: visible.filter((session) => session.status === 'pending').length,
      confirmed: visible.filter((session) => session.status === 'confirmed').length,
      completed: visible.filter((session) => session.status === 'completed').length,
      cancelled: visible.filter((session) => session.status === 'cancelled').length,
      item: visible.filter((session) => session.orderGroup === 'item').length,
      package: visible.filter((session) => session.orderGroup === 'package').length,
      combined: visible.filter((session) => session.orderGroup === 'combined').length,
    }
  }, [orders, hiddenKeys])

  const renderSessionCard = (session, idx) => {
    const sc = statusColor(session.status)
    const key = sessionKey(session) || `session-${idx}`
    const genKey = session.session_id || session.orders[0]?.id
    const typeLabel = ONLINE_TYPE_GROUPS.find((group) => group.key === session.orderGroup)?.label || 'Online Order'
    const readyLabel = getPackageReadyLabel(session)
    const deliveryLabel = session.delivery_type === 'delivery' ? 'Delivery' : 'Takeaway'
    const completionLabel = session.delivery_type === 'delivery' ? 'Mark Delivered' : 'Mark Picked Up'
    const billNumber = session.bill_number || session.orders.find((o) => o.bill_number)?.bill_number || ''
    const orderRef = session.order_reference || session.orders[0]?.order_reference || '-'
    const totalQty = getSessionTotalQuantity(session)
    const busy = confirming === genKey || cancelling === genKey || completing === genKey || generating === genKey

    return (
      <div key={key} className="cd-hbill-card" style={{ borderLeft: `3px solid ${sc.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px', gap: '14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--espresso)' }}>
                {session.student_name || 'Student'}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'uppercase' }}>
                {session.status === 'cancelled' ? 'Rejected / Cancelled' : session.status}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                {typeLabel}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: session.delivery_type === 'delivery' ? '#eff6ff' : '#f8fafc', color: session.delivery_type === 'delivery' ? '#1d4ed8' : '#475569', border: '1px solid #cbd5e1' }}>
                {deliveryLabel}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
              Order Ref: <strong>{orderRef}</strong>
            </div>
            {billNumber && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                Bill No: <strong>{billNumber}</strong>
              </div>
            )}

            {readyLabel && (
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 800, marginBottom: '6px' }}>
                Ready: {readyLabel}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              {session.orders.map((o) => (
                <div key={o.id} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--espresso)' }}>
                    {getOnlineOrderLabel(o)}
                  </span>
                  {' x '}{o.quantity}
                  {o.order_type !== 'item' && o.order_date && (
                    <span style={{ marginLeft: '6px', fontSize: '11px', background: '#f3f4f6', borderRadius: '4px', padding: '1px 5px', color: '#6b7280' }}>
                      {o.order_date}
                    </span>
                  )}
                  <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.75 }}>
                    ({o.order_type === 'item' ? 'Menu item' : 'Meal package'})
                  </span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Placed {new Date(session.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              {' \u00B7 '}{totalQty} total item{totalQty === 1 ? '' : 's'}
            </div>
            {session.phone_number && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>Phone: {session.phone_number}</div>
            )}
            {session.student_email && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>Email: {session.student_email}</div>
            )}
            {session.delivery_address && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                {session.delivery_type === 'delivery' ? 'Address' : 'Pickup note'}: {session.delivery_address}
              </div>
            )}
            {session.delivery_type === 'delivery' && (
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '3px', fontWeight: 800 }}>
                Delivery Fee: Rs.{Number(session.delivery_fee ?? 0).toFixed(2)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '7px', flexShrink: 0, minWidth: '154px' }}>
            {session.status === 'pending' && (
              <>
                <button
                  onClick={(e) => handleConfirm(session, e.currentTarget)}
                  disabled={busy}
                  style={{ background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
                >
                  {confirming === genKey ? 'Confirming...' : generating === genKey ? 'Opening Bill...' : 'Confirm & Print Bill'}
                </button>
                <button
                  onClick={() => handleRejectClick(session)}
                  disabled={busy}
                  style={{ background: '#fef2f2', color: '#991b1b', border: '1.5px solid #fca5a5', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                >
                  {cancelling === genKey ? 'Rejecting...' : 'Reject'}
                </button>
              </>
            )}
            {session.status === 'confirmed' && (
              <>
                <button
                  onClick={(e) => handleGenerateBill(session, e.currentTarget)}
                  disabled={generating === genKey}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #93c5fd', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 800, cursor: generating === genKey ? 'not-allowed' : 'pointer', opacity: generating === genKey ? 0.6 : 1 }}
                >
                  {generating === genKey ? 'Opening...' : billNumber ? 'Print Bill' : 'Generate Bill'}
                </button>
                <button
                  onClick={() => handleComplete(session)}
                  disabled={busy}
                  style={{ background: '#eef2ff', color: '#3730a3', border: '1.5px solid #a5b4fc', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                >
                  {completing === genKey ? 'Completing...' : completionLabel}
                </button>
              </>
            )}
            {session.status === 'completed' && (
              <span style={{ textAlign: 'center', background: '#eef2ff', color: '#3730a3', border: '1px solid #a5b4fc', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', fontWeight: 800 }}>
                {session.delivery_type === 'delivery' ? 'Delivered' : 'Picked Up'}
              </span>
            )}
            {session.status === 'cancelled' && (
              <span style={{ textAlign: 'center', background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', fontWeight: 800 }}>
                Rejected
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

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
      {rejectTarget && (
        <ConfirmDialog
          title="Reject order?"
          message={`Are you sure you want to reject ${rejectTarget.student_name || 'this student'}'s order? This will notify the student that the order was cancelled.`}
          confirmLabel="Yes, Reject"
          cancelLabel="No, Keep"
          onConfirm={handleConfirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}
      <div className="cd-history-topbar">
        <div>
          <div className="cd-history-heading">Online Orders</div>
          <div className="cd-history-subheading">Live student orders with the latest online order first</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        {[
          { label: 'All', value: counts.all },
          { label: 'Pending', value: counts.pending },
          { label: 'Confirmed', value: counts.confirmed },
          { label: 'Completed', value: counts.completed },
          { label: 'Rejected', value: counts.cancelled },
        ].map((stat) => (
          <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--espresso)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 800, marginTop: '4px', textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {[{ key: 'all', label: `All (${counts.all})` }, ...ONLINE_STATUS_GROUPS.map((group) => ({
          key: group.key,
          label: `${group.key === 'cancelled' ? 'Rejected' : group.label.replace(' Orders', '')} (${counts[group.key] || 0})`,
        }))].map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            style={{
              border: statusFilter === filter.key ? '1.5px solid var(--forest-light)' : '1.5px solid #e5e7eb',
              background: statusFilter === filter.key ? '#f0fff0' : '#fff',
              color: statusFilter === filter.key ? 'var(--forest)' : '#6b7280',
              borderRadius: '8px',
              padding: '7px 11px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {[{ key: 'all', label: 'All Types' }, ...ONLINE_TYPE_GROUPS.map((group) => ({
          key: group.key,
          label: `${group.label} (${counts[group.key] || 0})`,
        }))].map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setTypeFilter(filter.key)}
            style={{
              border: typeFilter === filter.key ? '1.5px solid #1d4ed8' : '1.5px solid #e5e7eb',
              background: typeFilter === filter.key ? '#eff6ff' : '#fff',
              color: typeFilter === filter.key ? '#1d4ed8' : '#6b7280',
              borderRadius: '8px',
              padding: '7px 11px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
      ) : visibleOrders.length === 0 ? (
        <div className="cd-history-empty">
          <div className="cd-history-empty-icon">{'\u{1F4ED}'}</div>
          No online orders match these filters.
        </div>
      ) : (
        <div className="cd-history-list">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleOrders.map((session, idx) => renderSessionCard(session, idx))}
          </div>
        </div>
      )}

      {printBillId && (
        <PrintBillView
          billId={printBillId}
          initialPrintWindow={pendingPrintWindowRef.current}
          onClose={() => {
            pendingPrintWindowRef.current = null
            setPrintBillId(null)
          }}
        />
      )}
    </div>
  )
}

// Meal Package Prep panel
function MealPackagePrepPanel({ orders, setOrders, onOrdersSynced }) {
  const [prepDate, setPrepDate] = useState(toDateInputValue())
  const [methodFilter, setMethodFilter] = useState('all')
  const [prepStatusFilter, setPrepStatusFilter] = useState('all')
  const [combinedOnly, setCombinedOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  const refreshOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getOnlineOrders()
      setOrders(data)
      onOrdersSynced?.(data)
    } catch {
      // Keep the latest loaded snapshot if refresh fails.
    } finally {
      setLoading(false)
    }
  }, [setOrders, onOrdersSynced])

  useEffect(() => { refreshOrders() }, [refreshOrders])

  const prepGroups = useMemo(
    () => buildMealPackagePrep(orders, prepDate, methodFilter, combinedOnly, prepStatusFilter),
    [orders, prepDate, methodFilter, combinedOnly, prepStatusFilter],
  )

  const totals = useMemo(() => {
    const groupTotals = {}
    let all = 0
    PREP_GROUPS.forEach((group) => {
      const total = (prepGroups[group.key] || []).reduce((sum, row) => sum + row.quantity, 0)
      groupTotals[group.key] = total
      all += total
    })
    return { ...groupTotals, all }
  }, [prepGroups])

  const hasRows = totals.all > 0

  return (
    <div className="cd-history-col cd-panel-anim">
      <div className="cd-history-topbar">
        <div>
          <div className="cd-history-heading">Meal Package Prep</div>
        </div>
        <button className="cd-btn-refresh" onClick={refreshOrders} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>
          Prep Date
          <input
            type="date"
            value={prepDate}
            onChange={(e) => setPrepDate(e.target.value)}
            style={{ border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', color: 'var(--espresso)', fontFamily: 'inherit' }}
          />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignSelf: 'flex-end' }}>
          {[
            { key: 'all', label: 'All Methods' },
            { key: 'takeaway', label: 'Takeaway' },
            { key: 'delivery', label: 'Delivery' },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setMethodFilter(filter.key)}
              style={{
                border: methodFilter === filter.key ? '1.5px solid var(--forest-light)' : '1.5px solid #e5e7eb',
                background: methodFilter === filter.key ? '#f0fff0' : '#fff',
                color: methodFilter === filter.key ? 'var(--forest)' : '#6b7280',
                borderRadius: '8px',
                padding: '8px 11px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {filter.label}
            </button>
          ))}
          {PREP_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setPrepStatusFilter(filter.key)}
              style={{
                border: prepStatusFilter === filter.key ? '1.5px solid #92400e' : '1.5px solid #e5e7eb',
                background: prepStatusFilter === filter.key ? '#fffbeb' : '#fff',
                color: prepStatusFilter === filter.key ? '#92400e' : '#6b7280',
                borderRadius: '8px',
                padding: '8px 11px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {filter.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCombinedOnly((value) => !value)}
            style={{
              border: combinedOnly ? '1.5px solid #1d4ed8' : '1.5px solid #e5e7eb',
              background: combinedOnly ? '#eff6ff' : '#fff',
              color: combinedOnly ? '#1d4ed8' : '#6b7280',
              borderRadius: '8px',
              padding: '8px 11px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Combined Only
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[...PREP_GROUPS, { key: 'all', label: 'Total Packages', ready: 'Visible on prep date' }].map((group) => (
          <div key={group.key} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: group.key === 'all' ? 'var(--forest)' : 'var(--espresso)', lineHeight: 1 }}>
              {totals[group.key] || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 900, marginTop: '5px' }}>{group.label}</div>
            <div style={{ fontSize: '10px', color: '#166534', fontWeight: 800, marginTop: '3px' }}>{group.ready}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
      ) : !hasRows ? (
        <div className="cd-history-empty">
          <div className="cd-history-empty-icon">{'\u{1F4ED}'}</div>
          No pending or confirmed meal packages match these prep filters.
        </div>
      ) : (
        <div className="cd-history-list">
          {PREP_GROUPS.map((group) => {
            const rows = prepGroups[group.key] || []
            if (rows.length === 0) return null
            return (
              <section key={group.key} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--espresso)', fontSize: '14px' }}>{group.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#166534' }}>
                    {`${totals[group.key]} package${totals[group.key] === 1 ? '' : 's'} · Ready ${group.ready}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rows.map((row) => {
                    const isPending = row.status === 'pending'
                    return (
                    <article key={`${group.key}-${row.id}`} className="cd-hbill-card" style={{ borderLeft: `3px solid ${isPending ? '#fbbf24' : '#6ee7b7'}` }}>
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '5px' }}>
                              <strong style={{ fontSize: '13px', color: 'var(--espresso)' }}>{row.order_reference}</strong>
                              <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '999px', background: isPending ? '#fffbeb' : '#ecfdf5', color: isPending ? '#92400e' : '#065f46', border: `1px solid ${isPending ? '#fcd34d' : '#6ee7b7'}` }}>
                                {isPending ? 'Pending' : 'Confirmed'}
                              </span>
                              <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '999px', background: row.delivery_type === 'delivery' ? '#eff6ff' : '#f8fafc', color: row.delivery_type === 'delivery' ? '#1d4ed8' : '#475569', border: '1px solid #cbd5e1' }}>
                                {row.delivery_type === 'delivery' ? 'Delivery' : 'Takeaway'}
                              </span>
                              {row.has_menu_items && (
                                <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '999px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                                  Package + Menu
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Student: <strong>{row.student_name}</strong>{' \u00B7 '}Qty: <strong>{row.quantity}</strong>{' \u00B7 '}Date: <strong>{row.order_date}</strong>
                            </div>
                            {row.phone_number && (
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>Phone: {row.phone_number}</div>
                            )}
                            {row.delivery_address && (
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                                {row.delivery_type === 'delivery' ? 'Address' : 'Pickup note'}: {row.delivery_address}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, color: isPending ? '#92400e' : 'var(--forest)', lineHeight: 1 }}>{row.quantity}</div>
                            <div style={{ fontSize: '10px', color: isPending ? '#92400e' : '#166534', fontWeight: 900, marginTop: '4px' }}>
                              {isPending ? 'Waiting Confirm' : 'Prepare'}
                            </div>
                          </div>
                        </div>

                        {row.menu_items.length > 0 && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e5e7eb' }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>
                              Combined menu items
                            </div>
                            {row.menu_items.map((item) => (
                              <div key={item.id} style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <strong style={{ color: 'var(--espresso)' }}>{getOnlineOrderLabel(item)}</strong> x {item.quantity}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  )})}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckoutConfirmModal({ billLines, totalAmount, customerName, onCustomerNameChange, submitting, onConfirm, onCancel }) {
  useBodyScrollLock()

  const itemCount = billLines.reduce((sum, line) => sum + line.qty, 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '28px 28px 24px', maxWidth: '440px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close checkout confirmation"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: '999px',
            background: 'transparent',
            color: '#6b7280',
            fontSize: '24px',
            lineHeight: 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          &times;
        </button>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', color: '#3D6B38', textTransform: 'uppercase', marginBottom: '6px' }}>{itemCount} items selected</div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#2C1A0E' }}>Checkout Confirmation</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Review the bill before generating</div>
        </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
          Customer Name
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="Optional"
          disabled={submitting}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1.5px solid #e5e7eb',
            fontSize: '13px',
            outline: 'none',
            background: '#f9fafb',
            color: '#2C1A0E',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Bill lines */}
      <div style={{ borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb', padding: '12px 0', marginBottom: '14px', overflowY: 'auto', maxHeight: 'min(320px, 38vh)', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
            <span>Item</span><span>Amount</span>
          </div>
          {billLines.map(({ item, qty }) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C1A0E' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Rs.{parseFloat(item.price).toFixed(2)} {'\u00D7'} {qty}</div>
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
          >{submitting ? 'Generating...' : 'Confirm & Generate Bill'}</button>
        </div>
      </div>
    </div>
  )
}

function VariantPickerModal({ item, getQty, onAdd, onDecrease, onClose }) {
  useBodyScrollLock()

  if (!item) return null
  const variants = getActiveVariants(item)

  return createPortal(
    <div className="cd-variant-overlay" onClick={onClose}>
      <div className="cd-variant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-variant-head">
          <div>
            <div className="cd-variant-eyebrow">Menu Item Variants</div>
            <div className="cd-variant-title">{item.name}</div>
            <div className="cd-variant-subtitle">Add any variant directly to the bill with its own price.</div>
          </div>
          <button type="button" className="cd-variant-close" onClick={onClose}>×</button>
        </div>

        <div className="cd-variant-list">
          {variants.map((variant) => {
            const qty = getQty(item, variant)
            return (
              <div key={variant.id} className="cd-variant-row">
                <div className="cd-variant-info">
                  <div className="cd-variant-name">{variant.name}</div>
                  <div className="cd-variant-price">Rs.{parseFloat(variant.price || 0).toFixed(2)}</div>
                </div>
                <div className="cd-variant-controls">
                  <button type="button" className="cd-variant-btn" onClick={() => onDecrease(item, variant)} disabled={qty <= 0}>-</button>
                  <span className="cd-variant-qty">{qty}</span>
                  <button type="button" className="cd-variant-btn" onClick={() => onAdd(item, variant)}>+</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Walk-in Sale tab (POS)
const compareMenuItemsByCode = (a, b) => {
  const parseCode = (item) => {
    const code = (item.item_id || '').trim()
    const match = code.match(/^(\d+)([A-Za-z].*)$/)
    return {
      code,
      group: match ? match[2].toUpperCase() : code.toUpperCase(),
      number: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
    }
  }
  const codeA = parseCode(a)
  const codeB = parseCode(b)

  if (codeA.code && !codeB.code) return -1
  if (!codeA.code && codeB.code) return 1

  const groupCompare = codeA.group.localeCompare(codeB.group, undefined, {
    numeric: true,
    sensitivity: 'base',
  })

  if (groupCompare !== 0) return groupCompare

  const numberCompare = codeA.number - codeB.number
  if (numberCompare !== 0) return numberCompare

  const codeCompare = codeA.code.localeCompare(codeB.code, undefined, {
    numeric: true,
    sensitivity: 'base',
  })

  if (codeCompare !== 0) return codeCompare
  return (a.name || '').localeCompare(b.name || '', undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

const buildItemCodeRange = (items) => {
  const codes = [...items].sort(compareMenuItemsByCode).map((item) => (item.item_id || '').trim()).filter(Boolean)
  if (!codes.length) return ''
  if (codes.length === 1) return codes[0]
  return `${codes[0]} - ${codes[codes.length - 1]}`
}

const getMenuItemLineKey = (item) => `menu-${item.id}`
const getVariantLineKey = (item, variant) => `menu-${item.id}::variant-${variant.id}`
const getActiveVariants = (item) => (item?.variants || []).filter((variant) => variant?.is_active !== false)
const hasVariantChoices = (item) => getActiveVariants(item).length > 1
const getMenuGroupLabel = (item) => {
  const raw = (item?.menu_group_name || '').trim()
  if (!raw) return ''

  const aliases = {
    Shakes: 'Shake',
  }

  return aliases[raw] || raw
}

const buildVariantBillName = (item, variant) => {
  const baseName = (item?.name || '').trim()
  const variantName = (variant?.name || '').trim()
  const groupLabel = getMenuGroupLabel(item)
  const baseLower = baseName.toLowerCase()
  const labelLower = groupLabel.toLowerCase()
  const fullBaseName = groupLabel && !baseLower.includes(labelLower)
    ? `${baseName} ${groupLabel}`
    : baseName

  return variantName ? `${fullBaseName} - ${variantName}` : fullBaseName
}

function WalkinSaleTab({ onBillCreated }) {
  const [allItems,    setAllItems]    = useState([])
  const [menuGroups,  setMenuGroups]  = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [search,      setSearch]      = useState('')
  const [activeGroup, setActiveGroup] = useState('all')
  const [customerName, setCustomerName] = useState('')
  // bill: { [itemId]: { item, qty } }
  const [bill,        setBill]        = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [printBill,   setPrintBill]   = useState(null)
  const [pendingRemoveLine, setPendingRemoveLine] = useState(null)
  const [pendingClearBill, setPendingClearBill] = useState(false)
  const [variantPickerItem, setVariantPickerItem] = useState(null)
  const pendingPrintWindowRef = useRef(null)

  // Load menu items + menu groups once
  useEffect(() => {
    Promise.all([getMenuItems(), getMenuGroups()])
      .then(([itemsRes, groupsRes]) => {
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data : [])
        setMenuGroups(Array.isArray(groupsRes.data) ? groupsRes.data : [])
      })
      .catch(() => {})
      .finally(() => setLoadingMenu(false))
  }, [])

  const groupMeta = useMemo(() => {
    const meta = {}
    menuGroups.forEach((group) => {
      const items = allItems.filter((item) => String(item.menu_group) === String(group.id) && item.is_available)
      const sorted = [...items].sort(compareMenuItemsByCode)
      meta[group.id] = {
        firstItem: sorted[0] || null,
        codeRange: buildItemCodeRange(sorted),
      }
    })
    return meta
  }, [menuGroups, allItems])

  const sortedMenuGroups = useMemo(
    () => [...menuGroups].sort((a, b) => {
      const firstA = groupMeta[a.id]?.firstItem
      const firstB = groupMeta[b.id]?.firstItem
      if (firstA && firstB) return compareMenuItemsByCode(firstA, firstB)
      if (firstA && !firstB) return -1
      if (!firstA && firstB) return 1
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
    }),
    [menuGroups, groupMeta]
  )

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim()
    const availableItems = allItems.filter((i) => i.is_available)
    const matchesSearch = (item) => {
      if (!q) return true
      const variantText = (item.variants || []).map((variant) => variant.name || '').join(' ').toLowerCase()
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.item_id || '').toLowerCase().includes(q) ||
        variantText.includes(q)
      )
    }

    if (activeGroup === 'all') {
      return sortedMenuGroups.flatMap((group) =>
        availableItems
          .filter((item) => String(item.menu_group) === String(group.id))
          .filter(matchesSearch)
          .sort(compareMenuItemsByCode)
      )
    }

    return availableItems
      .filter((item) => String(item.menu_group) === String(activeGroup))
      .filter(matchesSearch)
      .sort(compareMenuItemsByCode)
  }, [allItems, activeGroup, search, sortedMenuGroups])

  // Bill helpers
  const billLines   = Object.values(bill)
  const billItemCount = billLines.reduce((sum, line) => sum + line.qty, 0)
  const totalAmount = billLines.reduce((s, l) => s + l.qty * parseFloat(l.item.price), 0)

  const addBillItem = (item) => {
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

  const toBillMenuItem = (item) => ({
    id: getMenuItemLineKey(item),
    snapshot_item_id: getMenuItemLineKey(item),
    item_id: item.item_id || '',
    name: item.name,
    price: Number(item.price || 0),
    image_url: item.image_url || '',
    is_available: item.is_available,
  })

  const toBillVariantItem = (item, variant) => ({
    id: getVariantLineKey(item, variant),
    snapshot_item_id: getVariantLineKey(item, variant),
    item_id: item.item_id || '',
    name: buildVariantBillName(item, variant),
    price: Number(variant.price || 0),
    image_url: item.image_url || '',
    is_available: item.is_available,
    variant_name: variant.name || '',
  })

  const getVariantQty = (item, variant) => bill[getVariantLineKey(item, variant)]?.qty || 0

  const handleAddVariant = (item, variant) => {
    addBillItem(toBillVariantItem(item, variant))
  }

  const handleDecreaseVariant = (item, variant) => {
    const billItem = toBillVariantItem(item, variant)
    const qty = bill[billItem.id]?.qty || 0
    if (qty <= 0) return
    if (qty === 1) {
      removeLine(billItem.id)
      return
    }
    setQty(billItem.id, qty - 1)
  }

  const decreaseLineQty = (item, qty) => {
    if (qty > 1) {
      setQty(item.id, qty - 1)
      return
    }
    setPendingRemoveLine(item)
  }

  const confirmRemoveLine = () => {
    if (!pendingRemoveLine) return
    removeLine(pendingRemoveLine.id)
    setPendingRemoveLine(null)
  }

  const clearBill = () => {
    setBill({})
    setCustomerName('')
    setError('')
    setPendingRemoveLine(null)
    setPendingClearBill(false)
  }

  // Open confirmation modal
  const handleCheckoutClick = () => {
    if (!billLines.length) { setError('Add at least one item.'); return }
    setError('')
    setShowCheckout(true)
  }

  // Actually generate bill after confirmation
  const handleConfirmCheckout = async () => {
    setSubmitting(true)
    pendingPrintWindowRef.current = openReceiptPrintWindow({
      loadingTitle: 'Preparing walk-in bill',
      loadingMessage: 'Generating the bill and opening the print dialog...',
    })
    try {
      const payload = {
        customer_name: customerName.trim(),
        items: billLines.map((l) => ({
          item_id:    l.item.snapshot_item_id || l.item.id,
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
      if (pendingPrintWindowRef.current && !pendingPrintWindowRef.current.closed) {
        pendingPrintWindowRef.current.close()
      }
      pendingPrintWindowRef.current = null
      setError(err.response?.data?.detail || 'Checkout failed.')
      setShowCheckout(false)
    } finally { setSubmitting(false) }
  }

  if (loadingMenu) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
  }

  return (
    <>
      {/* Left: item browser */}
      <div className="cd-products-col cd-panel-anim">

        {/* Search */}
        <div className="cd-search-wrap">
          <input
            className="cd-search"
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category pills */}
        <div className="cd-cat-row">
          <button
            className={`cd-cat-pill${activeGroup === 'all' ? ' active' : ''}`}
            onClick={() => setActiveGroup('all')}
          >All</button>
          {sortedMenuGroups.map((group) => (
            <button
              key={group.id}
              className={`cd-cat-pill${activeGroup === String(group.id) ? ' active' : ''}`}
              onClick={() => setActiveGroup(String(group.id))}
            >{group.name}{groupMeta[group.id]?.codeRange ? `(${groupMeta[group.id]?.codeRange})` : ''}</button>
          ))}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <EmptyState message={search ? `No items match "${search}".` : 'No items available.'} />
        ) : (
          <div className="cd-items-grid">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`cd-item-card${hasVariantChoices(item) ? ' has-variants' : ''}`}
                data-item-name={item.name}
                onClick={() => {
                  if (!hasVariantChoices(item)) addBillItem(toBillMenuItem(item))
                }}
              >
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="cd-item-img" />
                  : <div className="cd-item-placeholder">{'\u{1F37D}\uFE0F'}</div>
                }
                <div className="cd-item-body">
                  {item.item_id && <div className="cd-item-id">{item.item_id}</div>}
                  <div className="cd-item-name">{item.name}</div>
                  <div className="cd-item-price">Rs.{parseFloat(item.price).toFixed(2)}</div>
                  {hasVariantChoices(item) && (
                    <div className="cd-item-actions">
                      <button
                        type="button"
                        className="cd-item-view-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVariantPickerItem(item)
                        }}
                      >
                        View Variants
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: bill panel */}
      <div className="cd-bill-panel cd-panel-anim">

        <div className="cd-bill-header">
          <div>
            <span className="cd-bill-title">Bill</span>
            <span className="cd-bill-subtitle">Selected items</span>
          </div>
          {billItemCount > 0 && <span className="cd-bill-count">{billItemCount} items</span>}
        </div>

        <div className="cd-bill-items">
          {error && <div className="cd-alert-error">{error}</div>}

          {billLines.length === 0 ? (
            <div className="cd-bill-empty">
              <div className="cd-bill-empty-icon">{'\u{1F6D2}'}</div>
              <div className="cd-bill-empty-text">Click an item to add it here</div>
            </div>
          ) : (
            billLines.map(({ item, qty }) => (
              <div key={item.id} className="cd-bill-row">
                <div className="cd-bill-row-info">
                  <div className="cd-bill-row-name">{item.name}</div>
                  <div className="cd-bill-row-qty-line">Rs.{parseFloat(item.price).toFixed(2)} each</div>
                  <div className="cd-bill-qty-controls">
                    <button className="cd-bill-qty-btn" onClick={() => decreaseLineQty(item, qty)}>-</button>
                    <span className="cd-bill-qty-num">{qty}</span>
                    <button className="cd-bill-qty-btn" onClick={() => setQty(item.id, qty + 1)}>+</button>
                  </div>
                </div>
                <div className="cd-bill-row-right">
                  <span className="cd-bill-row-price">Rs.{(qty * parseFloat(item.price)).toFixed(2)}</span>
                  <button className="cd-bill-remove" onClick={() => setPendingRemoveLine(item)}>{'\u00D7'}</button>
                </div>
              </div>
            ))
          )}
        </div>

        {billLines.length > 0 && (
          <div className="cd-bill-footer">
            <div className="cd-bill-summary">
              <div className="cd-bill-summary-row">
                <span>Unique items</span>
                <strong>{billLines.length}</strong>
              </div>
              <div className="cd-bill-summary-row">
                <span>Total quantity</span>
                <strong>{billItemCount}</strong>
              </div>
            </div>
            <div className="cd-bill-divider" />
            <div className="cd-bill-total-row">
              <span className="cd-bill-total-label">TOTAL</span>
              <span className="cd-bill-total-val">Rs.{totalAmount.toFixed(2)}</span>
            </div>
            <div className="cd-bill-footer-note">Full item details are listed above.</div>
            <button
              className="cd-btn-create"
              onClick={handleCheckoutClick}
            >
              Checkout
            </button>
            <button className="cd-btn-clear" onClick={() => setPendingClearBill(true)}>Clear bill</button>
          </div>
        )}
      </div>

      {printBill && (
        <PrintWalkinBill
          bill={printBill}
          initialPrintWindow={pendingPrintWindowRef.current}
          onClose={() => {
            pendingPrintWindowRef.current = null
            setPrintBill(null)
          }}
        />
      )}
      {showCheckout && (
        <CheckoutConfirmModal
          billLines={billLines}
          totalAmount={totalAmount}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          submitting={submitting}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setShowCheckout(false)}
        />
      )}
      {pendingRemoveLine && (
        <ConfirmDialog
          title="Remove item?"
          message={`Do you want to remove ${pendingRemoveLine.name} from the bill?`}
          confirmLabel="Yes, Remove"
          cancelLabel="No, Keep"
          onConfirm={confirmRemoveLine}
          onCancel={() => setPendingRemoveLine(null)}
        />
      )}
      {pendingClearBill && (
        <ConfirmDialog
          title="Clear bill?"
          message="Do you want to remove all items from this bill?"
          confirmLabel="Yes, Clear"
          cancelLabel="No, Keep"
          onConfirm={clearBill}
          onCancel={() => setPendingClearBill(false)}
        />
      )}
      {variantPickerItem && (
        <VariantPickerModal
          item={variantPickerItem}
          getQty={getVariantQty}
          onAdd={handleAddVariant}
          onDecrease={handleDecreaseVariant}
          onClose={() => setVariantPickerItem(null)}
        />
      )}
    </>
  )
}

// Main dashboard
export default function CashierDashboard() {
  const { user, logout } = useAuth()

  const today = formatLocalDateKey()

  const [activeTab,      setActiveTab]      = useState('pos')
  const [historyDate,    setHistoryDate]    = useState(today)
  const [historyOrders,  setHistoryOrders]  = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySummary, setHistorySummary] = useState(null)
  const [onlineOrders,   setOnlineOrders]   = useState([])
  const [onlineLoading,  setOnlineLoading]  = useState(true)
  const [onlineBadge,    setOnlineBadge]    = useState(0)
  const [wsStatus,       setWsStatus]       = useState('connecting')
  const [toastQueue,     setToastQueue]     = useState([])
  const [activeToast,    setActiveToast]    = useState(null)
  const onlineSessionKeysRef = useRef(new Set())
  const seenOnlineSessionKeysRef = useRef(loadSeenOnline())
  const lastOnlineVisitRef = useRef(loadLastOnlineVisit())
  const onlineBootstrapDoneRef = useRef(false)
  const onlineFetchInFlightRef = useRef(false)
  const prevWsStatusRef = useRef('connecting')

  const queueNewOrderToast = useCallback((source) => {
    setToastQueue((prev) => [...prev, buildOrderToast(source)])
  }, [])

  const playNewOrderSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
      osc.onended = () => ctx.close()
    } catch {
      // Ignore browser audio policy errors.
    }
  }, [])

  const showDesktopNewOrder = useCallback((order) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (document.visibilityState === 'visible') return
    if (Notification.permission !== 'granted') return

    const toast = buildOrderToast(order)
    if (toast.kind !== 'order') return
    const n = new Notification('New Online Student Order', {
      body: `${toast.studentName} - ${toast.itemSummary} - ${toast.deliveryType === 'delivery' ? 'Delivery' : 'Takeaway'}`,
    })
    n.onclick = () => {
      window.focus()
      setActiveTab('online')
      setOnlineBadge(0)
      n.close()
    }
  }, [])

  const markSessionAsSeen = useCallback((sessionKey) => {
    if (!sessionKey) return
    if (seenOnlineSessionKeysRef.current.has(sessionKey)) return
    seenOnlineSessionKeysRef.current.add(sessionKey)
    saveSeenOnline(seenOnlineSessionKeysRef.current)
  }, [])

  const notifyUnseenFromSnapshot = useCallback((sessions) => {
    if (!Array.isArray(sessions) || sessions.length === 0) return

    const fallbackBaseline = new Date(Date.now() - RECENT_BOOTSTRAP_NOTIFY_MS)
    const lastVisit = lastOnlineVisitRef.current ? new Date(lastOnlineVisitRef.current) : fallbackBaseline
    const baselineTime = Number.isNaN(lastVisit.getTime()) ? fallbackBaseline.getTime() : lastVisit.getTime()

    const unseen = sessions.filter((s) => {
      if (getOnlineSessionStatus(s) !== 'pending') return false
      const key = s.session_id || `single-${s.orders?.[0]?.id || s.id}`
      if (seenOnlineSessionKeysRef.current.has(key)) return false

      const first = s.orders?.[0] || {}
      const stamp = s.cashier_received_at || s.created_at || first.cashier_received_at || first.created_at || ''
      const sessionTime = stamp ? new Date(stamp).getTime() : 0
      if (!sessionTime) return false

      return sessionTime >= baselineTime
    })
    if (unseen.length === 0) return

    const capped = unseen.slice(0, 4)
    capped.forEach((s) => {
      const key = s.session_id || `single-${s.orders?.[0]?.id || s.id}`
      const first = s.orders?.[0] || {}
      const toastOrder = {
        id: first.id || s.id || key,
        session_id: s.session_id || null,
        student_name: s.student_name || first.student_name || 'Student',
        package_label: first.package_label || first.item_name || first.meal_type_name || 'Order',
        item_name: first.item_name || '',
        meal_type_name: first.meal_type_name || '',
        quantity: first.quantity || 1,
        delivery_type: s.delivery_type || first.delivery_type || 'takeaway',
        created_at: s.created_at || first.created_at || new Date().toISOString(),
        cashier_received_at: s.cashier_received_at || first.cashier_received_at || new Date().toISOString(),
      }

      markSessionAsSeen(key)
      queueNewOrderToast(toastOrder)
    })

    if (unseen.length > capped.length) {
      const extra = unseen.length - capped.length
      queueNewOrderToast({
        variant: 'aggregate',
        count: extra,
        created_at: new Date().toISOString(),
      })
    }

    setOnlineBadge((c) => c + unseen.length)
    playNewOrderSound()
    if (unseen[0]) {
      showDesktopNewOrder(unseen[0])
    }
  }, [markSessionAsSeen, playNewOrderSound, queueNewOrderToast, showDesktopNewOrder])

  useEffect(() => {
    if (activeToast || toastQueue.length === 0) return
    setActiveToast(toastQueue[0])
    setToastQueue((prev) => prev.slice(1))
  }, [toastQueue, activeToast])

  useEffect(() => {
    if (!activeToast) return undefined
    const timer = setTimeout(() => setActiveToast(null), 10000)
    return () => clearTimeout(timer)
  }, [activeToast])

  useEffect(() => {
    if (activeTab !== 'online') return
    if (onlineBadge === 0) return
    setOnlineBadge(0)
  }, [activeTab, onlineBadge])

  useEffect(() => {
    const next = new Set()
    onlineOrders.forEach((s) => {
      const key = s.session_id || `single-${s.orders?.[0]?.id || s.id}`
      next.add(key)
    })
    onlineSessionKeysRef.current = next
  }, [onlineOrders])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!('Notification' in window)) return undefined
    if (Notification.permission !== 'default') return undefined

    const requestOnFirstClick = () => {
      Notification.requestPermission().catch(() => {})
    }

    window.addEventListener('click', requestOnFirstClick, { once: true })
    return () => window.removeEventListener('click', requestOnFirstClick)
  }, [])

  const refreshOnlineOrders = useCallback(async ({ showLoading = false, markVisit = false } = {}) => {
    if (onlineFetchInFlightRef.current) return
    onlineFetchInFlightRef.current = true
    if (showLoading) setOnlineLoading(true)
    try {
      const { data } = await getOnlineOrders()
      setOnlineOrders(data)
      notifyUnseenFromSnapshot(data)
      if (markVisit) {
        const openedAt = new Date().toISOString()
        lastOnlineVisitRef.current = openedAt
        saveLastOnlineVisit(openedAt)
      }
    } catch {
      // Ignore sync errors and keep the latest known snapshot.
    } finally {
      onlineFetchInFlightRef.current = false
      if (showLoading) setOnlineLoading(false)
    }
  }, [notifyUnseenFromSnapshot])

  useEffect(() => {
    let alive = true
    ;(async () => {
      await refreshOnlineOrders({ showLoading: true, markVisit: true })
      if (alive) onlineBootstrapDoneRef.current = true
    })()
    return () => {
      alive = false
    }
  }, [refreshOnlineOrders])

  useEffect(() => {
    const previous = prevWsStatusRef.current
    prevWsStatusRef.current = wsStatus

    if (!onlineBootstrapDoneRef.current) return
    if (wsStatus !== 'connected') return
    if (previous !== 'reconnecting' && previous !== 'offline') return

    void refreshOnlineOrders({ showLoading: false, markVisit: false })
  }, [wsStatus, refreshOnlineOrders])

  const handleNewOrder = useCallback((order) => {
    // If this session was hidden (cleared), unhide it so the new order shows
    const sid = order.session_id || ''
    const key = sid || `single-${order.id}`
    const hidden = getHidden()
    if (hidden.has(key)) {
      hidden.delete(key)
      saveHidden(hidden)
    }
    const isNewSession = !onlineSessionKeysRef.current.has(key)
    if (isNewSession) onlineSessionKeysRef.current.add(key)
    setOnlineOrders((prev) => {
      if (sid) {
        const existing = prev.find((s) => s.session_id === sid)
        if (existing) {
          if (existing.orders.find((o) => o.id === order.id)) return prev
          return prev.map((s) => s.session_id === sid
            ? {
              ...s,
              order_reference: s.order_reference || order.order_reference || '-',
              bill_number: s.bill_number || order.bill_number || '',
              delivery_fee: s.delivery_fee ?? order.delivery_fee ?? '0.00',
              cashier_received_at: s.cashier_received_at || order.cashier_received_at || new Date().toISOString(),
              orders: [...s.orders, { ...order, cashier_received_at: order.cashier_received_at || new Date().toISOString() }],
            }
            : s
          )
        }
        return [{ session_id: sid, student_name: order.student_name, student_email: order.student_email,
          order_reference: order.order_reference || '-',
          bill_number: order.bill_number || '',
          created_at: order.created_at, delivery_type: order.delivery_type, delivery_address: order.delivery_address,
          cashier_received_at: order.cashier_received_at || new Date().toISOString(),
          delivery_fee: order.delivery_fee ?? '0.00', phone_number: order.phone_number, status: order.status,
          orders: [{ ...order, cashier_received_at: order.cashier_received_at || new Date().toISOString() }] }, ...prev]
      }
      // No session - standalone
      if (prev.find((s) => !s.session_id && s.orders[0]?.id === order.id)) return prev
      return [{ session_id: null, student_name: order.student_name, student_email: order.student_email,
        order_reference: order.order_reference || '-',
        bill_number: order.bill_number || '',
        created_at: order.created_at, delivery_type: order.delivery_type, delivery_address: order.delivery_address,
        cashier_received_at: order.cashier_received_at || new Date().toISOString(),
        delivery_fee: order.delivery_fee ?? '0.00', phone_number: order.phone_number, status: order.status,
        orders: [{ ...order, cashier_received_at: order.cashier_received_at || new Date().toISOString() }] }, ...prev]
    })
    if (isNewSession) {
      markSessionAsSeen(key)
      setOnlineBadge((c) => c + 1)
      queueNewOrderToast(order)
      playNewOrderSound()
      showDesktopNewOrder(order)
    }
  }, [markSessionAsSeen, playNewOrderSound, queueNewOrderToast, showDesktopNewOrder])

  const handleOrderUpdated = useCallback((order) => {
    setOnlineOrders((prev) => prev.map((s) => ({
      ...s,
      order_reference: s.order_reference || order.order_reference || '-',
      bill_number: s.bill_number || order.bill_number || '',
      delivery_fee: s.orders.some((o) => o.id === order.id) ? (order.delivery_fee ?? s.delivery_fee ?? '0.00') : s.delivery_fee,
      orders: s.orders.map((o) => o.id === order.id ? { ...o, ...order } : o),
      status: s.orders.some((o) => o.id === order.id) ? order.status : s.status,
      cashier_received_at: order.cashier_received_at || s.cashier_received_at,
      confirmed_at: order.confirmed_at || s.confirmed_at,
      completed_at: order.completed_at || s.completed_at,
      cancelled_at: order.cancelled_at || s.cancelled_at,
    })))
  }, [])

  useOrderSocket({
    onNewOrder: handleNewOrder,
    onOrderUpdated: handleOrderUpdated,
    onStatusChange: setWsStatus,
  })

  const fetchHistory = useCallback(async (date) => {
    setHistoryLoading(true)
    try {
      const [ordersRes, billsRes, summaryRes] = await Promise.all([
        getPosOrders(date),
        getWalkInBills(),
        getDailySummary(date),
      ])
      const walkInNormalized = billsRes.data
        .filter((b) => formatLocalDateKey(b.generated_at) === date)
        .map(normalizeWalkInBillForHistory)
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

      {/* Sidebar */}
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
            <span>Online Orders</span>
            {onlineBadge > 0 && (
              <span className="cd-nav-badge">{onlineBadge > 99 ? '99+' : onlineBadge}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('package-prep')} className={`cd-nav-item${activeTab === 'package-prep' ? ' active' : ''}`}>
            Meal Package Prep
          </button>
          <button onClick={() => setActiveTab('history')} className={`cd-nav-item${activeTab === 'history' ? ' active' : ''}`}>
            Bill History
          </button>
        </nav>

        <div className="cd-sidebar-footer">
          <button onClick={logout} className="cd-logout-btn">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="cd-main">
        <header className="cd-topbar">
          <div>
            <div className="cd-topbar-title">
              {activeTab === 'online' ? 'Online Orders' : activeTab === 'package-prep' ? 'Meal Package Prep' : activeTab === 'history' ? 'Bill History' : 'Walk-in Sale'}
            </div>
            <div className="cd-topbar-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="cd-topbar-right">
            <span className={`cd-live-pill ${wsStatus}`}>
              <span className="cd-live-pill-dot" />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'reconnecting' ? 'Reconnecting' : 'Connecting'}
            </span>
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
              onBillUpdated={() => fetchHistory(historyDate)}
            />
          ) : activeTab === 'online' ? (
            <OnlineOrdersPanel
              orders={onlineOrders}
              setOrders={setOnlineOrders}
              loading={onlineLoading}
              newBadge={onlineBadge}
              setNewBadge={setOnlineBadge}
            />
          ) : activeTab === 'package-prep' ? (
            <MealPackagePrepPanel
              orders={onlineOrders}
              setOrders={setOnlineOrders}
              onOrdersSynced={notifyUnseenFromSnapshot}
            />
          ) : (
            <WalkinSaleTab onBillCreated={(data) => {
              const normalized = normalizeWalkInBillForHistory(data)
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

      <NewOrderToast
        toast={activeToast}
        onOpen={() => {
          setActiveTab('online')
          setOnlineBadge(0)
          setActiveToast(null)
        }}
        onClose={() => setActiveToast(null)}
      />

    </div>
  )
}

