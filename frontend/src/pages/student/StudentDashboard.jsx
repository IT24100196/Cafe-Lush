import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChefHat,
  Clock3,
  HandPlatter,
  History,
  Home,
  LogOut,
  MapPinned,
  MessageSquare,
  BarChart2,
  Minus,
  MoonStar,
  Package2,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Truck,
  User,
  UtensilsCrossed,
  Vegan,
  X,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  getMealTypes, getMealOrders, placeMealOrdersBatch,
  getNotifications, markNotificationsRead, getStudentItems,
  getWeeklyMealPlan, submitSuggestion, updateProfile, clearOrderHistory,
} from '../../api/endpoints'
import { Spinner, Badge, EmptyState, Toast } from '../../components/UI'
import { useApi } from '../../hooks/useApi'
import { useCountdown } from '../../hooks/useCountdown'
import './StudentDashboard.css'

const T = {
  espresso:   '#3D2314',
  latte:      '#C4956A',
  coffeeMid:  '#7B4F2E',
  coffee:     '#2C1A0E',
  caramel:    '#D4A853',
  cream:      '#F0E6D3',
  creamWhite: '#FDFAF6',
  creamLight: '#F7F1E8',
  creamDark:  '#EDE0CC',
  textMuted:  '#9B8B7A',
  textLight:  '#B8A898',
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 700,
      color: T.coffeeMid,
      marginBottom: '6px',
      letterSpacing: '0.3px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </label>
  )
}

// ── Delivery helpers ──────────────────────────────────────────────────────────
const RESTAURANT_LAT = 6.9271
const RESTAURANT_LNG = 79.8612

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getDeliveryCharge(distanceKm) {
  if (distanceKm <= 2)  return { charge: 0,    label: 'Free' }
  if (distanceKm <= 5)  return { charge: 150,  label: 'LKR 150' }
  if (distanceKm <= 10) return { charge: 300,  label: 'LKR 300' }
  return { charge: null, label: 'Outside delivery zone' }
}

// ── Delivery Modal ────────────────────────────────────────────────────────────
function DeliveryModal({ onConfirm, onCancel }) {
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [qty, setQty] = useState(1)
  const [geoState, setGeoState] = useState('idle') // idle | loading | done | error
  const [distanceInfo, setDistanceInfo] = useState(null) // { km, charge, label }
  const [geoError, setGeoError] = useState('')

  const formFilled = address.trim() && phone.trim() && qty >= 1

  const handleCheckDistance = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setGeoState('loading')
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversine(RESTAURANT_LAT, RESTAURANT_LNG, pos.coords.latitude, pos.coords.longitude)
        const { charge, label } = getDeliveryCharge(km)
        setDistanceInfo({ km, charge, label })
        setGeoState('done')
      },
      () => {
        setGeoError('Could not get your location. Please allow location access and try again.')
        setGeoState('error')
      }
    )
  }

  const isOutsideZone = distanceInfo?.charge === null
  const canConfirm = formFilled && geoState === 'done' && !isOutsideZone

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">Delivery Details</h3>
          <p className="sd-modal-sub">Enter your delivery information below.</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          background: '#fffbeb', border: '1.5px solid #fcd34d',
          borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#92400e',
        }}>
          <Truck size={16} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <span style={{ fontWeight: 700, display: 'block', marginBottom: '3px' }}>Please enter your actual delivery address</span>
            <span style={{ fontWeight: 400, lineHeight: 1.5 }}>
              Make sure to include your building name, room/flat number, street, and any landmark so our delivery team can find you easily.
            </span>
          </div>
        </div>

        <div>
          <label className="sd-field-label">Number of Packages</label>
          <input
            className="sd-input"
            style={{ width: '100px' }}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="sd-field-label">
            Delivery Address <span style={{ color: '#E24B4A' }}>*</span>
          </label>
          <textarea
            className="sd-input"
            style={{ resize: 'none' }}
            rows={3}
            placeholder="Enter your full delivery address…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="sd-field-label">
            Phone Number <span style={{ color: '#E24B4A' }}>*</span>
          </label>
          <input
            className="sd-input"
            type="tel"
            placeholder="+94 77 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* ── Delivery Charge Step ── */}
        <div style={{ marginTop: '4px' }}>
          <label className="sd-field-label">Delivery Charge</label>
          {geoState === 'idle' || geoState === 'error' ? (
            <>
              <button
                type="button"
                className="sd-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                disabled={!formFilled}
                title={!formFilled ? 'Fill in address and phone first' : ''}
                onClick={handleCheckDistance}
              >
                <MapPinned size={15} strokeWidth={2.2} />
                Check Delivery Charge
              </button>
              {geoError && (
                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>{geoError}</p>
              )}
              {!formFilled && (
                <p style={{ fontSize: '11px', color: T.textMuted, marginTop: '5px' }}>Fill in address &amp; phone first</p>
              )}
            </>
          ) : geoState === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.textMuted }}>
              <Spinner size="sm" /> Detecting your location…
            </div>
          ) : (
            <div style={{
              borderRadius: '10px',
              border: `1.5px solid ${isOutsideZone ? '#fca5a5' : '#86efac'}`,
              background: isOutsideZone ? '#fef2f2' : '#f0fdf4',
              padding: '12px 14px',
              fontSize: '13px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: T.textMuted, fontWeight: 600 }}>Distance</span>
                <span style={{ fontWeight: 700, color: T.espresso }}>{distanceInfo.km.toFixed(2)} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: T.textMuted, fontWeight: 600 }}>Zone</span>
                <span style={{ fontWeight: 700, color: T.espresso }}>
                  {distanceInfo.km <= 2 ? '0–2 km' : distanceInfo.km <= 5 ? '2–5 km' : distanceInfo.km <= 10 ? '5–10 km' : 'Beyond 10 km'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: T.textMuted, fontWeight: 600 }}>Delivery Charge</span>
                <span style={{ fontWeight: 800, color: isOutsideZone ? '#dc2626' : '#16a34a' }}>
                  {distanceInfo.label}
                </span>
              </div>
              {isOutsideZone && (
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                  Sorry, your location is outside our delivery zone (max 10 km).
                </p>
              )}
            </div>
          )}
        </div>

        <div className="sd-modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button type="button" className="sd-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="sd-btn-primary"
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                quantity: qty,
                delivery_address: address.trim(),
                phone_number: phone.trim(),
              })
            }
          >
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Cutoff helper ─────────────────────────────────────────────────────────────
function getCutoffDate(mealTypeName, orderDate) {
  if (!mealTypeName || !orderDate) return null
  const date = new Date(orderDate)
  const name = mealTypeName.toLowerCase()

  if (name === 'breakfast') {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    d.setHours(20, 0, 0, 0)
    return d
  }

  if (name === 'dinner') {
    const d = new Date(date)
    d.setHours(12, 0, 0, 0)
    return d
  }

  return null
}

// ── Today's Meal Modal ───────────────────────────────────────────────────────
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SLOT_META = {
  breakfast_veg: {
    label: 'Veg Breakfast',
    icon: Sun,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.2)',
  },
  breakfast_nonveg: {
    label: 'Non-Veg Breakfast',
    icon: Sun,
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.07)',
    border: 'rgba(220,38,38,0.18)',
  },
  dinner_veg: {
    label: 'Veg Dinner',
    icon: MoonStar,
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.07)',
    border: 'rgba(29,78,216,0.18)',
  },
  dinner_nonveg: {
    label: 'Non-Veg Dinner',
    icon: MoonStar,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.07)',
    border: 'rgba(124,58,237,0.18)',
  },
  lunch_nonveg: {
    label: 'Special Lunch',
    icon: Sun,
    color: '#EA580C',
    bg: 'rgba(234,88,12,0.07)',
    border: 'rgba(234,88,12,0.18)',
  },
}

function TodayMealModal({ plan, onClose }) {
  const todayJs = new Date().getDay()
  const todayKey = todayJs === 0 ? 6 : todayJs - 1
  const dayName = DAY_NAMES[todayKey]

  const slots = Object.values(plan).filter((s) => {
    if (s.meal_time === 'lunch') return (todayKey === 5 || todayKey === 6) && s.day_of_week === 5
    return s.day_of_week === todayKey
  })

  const ORDER = ['breakfast_veg', 'breakfast_nonveg', 'dinner_veg', 'dinner_nonveg', 'lunch_nonveg']
  const sorted = ORDER
    .map((key) => slots.find((s) => `${s.meal_time}_${s.meal_category}` === key))
    .filter(Boolean)

  return createPortal(
    <div className="sd-modal-overlay" onClick={onClose}>
      <div
        className="sd-modal"
        style={{ maxWidth: '420px', padding: '20px 22px', marginTop: 'var(--topbar-height)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sd-modal-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <h3 className="sd-modal-title" style={{ fontSize: '15px' }}>
              Today's Meal Packages
            </h3>
            <p className="sd-modal-sub" style={{ fontSize: '12px' }}>
              {dayName} — available packages for today
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.textMuted,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {sorted.length === 0 ? (
          <p style={{ textAlign: 'center', color: T.textMuted, padding: '32px 0', fontSize: '13px' }}>
            No meal packages configured for today.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sorted.map((slot) => {
              const key = `${slot.meal_time}_${slot.meal_category}`
              const meta = SLOT_META[key] || {
                label: key,
                icon: UtensilsCrossed,
                color: T.latte,
                bg: 'rgba(196,149,106,0.08)',
                border: 'rgba(196,149,106,0.2)',
              }

              const SlotIcon = meta.icon || UtensilsCrossed
              const slotIconEl = <SlotIcon size={16} strokeWidth={2.2} color={meta.color} />

              return (
                <div
                  key={key}
                  style={{
                    borderRadius: '10px',
                    border: `1.5px solid ${meta.border}`,
                    background: meta.bg,
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {slotIconEl}
                      <span style={{ fontWeight: 700, fontSize: '12px', color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: T.caramel }}>
                      Rs. {slot.price}
                    </span>
                  </div>

                  {slot.dishes.length === 0 ? (
                    <p style={{ fontSize: '12px', color: T.textMuted, fontStyle: 'italic' }}>
                      No dishes listed yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {slot.dishes.map((dish, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '100px',
                            background: 'rgba(255,255,255,0.7)',
                            border: `1px solid ${meta.border}`,
                            color: meta.color,
                          }}
                        >
                          {dish}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button className="sd-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Add Menu Items prompt ─────────────────────────────────────────────────────
function AddMenuItemsPrompt({ onYes, onNo }) {
  return createPortal(
    <div className="sd-modal-overlay" onClick={onNo}>
      <div className="sd-modal" style={{ maxWidth: '380px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: T.creamLight,
              border: `1.5px solid ${T.creamDark}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UtensilsCrossed size={28} color={T.espresso} strokeWidth={2.2} />
          </div>
        </div>

        <h3 className="sd-modal-title" style={{ marginBottom: '8px' }}>Add Menu Items?</h3>
        <p className="sd-modal-sub" style={{ marginBottom: '24px' }}>
          Would you like to add menu items from our café to this order?
        </p>

        <div className="sd-modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="sd-btn-secondary" onClick={onNo}>
            No, Place Order
          </button>
          <button type="button" className="sd-btn-primary" onClick={onYes}>
            Yes, Add Items
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Panel 1 — Meal Packages ───────────────────────────────────────────────────
function MealPackagesPanel({ mealTypes, loadingTypes, onPackageReady, weeklyPlan }) {
  const [form, setForm] = useState({
    meal_type: '',
    preference: '',
    order_date: '',
    delivery_type: 'takeaway',
    quantity: 1,
  })
  const [error, setError] = useState('')
  const [showMealMenu, setShowMealMenu] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)

  const selectedType = mealTypes.find((t) => t.id === Number(form.meal_type))
  const cutoffDate = getCutoffDate(selectedType?.name, form.order_date)
  const { timeLeft, isPast } = useCountdown(cutoffDate)

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]
  const isPastNoon = new Date().getHours() >= 12
  const minDate = (selectedType?.name?.toLowerCase() === 'dinner' && isPastNoon) ? tomorrow : today

  const canPickDate = form.meal_type && form.preference

  const handleOrder = async (e) => {
    e.preventDefault()
    if (!form.meal_type || !form.preference) {
      setError('Please select a meal type and preference first.')
      return
    }
    if (isPast) {
      setError(
        selectedType?.name?.toLowerCase() === 'breakfast'
          ? 'Cutoff passed. Breakfast must be ordered before 8:00 PM the previous day.'
          : 'Cutoff passed. Dinner must be ordered before 12:00 PM on the same day.'
      )
      return
    }
    if (selectedType?.name?.toLowerCase() === 'dinner' && isPastNoon && form.order_date === today) {
      setError('It is past 12:00 PM — dinner can only be ordered for tomorrow or later.')
      return
    }
    if (form.delivery_type === 'delivery') {
      setShowDelivery(true)
      return
    }
    buildPayloadAndPrompt(form.quantity, '', '')
  }

  const buildPayloadAndPrompt = (quantity, delivery_address, phone_number) => {
    const payload = {
      meal_type: Number(form.meal_type),
      order_date: form.order_date,
      delivery_type: form.delivery_type,
      quantity,
      delivery_address,
      phone_number,
      order_type: 'package',
      preference: form.preference,
    }
    setPendingPayload(payload)
    setShowPrompt(true)
  }

  const handlePromptNo = () => {
    setShowPrompt(false)
    onPackageReady(pendingPayload, false)
    setForm({ meal_type: '', preference: '', order_date: '', delivery_type: 'takeaway', quantity: 1 })
    setPendingPayload(null)
  }

  const handlePromptYes = () => {
    setShowPrompt(false)
    onPackageReady(pendingPayload, true)
    setForm({ meal_type: '', preference: '', order_date: '', delivery_type: 'takeaway', quantity: 1 })
    setPendingPayload(null)
  }

  return (
    <div className="sd-panel">
      <div
        className="sd-panel-header"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <div>
          <h2 className="sd-panel-title">Meal Packages</h2>
          <p className="sd-panel-subtitle">Select a package and schedule your meal</p>
        </div>
        <button className="sd-btn-see-meal" onClick={() => setShowMealMenu(true)}>
          <UtensilsCrossed size={16} strokeWidth={2.2} />
          <span>See Today's Meals</span>
        </button>
      </div>

      {!loadingTypes && (
        <div className="sd-pkg-grid">
          {mealTypes.map((t) => {
            const isBreakfast = t.name.toLowerCase() === 'breakfast'
            return (
              <div key={t.id} className="sd-pkg-card">
                <div className="sd-pkg-card-top">
                  <div>
                    <p className="sd-pkg-name">{t.name}</p>
                    <p className="sd-pkg-rule">
                      {isBreakfast ? 'Order before 8:00 PM previous day' : 'Order before 12:00 PM same day'}
                    </p>
                  </div>
                  <div
                    className="sd-pkg-card-img-placeholder"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isBreakfast ? (
                      <Sun size={22} strokeWidth={2.2} color={T.caramel} />
                    ) : (
                      <MoonStar size={22} strokeWidth={2.2} color={T.caramel} />
                    )}
                  </div>
                </div>

                <div className="sd-pkg-tags">
                  <span className="sd-pkg-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Package2 size={14} strokeWidth={2.2} />
                    Takeaway ~30 min
                  </span>
                  <span className="sd-pkg-tag delivery" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={14} strokeWidth={2.2} />
                    Delivery available
                  </span>
                  <span className="sd-pkg-tag veg" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Vegan size={14} strokeWidth={2.2} />
                    Veg
                  </span>
                  <span className="sd-pkg-tag nonveg" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ChefHat size={14} strokeWidth={2.2} />
                    Non-Veg
                  </span>
                </div>

                <div className="sd-pkg-card-footer">
                  <span className="sd-pkg-footer-name">{t.name} Package</span>
                  <span className="sd-pkg-footer-price">
                    Rs. {t.price ? Number(t.price).toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <div className="sd-alert error">{error}</div>}

      <form onSubmit={handleOrder}>
        <div className="sd-form-grid">
          <div>
            <label className="sd-field-label">Meal Package</label>
            <select
              className="sd-select"
              value={form.meal_type}
              required
              onChange={(e) => {
                const selected = mealTypes.find((t) => t.id === Number(e.target.value))
                const clearDate = selected?.name?.toLowerCase() === 'dinner' && isPastNoon && form.order_date === today
                setForm({ ...form, meal_type: e.target.value, order_date: clearDate ? '' : form.order_date })
                setError('')
              }}
            >
              <option value="">Select meal type…</option>
              {mealTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="sd-field-label">Preference</label>
            <select
              className="sd-select"
              value={form.preference}
              required
              onChange={(e) => {
                setForm({ ...form, preference: e.target.value })
                setError('')
              }}
            >
              <option value="">Select preference…</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
            </select>
          </div>

          <div>
            <label className="sd-field-label">Order Date</label>
            <input
              className="sd-input"
              type="date"
              min={minDate}
              value={form.order_date}
              required
              disabled={!canPickDate}
              title={!canPickDate ? 'Select meal type and preference first' : ''}
              style={!canPickDate ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
              onChange={(e) => setForm({ ...form, order_date: e.target.value })}
            />
            {!canPickDate && (
              <p className="sd-input-hint">Select meal type &amp; preference first</p>
            )}
            {canPickDate && selectedType?.name?.toLowerCase() === 'dinner' && isPastNoon && (
              <p className="sd-input-hint warning">Past 12:00 PM — earliest dinner order is tomorrow.</p>
            )}
          </div>
        </div>

        <label className="sd-field-label">Order Type</label>
        <div className="sd-ot-grid">
          {[
            { value: 'takeaway', label: 'Takeaway', sub: 'Pick up in ~30 min', icon: Package2 },
            { value: 'delivery', label: 'Delivery', sub: 'Deliver to address', icon: Truck },
          ].map(({ value, label, sub, icon }) => {
            const OtIcon = icon
            return (
            <button
              key={value}
              type="button"
              className={`sd-ot-card${form.delivery_type === value ? ' selected' : ''}`}
              onClick={() => setForm({ ...form, delivery_type: value, quantity: 1 })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <OtIcon size={16} strokeWidth={2.2} />
                <p className="sd-ot-name" style={{ margin: 0 }}>{label}</p>
              </div>
              <p className="sd-ot-sub">{sub}</p>
            </button>
            )
          })}
        </div>

        <button type="submit" className="sd-btn-primary" disabled={isPast}>
          Place Order
        </button>
      </form>

      {timeLeft && (
        <div
          className={isPast ? 'sd-countdown expired' : 'sd-countdown active'}
          style={{
            flexDirection: 'column', alignItems: 'stretch', gap: '10px',
            padding: '14px 16px', marginTop: '14px',
          }}
        >
          {/* Top row: icon + headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPast
              ? <X size={18} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              : <Clock3 size={18} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              {selectedType?.name?.toLowerCase() === 'breakfast' ? (
                isPast ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Order window closed</span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Breakfast for <strong>{new Date(form.order_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> had to be ordered by{' '}
                      <strong>8:00 PM on {new Date(new Date(form.order_date + 'T00:00:00').setDate(new Date(form.order_date + 'T00:00:00').getDate() - 1)).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>.
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>
                      Order by <strong>8:00 PM on {new Date(new Date(form.order_date + 'T00:00:00').setDate(new Date(form.order_date + 'T00:00:00').getDate() - 1)).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
                    </span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Breakfast for <strong>{new Date(form.order_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> — order must be placed the evening before.
                    </span>
                  </>
                )
              ) : (
                isPast ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Order window closed</span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Dinner for <strong>{new Date(form.order_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> had to be ordered by <strong>12:00 PM on the same day</strong>.
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>
                      Order by <strong>12:00 PM on {new Date(form.order_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
                    </span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Dinner orders close at noon on the day of the meal.
                    </span>
                  </>
                )
              )}
            </div>
            {/* Live timer badge */}
            {!isPast && (
              <div style={{
                flexShrink: 0, background: 'rgba(0,0,0,0.08)',
                borderRadius: '8px', padding: '6px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1 }}>
                  {timeLeft.split(' ').slice(0, 2).join(' ')}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.7, marginTop: '2px' }}>
                  {timeLeft.split(' ').slice(2).join(' ')}
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {!isPast && cutoffDate && (() => {
            const isBreakfast = selectedType?.name?.toLowerCase() === 'breakfast'
            const windowMs = isBreakfast ? 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000
            const remaining = Math.max(0, new Date(cutoffDate) - Date.now())
            const pct = Math.min(100, (remaining / windowMs) * 100)
            const barColor = pct > 50 ? '#16a34a' : pct > 20 ? '#d97706' : '#dc2626'
            return (
              <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '100px', height: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '100px',
                  width: `${pct}%`,
                  background: barColor,
                  transition: 'width 1s linear',
                }} />
              </div>
            )
          })()}
        </div>
      )}

      {showMealMenu && weeklyPlan && (
        <TodayMealModal plan={weeklyPlan} onClose={() => setShowMealMenu(false)} />
      )}

      {showDelivery && (
        <DeliveryModal
          onCancel={() => setShowDelivery(false)}
          onConfirm={({ quantity, delivery_address, phone_number }) => {
            setShowDelivery(false)
            buildPayloadAndPrompt(quantity, delivery_address, phone_number)
          }}
        />
      )}

      {showPrompt && (
        <AddMenuItemsPrompt onYes={handlePromptYes} onNo={handlePromptNo} />
      )}
    </div>
  )
}

// ── Scrolling item name ──────────────────────────────────────────────────────
function ScrollingName({ name }) {
  const spanRef = useRef(null)
  const pRef = useRef(null)

  useEffect(() => {
    const span = spanRef.current
    const p = pRef.current
    if (!span || !p) return
    const overflow = span.scrollWidth - p.clientWidth
    if (overflow > 0) {
      span.classList.add('overflowing')
      span.style.setProperty('--scroll-dist', `-${overflow + 8}px`)
    } else {
      span.classList.remove('overflowing')
    }
  }, [name])

  return (
    <p className="sd-item-name" ref={pRef}>
      <span ref={spanRef}>{name}</span>
    </p>
  )
}

// ── Panel 2 — Menu Items ──────────────────────────────────────────────────────
function MenuItemsPanel({ refetchOrders, pendingPackageOrder, onPackageOrderSent, showToast }) {
  const { data: rawItems = [], loading: loadingItems } = useApi(getStudentItems)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const categories = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = q
      ? rawItems.filter((i) =>
          i.name.toLowerCase().includes(q) ||
          (i.item_id && i.item_id.toLowerCase().includes(q))
        )
      : rawItems

    const map = {}
    filtered.forEach((item) => {
      const cat = item.category_name || 'Other'
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [rawItems, search])

  const cartEntries = Object.values(cart).filter((e) => e.qty > 0)
  const cartTotal = cartEntries.reduce((sum, e) => sum + Number(e.item.price) * e.qty, 0)
  const cartCount = cartEntries.reduce((sum, e) => sum + e.qty, 0)

  const addToCart = (item) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty ?? 0) + 1 },
    }))

  const increaseQty = (item) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: prev[item.id].qty + 1 },
    }))

  const decreaseQty = (item) => {
    const current = cart[item.id]?.qty ?? 0
    if (current <= 1) {
      setCart((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
    } else {
      setCart((prev) => ({
        ...prev,
        [item.id]: { item, qty: prev[item.id].qty - 1 },
      }))
    }
  }

  const handlePlaceOrder = async () => {
    setError('')
    if (cartEntries.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setSubmitting(true)
    try {
      const itemOrders = cartEntries.map(({ item, qty }) => ({
        delivery_type: 'takeaway',
        quantity: qty,
        order_type: 'item',
        item: item.id,
      }))

      const allOrders = pendingPackageOrder ? [pendingPackageOrder, ...itemOrders] : itemOrders
      await placeMealOrdersBatch(allOrders)

      setSuccess(
        pendingPackageOrder
          ? `Meal package + ${cartCount} item${cartCount > 1 ? 's' : ''} ordered successfully!`
          : `${cartCount} item${cartCount > 1 ? 's' : ''} ordered successfully!`
      )

      setCart({})
      onPackageOrderSent()
      refetchOrders()
      showToast(
        pendingPackageOrder
          ? `🎉 Meal package + ${cartCount} item${cartCount > 1 ? 's' : ''} ordered successfully!`
          : `🎉 ${cartCount} item${cartCount > 1 ? 's' : ''} ordered successfully!`
      )
    } catch (err) {
      const d = err.response?.data
      setError(d?.detail || d?.item?.[0] || JSON.stringify(d) || 'Failed to place order.')
      showToast(d?.detail || 'Failed to place order.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sd-panel">
      <div className="sd-panel-header">
        <div>
          <h2 className="sd-panel-title">Menu Items</h2>
          <p className="sd-panel-subtitle">Browse and add items to your cart</p>
        </div>

      </div>

      {pendingPackageOrder && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#166534',
          }}
        >
          <Package2 size={18} strokeWidth={2.2} />
          <span>
            <strong>Meal package order is ready.</strong> Add menu items below and click Place Order to submit everything together.
          </span>
        </div>
      )}

      <div className="sd-search-wrap" style={{ position: 'relative' }}>
        <Search
          size={16}
          strokeWidth={2.2}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9B8B7A',
            pointerEvents: 'none',
          }}
        />
        <input
          className="sd-search"
          type="text"
          placeholder="Search by name or item ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '38px' }}
        />
      </div>

      <div className="sd-menu-layout">
        <div className="sd-items-col">
          {loadingItems ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spinner />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState message="No menu items available right now." />
          ) : (
            categories.map(([catName, items]) => (
              <div key={catName} className="sd-cat-section">
                <p className="sd-cat-label">{catName}</p>
                <div className="sd-items-grid">
                  {items.map((item) => {
                    const inCart = !!cart[item.id]
                    return (
                      <div key={item.id} className={inCart ? 'sd-item-card in-cart' : 'sd-item-card'}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="sd-item-img" />
                        ) : (
                          <div
                            className="sd-item-placeholder"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <UtensilsCrossed size={28} strokeWidth={2.2} color={T.textMuted} />
                          </div>
                        )}

                        <div className="sd-item-body">
                          {item.item_id && <p className="sd-item-id">{item.item_id}</p>}
                          <ScrollingName name={item.name} />
                          <p className="sd-item-price">Rs. {Number(item.price).toFixed(2)}</p>
                        </div>

                        <button
                          className={inCart ? 'sd-add-btn in-cart' : 'sd-add-btn'}
                          onClick={() => addToCart(item)}
                        >
                          {inCart ? (
                            <>
                              <CheckCircle2 size={16} strokeWidth={2.2} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus size={16} strokeWidth={2.2} />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sd-cart">
          <div className="sd-cart-inner">
            <div className="sd-cart-header">
              <span className="sd-cart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} strokeWidth={2.2} />
                Your Cart
              </span>
              {cartCount > 0 && <span className="sd-cart-count">{cartCount}</span>}
            </div>

            <div className="sd-cart-items">
              {cartEntries.length === 0 ? (
                <div className="sd-cart-empty">
                  <span className="sd-cart-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                    <ShoppingCart size={24} strokeWidth={2.2} />
                  </span>
                  <p className="sd-cart-empty-text">No items added yet</p>
                </div>
              ) : (
                cartEntries.map(({ item, qty }) => (
                  <div key={item.id} className="sd-cart-row">
                    <div className="sd-cart-row-info">
                      <p className="sd-cart-row-name">{item.name}</p>
                      <p className="sd-cart-row-subtotal">Rs. {(Number(item.price) * qty).toFixed(2)}</p>
                    </div>
                    <div className="sd-cart-row-right">
                      <div className="sd-cart-qty-controls">
                        <button className="sd-cart-qty-btn" onClick={() => decreaseQty(item)}>
                          <Minus size={14} strokeWidth={2.4} />
                        </button>
                        <span className="sd-cart-qty-num">{qty}</span>
                        <button className="sd-cart-qty-btn" onClick={() => increaseQty(item)}>
                          <Plus size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartEntries.length > 0 && (
              <div className="sd-cart-summary">
                {cartEntries.map(({ item, qty }) => (
                  <div key={item.id} className="sd-cart-summary-row">
                    <span>{item.name} × {qty}</span>
                    <span>Rs. {(Number(item.price) * qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="sd-cart-summary-divider" />
                <div className="sd-cart-summary-total">
                  <span>Total</span>
                  <span>Rs. {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="sd-cart-footer">
              {error && <p className="sd-cart-feedback-error">{error}</p>}
              {success && <p className="sd-cart-feedback-success">{success}</p>}
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || cartEntries.length === 0}
                className={`sd-cart-order-btn ${cartEntries.length > 0 ? 'ready' : 'empty'}`}
              >
                {submitting ? <Spinner size="sm" /> : <HandPlatter size={16} strokeWidth={2.2} />}
                {cartEntries.length === 0
                  ? 'Add items to order'
                  : pendingPackageOrder
                    ? `Place Combined Order (${cartCount} item${cartCount > 1 ? 's' : ''} + pkg)`
                    : `Place Order (${cartCount} item${cartCount > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Panel 3 — Order History ───────────────────────────────────────────────────
function OrderHistoryPanel({ orders, loading, onClear }) {
  const [clearing, setClearing] = useState(false)

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to delete all your order history? This cannot be undone.')) return
    setClearing(true)
    try {
      await clearOrderHistory()
      onClear()
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="sd-panel">
      <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 className="sd-panel-title">Order History</h2>
          <p className="sd-panel-subtitle">All your meal package and menu item orders</p>
        </div>
        {orders.length > 0 && (
          <button
            className="sd-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
            onClick={handleClear}
            disabled={clearing}
          >
            <X size={14} strokeWidth={2.4} />
            {clearing ? 'Clearing…' : 'Clear'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState message="No orders placed yet." />
      ) : (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                {['#', 'Item / Package', 'Date', 'Kind', 'Type', 'Qty', 'Status', 'Pickup / Placed', 'Address'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id}>
                  <td className="sd-table-num" data-label="#">{i + 1}</td>
                  <td className="sd-table-name" data-label="Item / Package">
                    {o.order_type === 'item' ? o.item_name : o.meal_type_name}
                  </td>
                  <td data-label="Date">{o.order_date}</td>
                  <td data-label="Kind">
                    <span className={o.order_type === 'item' ? 'sd-badge item' : 'sd-badge package'}>
                      {o.order_type === 'item' ? 'Item' : 'Package'}
                    </span>
                  </td>
                  <td data-label="Type">
                    <span className={o.delivery_type === 'delivery' ? 'sd-badge delivery' : 'sd-badge takeaway'}>
                      {o.delivery_type === 'delivery' ? 'Delivery' : 'Takeaway'}
                    </span>
                  </td>
                  <td data-label="Qty">{o.quantity}</td>
                  <td data-label="Status"><Badge status={o.status} /></td>
                  <td data-label="Pickup / Placed">
                    {o.delivery_type === 'takeaway' && o.pickup_time
                      ? <span className="sd-table-pickup">{o.pickup_time}</span>
                      : new Date(o.created_at).toLocaleString()}
                  </td>
                  <td data-label="Address" className="sd-table-address">
                    {o.delivery_address || <span className="sd-table-dash">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Panel 4 — Food Analytics ─────────────────────────────────────────────────
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['breakfast', 'dinner', 'lunch']

function generateHabitTags(orders) {
  const tags = []
  const items = orders.filter((o) => o.order_type === 'item')
  const pkgs  = orders.filter((o) => o.order_type === 'package')
  const vegPkgs    = pkgs.filter((o) => o.preference === 'veg')
  const nonVegPkgs = pkgs.filter((o) => o.preference === 'non-veg')
  const breakfasts = pkgs.filter((o) => o.meal_type_name?.toLowerCase() === 'breakfast')
  const dinners    = pkgs.filter((o) => o.meal_type_name?.toLowerCase() === 'dinner')
  const deliveries = orders.filter((o) => o.delivery_type === 'delivery')

  if (vegPkgs.length > nonVegPkgs.length && vegPkgs.length > 2) tags.push({ label: '🥦 Veg Lover', color: '#15803d', bg: 'rgba(21,128,61,0.1)', border: 'rgba(21,128,61,0.25)' })
  if (nonVegPkgs.length > vegPkgs.length && nonVegPkgs.length > 2) tags.push({ label: '🍗 Non-Veg Fan', color: '#b91c1c', bg: 'rgba(185,28,28,0.08)', border: 'rgba(185,28,28,0.2)' })
  if (breakfasts.length > dinners.length && breakfasts.length > 2) tags.push({ label: '🌅 Early Riser', color: '#b45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' })
  if (dinners.length > breakfasts.length && dinners.length > 2) tags.push({ label: '🌙 Night Diner', color: '#4338ca', bg: 'rgba(67,56,202,0.08)', border: 'rgba(67,56,202,0.2)' })
  if (deliveries.length > orders.length * 0.5 && deliveries.length > 2) tags.push({ label: '🚚 Delivery Regular', color: '#0369a1', bg: 'rgba(3,105,161,0.08)', border: 'rgba(3,105,161,0.2)' })
  if (items.length > pkgs.length && items.length > 3) tags.push({ label: '🍽️ À la Carte Fan', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' })
  if (orders.length >= 10) tags.push({ label: '⭐ Regular Customer', color: '#c9a84c', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.3)' })
  if (orders.length >= 20) tags.push({ label: '👑 Loyal Member', color: '#c9a84c', bg: 'rgba(201,168,76,0.15)', border: 'rgba(201,168,76,0.4)' })

  const nameFreq = {}
  items.forEach((o) => { if (o.item_name) nameFreq[o.item_name] = (nameFreq[o.item_name] || 0) + o.quantity })
  const topItem = Object.entries(nameFreq).sort((a, b) => b[1] - a[1])[0]
  if (topItem && topItem[1] >= 3) tags.push({ label: `❤️ Loves ${topItem[0]}`, color: '#be185d', bg: 'rgba(190,24,93,0.08)', border: 'rgba(190,24,93,0.2)' })

  return tags
}

function FoodAnalyticsPanel({ orders }) {
  const confirmed = orders.filter((o) => o.status === 'confirmed')

  // ── Summary ──────────────────────────────────────────────────────────────
  const totalOrders = confirmed.length

  // Most ordered item
  const itemFreq = {}
  confirmed.filter((o) => o.order_type === 'item').forEach((o) => {
    if (o.item_name) itemFreq[o.item_name] = (itemFreq[o.item_name] || 0) + (o.quantity || 1)
  })
  const topItem = Object.entries(itemFreq).sort((a, b) => b[1] - a[1])[0]

  // Monthly spend
  const monthlySpend = {}
  confirmed.forEach((o) => {
    const d = new Date(o.order_date || o.created_at)
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    const spend = (parseFloat(o.unit_price) || 0) * (o.quantity || 1)
    monthlySpend[key] = (monthlySpend[key] || 0) + spend
  })
  const monthEntries = Object.entries(monthlySpend).sort((a, b) => {
    const parse = (s) => { const [m, y] = s.split(' '); return new Date(`${m} 20${y}`) }
    return parse(a[0]) - parse(b[0])
  }).slice(-6)
  const maxMonthVal = Math.max(...monthEntries.map(([, v]) => v), 1)

  // Most ordered items bar chart
  const allItemFreq = {}
  confirmed.forEach((o) => {
    const name = o.order_type === 'item' ? o.item_name : (o.package_label || o.meal_type_name)
    if (name) allItemFreq[name] = (allItemFreq[name] || 0) + (o.quantity || 1)
  })
  const topItems = Object.entries(allItemFreq).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxItemVal = Math.max(...topItems.map(([, v]) => v), 1)

  // Package breakdown donut
  const pkgBreakdown = {}
  confirmed.filter((o) => o.order_type === 'package').forEach((o) => {
    const label = o.package_label || o.meal_type_name || 'Package'
    pkgBreakdown[label] = (pkgBreakdown[label] || 0) + 1
  })
  const pkgEntries = Object.entries(pkgBreakdown).sort((a, b) => b[1] - a[1])
  const pkgTotal   = pkgEntries.reduce((s, [, v]) => s + v, 0)
  const PKG_COLORS = ['#c9a84c', '#c4956a', '#6b3a1f', '#3d2314', '#8b6347', '#d4a853']

  // Heatmap: day × meal
  const heatmap = {}
  DAYS.forEach((d) => { heatmap[d] = {}; MEALS.forEach((m) => { heatmap[d][m] = 0 }) })
  confirmed.filter((o) => o.order_type === 'package').forEach((o) => {
    const date = new Date(o.order_date || o.created_at)
    const dayIdx = (date.getDay() + 6) % 7  // Mon=0
    const day  = DAYS[dayIdx]
    const meal = o.meal_type_name?.toLowerCase() || 'dinner'
    if (heatmap[day] && MEALS.includes(meal)) heatmap[day][meal]++
  })
  const maxHeat = Math.max(...DAYS.flatMap((d) => MEALS.map((m) => heatmap[d][m])), 1)

  // Habit tags
  const habitTags = generateHabitTags(orders)

  // Daily average (orders per active day)
  const activeDays = new Set(confirmed.map((o) => o.order_date || o.created_at?.split('T')[0])).size
  const dailyAvg   = activeDays > 0 ? (totalOrders / activeDays).toFixed(1) : '0'

  if (orders.length === 0) {
    return (
      <div className="sd-panel">
        <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="sd-panel-title">My Food Analytics</h2>
            <p className="sd-panel-subtitle">Insights based on your order history</p>
          </div>
          <TrendingUp size={22} strokeWidth={2.2} color={T.caramel} />
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMuted, fontSize: '13px' }}>
          <BarChart2 size={40} strokeWidth={1.5} color={T.textLight} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No order data yet. Place some orders to see your food analytics!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sd-panel">
      {/* Header */}
      <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="sd-panel-title">My Food Analytics</h2>
          <p className="sd-panel-subtitle">Insights based on your confirmed orders</p>
        </div>
        <TrendingUp size={22} strokeWidth={2.2} color={T.caramel} />
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Orders',   value: totalOrders,          Icon: Package2 },
          { label: 'Favourite Item', value: topItem?.[0] || '—',  Icon: UtensilsCrossed, small: true },
          { label: 'Orders / Day',   value: dailyAvg,             Icon: CalendarDays },
        ].map(({ label, value, Icon, small }) => (
          <div key={label} style={{ background: 'linear-gradient(135deg, #faf6f0, #f5ede0)', border: '1.5px solid #e8d9c5', borderRadius: '14px', padding: '16px 18px' }}>
            <div style={{ marginBottom: '6px' }}><Icon size={20} strokeWidth={2.2} color={T.caramel} /></div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: small ? '14px' : '22px', fontWeight: 800, color: T.espresso, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
            <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '4px', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Top Items Bar Chart ── */}
      {topItems.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Most Ordered</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topItems.map(([name, count], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', fontSize: '11px', fontWeight: 700, color: T.textLight, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: T.espresso, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.caramel, flexShrink: 0 }}>{count}×</span>
                  </div>
                  <div style={{ height: '8px', background: '#f0e8dc', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxItemVal) * 100}%`, background: i === 0 ? T.caramel : i === 1 ? T.latte : '#c4956a88', borderRadius: '100px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Package Breakdown ── */}
      {pkgEntries.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Package Breakdown</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
                {(() => {
                  let offset = 0
                  const r = 32, cx = 45, cy = 45
                  const circ = 2 * Math.PI * r
                  return pkgEntries.map(([label, count], i) => {
                    const pct  = count / pkgTotal
                    const dash = pct * circ
                    const gap  = circ - dash
                    const el = (
                      <circle key={label} cx={cx} cy={cy} r={r}
                        fill="none" stroke={PKG_COLORS[i % PKG_COLORS.length]} strokeWidth="18"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset * circ}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                    )
                    offset += pct
                    return el
                  })
                })()}
                <text x="45" y="49" textAnchor="middle" fontSize="13" fontWeight="800" fill={T.espresso}>{pkgTotal}</text>
              </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              {pkgEntries.map(([label, count], i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: PKG_COLORS[i % PKG_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: T.espresso, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ fontSize: '11px', color: T.textMuted, marginLeft: 'auto', flexShrink: 0 }}>{Math.round((count / pkgTotal) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly Spend ── */}
      {monthEntries.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Monthly Spend</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
            {monthEntries.map(([month, total]) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: T.coffeeMid, marginBottom: '2px' }}>Rs.{Math.round(total)}</span>
                <div style={{ width: '100%', background: T.caramel, borderRadius: '4px 4px 0 0', height: `${(total / maxMonthVal) * 72}px`, minHeight: '4px', transition: 'height 0.5s ease', opacity: 0.85 }} />
                <span style={{ fontSize: '9px', color: T.textMuted, fontWeight: 600 }}>{month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Heatmap ── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Order Activity Heatmap</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '4px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '70px' }} />
                {DAYS.map((d) => <th key={d} style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textAlign: 'center', paddingBottom: '4px' }}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {MEALS.map((meal) => (
                <tr key={meal}>
                  <td style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textTransform: 'capitalize', paddingRight: '8px', whiteSpace: 'nowrap' }}>{meal}</td>
                  {DAYS.map((day) => {
                    const val = heatmap[day][meal]
                    const intensity = val / maxHeat
                    const bg = val === 0
                      ? '#f0e8dc'
                      : `rgba(201,168,76,${0.15 + intensity * 0.85})`
                    return (
                      <td key={day} title={`${day} ${meal}: ${val} orders`}
                        style={{ width: '36px', height: '28px', background: bg, borderRadius: '6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: intensity > 0.5 ? T.espresso : T.textLight, cursor: 'default', transition: 'background 0.3s' }}>
                        {val > 0 ? val : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Habit Tags ── */}
      {habitTags.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Your Eating Habits</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {habitTags.map(({ label, color, bg, border }) => (
              <span key={label} style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '999px', background: bg, color, border: `1.5px solid ${border}` }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Panel 5 — Suggestions ─────────────────────────────────────────────────────
function SuggestionsPanel({ showToast }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await submitSuggestion({ message: message.trim() })
      setMessage('')
      setSent(true)
      showToast('✅ Your suggestion has been sent!')
      setTimeout(() => setSent(false), 4000)
    } catch {
      showToast('Failed to send suggestion. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sd-panel">
      <div className="sd-panel-header">
        <div>
          <h2 className="sd-panel-title">Suggestions</h2>
          <p className="sd-panel-subtitle">Share your feedback or ideas with the admin</p>
        </div>
        <MessageSquare size={22} strokeWidth={2.2} color={T.caramel} />
      </div>

      {sent && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} strokeWidth={2.2} />
          Suggestion sent successfully! Thank you for your feedback.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label className="sd-field-label">Your Suggestion</label>
          <textarea
            className="sd-input"
            rows={5}
            placeholder="Write your suggestion, feedback, or idea here…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            style={{ resize: 'vertical', minHeight: '120px' }}
          />
        </div>
        <button
          type="submit"
          className="sd-btn-primary"
          disabled={submitting || !message.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {submitting ? <Spinner size="sm" /> : <MessageSquare size={16} strokeWidth={2.2} />}
          {submitting ? 'Sending…' : 'Send Suggestion'}
        </button>
      </form>
    </div>
  )
}

// ── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    email:     user?.email     || '',
    full_name: user?.full_name || '',
    contact:   user?.contact   || '',
  })
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await updateProfile({
        email:     form.email.trim(),
        full_name: form.full_name.trim(),
        contact:   form.contact.trim(),
      })
      onSaved(data)
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    { label: 'Username',     value: user?.username },
    { label: 'Full Name',    value: user?.full_name  || '—', field: 'full_name' },
    { label: 'Email',        value: user?.email      || '—', field: 'email',    type: 'email' },
    { label: 'Contact',      value: user?.contact    || '—', field: 'contact',  type: 'tel' },
    { label: 'Role',         value: user?.role?.name || 'Student' },
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
  ]

  return createPortal(
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sd-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: T.latte, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: T.espresso, flexShrink: 0 }}>
              {user?.username?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 700, color: T.espresso }}>{user?.username}</div>
              <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '2px' }}>{user?.role?.name || 'Student'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Body */}
        {editing ? (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {rows.filter((r) => r.field).map(({ label, field, type = 'text' }) => (
                <div key={field}>
                  <label className="sd-field-label">{label}</label>
                  <input
                    className="sd-input"
                    type={type}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={`Enter ${label.toLowerCase()}…`}
                  />
                </div>
              ))}
            </div>
            {error && <div className="sd-alert error" style={{ marginBottom: '14px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="sd-btn-secondary" onClick={() => { setEditing(false); setError('') }}>Cancel</button>
              <button type="submit" className="sd-btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? <Spinner size="sm" /> : <CheckCircle2 size={16} strokeWidth={2.2} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {rows.map(({ label, value }, i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.creamDark}` : 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: T.espresso, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                </div>
              ))}
            </div>
            <button
              className="sd-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
              onClick={() => setEditing(true)}
            >
              <User size={16} strokeWidth={2.2} />
              Edit Profile
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'packages',    label: 'Meal Packages',    Icon: Package2   },
  { key: 'menu',        label: 'Menu Items',        Icon: BookOpen   },
  { key: 'history',     label: 'Order History',     Icon: History    },
  { key: 'analytics',   label: 'My Food Analytics', Icon: BarChart2  },
  { key: 'suggestions', label: 'Suggestions',       Icon: MessageSquare },
]

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, setUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('packages')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await getNotifications()
        setNotifs(data)
      } catch {
        // ignore
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifs.filter((n) => !n.is_read).length

  const handleOpenNotifs = async () => {
    setShowNotifs(true)
    if (unreadCount > 0) {
      try {
        await markNotificationsRead()
        setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
      } catch {
        // ignore
      }
    }
  }

  const { data: mealTypes = [], loading: loadingTypes } = useApi(getMealTypes)
  const { data: orders = [], loading: loadingOrders, refetch: refetchOrders } = useApi(getMealOrders)

  const [weeklyPlan, setWeeklyPlan] = useState({})
  const [pendingPackageOrder, setPendingPackageOrder] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  useEffect(() => {
    getWeeklyMealPlan()
      .then(({ data }) => {
        const obj = {}
        data.forEach((s) => {
          obj[`${s.day_of_week}_${s.meal_time}_${s.meal_category}`] = s
        })
        setWeeklyPlan(obj)
      })
      .catch(() => {})
  }, [])

  const handlePackageReady = async (payload, addMenuItems) => {
    if (addMenuItems) {
      setPendingPackageOrder(payload)
      setActiveTab('menu')
    } else {
      try {
        await placeMealOrdersBatch([payload])
        refetchOrders()
        showToast('🎉 Your order has been placed successfully!')
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to place order.', 'error')
      }
    }
  }

  return (
    <div className="sd-root">
      <aside className="sd-sidebar">
        <div className="sd-brand">
          <div className="sd-brand-logo">
            <img
              src="/image/image6.jpeg"
              alt="Shantha logo"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 0 0 2.5px #C9A84C, 0 0 14px rgba(201,168,76,0.35)',
              }}
            />
            <div>
              <div className="sd-brand-name">Cafe Lush</div>
              <div className="sd-brand-sub">Student Portal</div>
            </div>
          </div>
        </div>

        <div className="sd-user">
          <div className="sd-avatar">
            {user?.username?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <div className="sd-username">{user?.username}</div>
            <div className="sd-userrole">Student</div>
          </div>
        </div>

        <nav className="sd-nav">
          <div className="sd-nav-label">My Portal</div>

          {TABS.map(({ key, label, Icon }) => {
            const TabIcon = Icon
            return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`sd-nav-item${activeTab === key ? ' active' : ''}`}
              style={{ width: '100%', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <TabIcon size={16} strokeWidth={2.2} />
              <span>{label}</span>
              {key === 'menu' && pendingPackageOrder && (
                <span className="sd-nav-badge" style={{ background: '#3D6B38', marginLeft: 'auto' }}>
                  +pkg
                </span>
              )}
              {key === 'history' && orders.length > 0 && !pendingPackageOrder && (
                <span className="sd-nav-badge" style={{ marginLeft: 'auto' }}>
                  {orders.length}
                </span>
              )}
              {key === 'history' && orders.length > 0 && pendingPackageOrder && (
                <span className="sd-nav-badge">
                  {orders.length}
                </span>
              )}
            </button>
            )
          })}
        </nav>

        <div className="sd-sidebar-footer">
          <button onClick={logout} className="sd-logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} strokeWidth={2.2} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="sd-bottom-nav">
        {TABS.map(({ key, label, Icon }) => {
          const NavIcon = Icon
          return (
            <button
              key={key}
              className={`sd-bottom-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <NavIcon size={20} strokeWidth={2.2} />
              <span>{label.split(' ')[0]}</span>
              {key === 'menu' && pendingPackageOrder && (
                <span className="sd-bottom-nav-badge">+</span>
              )}
            </button>
          )
        })}
        <button className="sd-bottom-nav-item" onClick={logout}>
          <LogOut size={20} strokeWidth={2.2} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sd-main">
        <header className="sd-topbar">
          <div>
            <h1 className="sd-topbar-title">
              {TABS.find((t) => t.key === activeTab)?.label}
            </h1>
            <p className="sd-topbar-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sd-topbar-welcome">
              Welcome back, <strong>{user?.username}</strong>
            </div>

            {/* Notification icon */}
            <div style={{ position: 'relative' }}>
              <button className="sd-topbar-icon-btn" onClick={handleOpenNotifs}>
                <Bell size={18} strokeWidth={2.2} />
                {unreadCount > 0 && <span className="sd-topbar-notif-dot">{unreadCount}</span>}
              </button>
              {showNotifs && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNotifs(false)} />
                  <div className="sd-topbar-dropdown" style={{ right: 0, left: 'auto', minWidth: '300px' }}>
                    <div className="sd-notif-header">
                      <span className="sd-notif-title">Notifications</span>
                      <button onClick={() => setShowNotifs(false)} className="sd-notif-close">
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                    <div className="sd-notif-list">
                      {notifs.length === 0 ? (
                        <p className="sd-notif-empty">No notifications yet.</p>
                      ) : (
                        notifs.map((n) => (
                          <div key={n.id} className={n.is_read ? 'sd-notif-item' : 'sd-notif-item unread'}>
                            <p className="sd-notif-msg">{n.message}</p>
                            <p className="sd-notif-time">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile icon */}
            <div style={{ position: 'relative' }}>
              <button className="sd-topbar-icon-btn" onClick={() => setShowProfile((p) => !p)}>
                <User size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </header>

        {showProfile && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onSaved={(updated) => { setUser(updated); localStorage.setItem('user', JSON.stringify(updated)); setShowProfile(false) }}
          />
        )}

        <main className="sd-content">
          {activeTab === 'packages' && (
            <MealPackagesPanel
              mealTypes={mealTypes}
              loadingTypes={loadingTypes}
              onPackageReady={handlePackageReady}
              weeklyPlan={weeklyPlan}
            />
          )}

          {activeTab === 'menu' && (
            <MenuItemsPanel
              refetchOrders={refetchOrders}
              pendingPackageOrder={pendingPackageOrder}
              onPackageOrderSent={() => setPendingPackageOrder(null)}
              showToast={showToast}
            />
          )}

          {activeTab === 'history' && (
            <OrderHistoryPanel orders={orders} loading={loadingOrders} onClear={refetchOrders} />
          )}

          {activeTab === 'analytics' && (
            <FoodAnalyticsPanel orders={orders} />
          )}

          {activeTab === 'suggestions' && (
            <SuggestionsPanel showToast={showToast} />
          )}
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}