import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChefHat,
  Clock3,
  Coffee,
  Facebook,
  HandPlatter,
  History,
  Instagram,
  LogOut,
  Mail,
  Menu as MenuIcon,
  MapPin,
  MapPinned,
  MessageCircle,
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
import { useAuth } from '../../context/authContextCore'
import {
  getMealTypes, getMealOrders, placeMealOrdersBatch, getDeliveryAreas, estimateDeliveryFee,
  getNotifications, markAllNotificationsRead, markNotificationRead,
  deleteNotification, deleteAllNotifications, deleteSelectedNotifications, getStudentItems,
  getWeeklyMealPlan, submitSuggestion, updateProfile, clearOrderHistory, cancelStudentOrder,
} from '../../api/endpoints'
import { EMAIL_MAX_LENGTH, FULL_NAME_MAX_LENGTH, isValidEmail, isValidFullName, isValidSriLankanMobile, normalizePhone } from '../../api/validation'
import { Spinner, Badge, EmptyState, Toast, ConfirmDialog } from '../../components/UI'
import { useApi } from '../../hooks/useApi'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
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
const ADDRESS_CORRECTIONS = {
  'jaffna uni': 'University of Jaffna',
  'jaffna university': 'University of Jaffna',
  'thirunalveli': 'Thirunelveli',
  'thirunelweli': 'Thirunelveli',
  'thirunaveli': 'Thirunelveli',
  'tirunelveli': 'Thirunelveli',
  'univercity of jaffna': 'University of Jaffna',
  'university jaffna': 'University of Jaffna',
  'uni of jaffna': 'University of Jaffna',
}

function normalizeDeliveryAddressPart(value) {
  let cleaned = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/^,\s*|\s*,\s*$/g, '')

  Object.entries(ADDRESS_CORRECTIONS)
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([wrong, correct]) => {
      cleaned = cleaned.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct)
    })

  return cleaned
}

function formatDeliveryAddress({ addressLine1 = '', addressLine2 = '', cityArea = '' }) {
  return [addressLine1, addressLine2, cityArea]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
}

function normalizeAreaSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPackageReadyTime(mealTypeName) {
  const normalized = String(mealTypeName || '').trim().toLowerCase()
  if (normalized === 'breakfast') return '7:30 AM'
  if (normalized === 'dinner') return '7:00 PM'
  return ''
}

function getPackageReadyText(mealTypeName) {
  const readyTime = getPackageReadyTime(mealTypeName)
  return readyTime
    ? `Takeaway or delivery at ${readyTime}`
    : 'Takeaway or delivery at the scheduled time'
}

const MENU_ITEM_ORDER_HOURS_MESSAGE = 'Menu item orders are available from 4:00 AM to 11:30 PM.'
const SHOP_CLOSED_DIALOG_MESSAGE = 'Cafe Lush is closed for menu item orders right now. Orders are available from 4:00 AM to 11:30 PM. Please come back during opening hours.'
const MAX_PACKAGE_QUANTITY = 10

function sanitizePackageQuantityInput(value, previousValue = '') {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''

  const normalized = String(Number(digits))
  if (normalized === '0') return ''
  if (Number(normalized) > MAX_PACKAGE_QUANTITY) return previousValue
  return normalized
}

function isMenuItemOrderOpen(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes()
  return minutes >= 4 * 60 && minutes <= 23 * 60 + 30
}

function getPackageCancelCutoff(orderDate, mealTypeName) {
  if (!orderDate) return null
  const normalized = String(mealTypeName || '').trim().toLowerCase()
  const cutoff = new Date(`${orderDate}T00:00:00`)
  if (Number.isNaN(cutoff.getTime())) return null

  if (normalized === 'breakfast') {
    cutoff.setDate(cutoff.getDate() - 1)
    cutoff.setHours(21, 0, 0, 0)
    return cutoff
  }
  if (normalized === 'dinner') {
    cutoff.setHours(23, 0, 0, 0)
    return cutoff
  }
  return null
}

function getPackageCancelInfo(packageOrder, isCombined = false) {
  if (!packageOrder) return null
  const mealName = packageOrder.meal_type_name || 'Meal package'
  const normalized = mealName.trim().toLowerCase()
  const cutoff = getPackageCancelCutoff(packageOrder.order_date, mealName)
  const ruleText = normalized === 'breakfast'
    ? 'Breakfast package orders can be cancelled before 9:00 PM on the previous day.'
    : normalized === 'dinner'
      ? 'Dinner package orders can be cancelled before 11:00 PM on the same day.'
      : 'This meal package cannot be cancelled online.'
  const cutoffText = cutoff
    ? `Cancellation closes at ${cutoff.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}.`
    : ''
  const combinedText = isCombined
    ? 'Cancelling will cancel the package and all menu items in this order.'
    : ''

  return {
    canCancelNow: Boolean(cutoff) && new Date() < cutoff,
    ruleText,
    cutoffText,
    combinedText,
  }
}

function OrderMethodModal({ onSelect, onCancel }) {
  useBodyScrollLock()

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">Choose Order Method</h3>
          <p className="sd-modal-sub">Select how you would like to receive this order.</p>
        </div>

        <div className="sd-ot-grid">
          {[
            { value: 'takeaway', label: 'Takeaway', sub: 'Pick up in about 30 minutes', icon: Package2 },
            { value: 'delivery', label: 'Delivery', sub: 'Deliver to your address', icon: Truck },
          ].map(({ value, label, sub, icon }) => {
            const MethodIcon = icon
            return (
              <button
                key={value}
                type="button"
                className="sd-ot-card"
                style={{ textAlign: 'left' }}
                onClick={() => onSelect(value)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <MethodIcon size={16} strokeWidth={2.2} />
                  <p className="sd-ot-name" style={{ margin: 0 }}>{label}</p>
                </div>
                <p className="sd-ot-sub">{sub}</p>
              </button>
            )
          })}
        </div>

        <div className="sd-modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button type="button" className="sd-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Delivery Modal ────────────────────────────────────────────────────────────
function DeliveryModal({
  onConfirm,
  onCancel,
  showQuantity = true,
  quantityLabel = 'Number of Packages',
  title = 'Delivery Details',
  subtitle = 'Enter your delivery information below.',
  confirmLabel = 'Confirm Delivery',
  allowCurrentLocation = false,
  requireFeeEstimate = false,
  autoEstimateFee = false,
  hasPackage = false,
  noticeTitle = 'Add a complete delivery address',
  noticeText = 'Include your building, room or flat number, street, and area so our delivery team can find you easily.',
  deliveryIncludedText = '',
}) {
  useBodyScrollLock()

  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState(null)
  const [areaMenuOpen, setAreaMenuOpen] = useState(false)
  const [deliveryAreas, setDeliveryAreas] = useState([])
  const [areasState, setAreasState] = useState('loading')
  const [areasError, setAreasError] = useState('')
  const [phone, setPhone] = useState('')
  const [qty, setQty] = useState('1')
  const [feeState, setFeeState] = useState('idle') // idle | loading | ready | error
  const [feeInfo, setFeeInfo] = useState(null)
  const [feeError, setFeeError] = useState('')
  const [locationSource, setLocationSource] = useState('address')
  const [coords, setCoords] = useState({ lat: null, lng: null })
  const [locationRequested, setLocationRequested] = useState(false)

  const normalizedPhone = normalizePhone(phone)
  const packageQty = Number(qty)
  const isQtyValid = Number.isInteger(packageQty) && packageQty >= 1 && packageQty <= MAX_PACKAGE_QUANTITY
  const isPhoneValid = isValidSriLankanMobile(phone)
  const cleanAddressLine1 = normalizeDeliveryAddressPart(addressLine1)
  const cleanAddressLine2 = normalizeDeliveryAddressPart(addressLine2)
  const cleanCityArea = selectedArea?.name || ''
  const cleanAreaQuery = normalizeDeliveryAddressPart(areaQuery)
  const hasRequiredAddress = Boolean(cleanAddressLine1) && Boolean(cleanCityArea)
  const fullAddress = formatDeliveryAddress({
    addressLine1: cleanAddressLine1,
    addressLine2: cleanAddressLine2,
    cityArea: cleanCityArea,
  })
  const formValid = hasRequiredAddress && isPhoneValid && (!showQuantity || isQtyValid)
  const canEstimate = hasRequiredAddress
  const validationHint = showQuantity
    ? 'Fill the address, a valid Sri Lankan mobile number, and quantity first'
    : 'Fill the address and a valid Sri Lankan mobile number first'

  const resetEstimate = () => {
    if (!requireFeeEstimate) return
    setFeeState('idle')
    setFeeInfo(null)
    setFeeError('')
  }

  useEffect(() => {
    let active = true
    setAreasState('loading')
    setAreasError('')
    getDeliveryAreas()
      .then(({ data }) => {
        if (!active) return
        setDeliveryAreas(Array.isArray(data?.areas) ? data.areas : [])
        setAreasState('ready')
      })
      .catch(() => {
        if (!active) return
        setDeliveryAreas([])
        setAreasState('error')
        setAreasError('Could not load delivery areas. Please try again.')
      })
    return () => {
      active = false
    }
  }, [])

  const filteredAreas = useMemo(() => {
    const query = normalizeAreaSearchText(cleanAreaQuery)
    if (!query) return []
    const matches = query
      ? deliveryAreas.filter((area) => {
          const searchable = [area.name, ...(Array.isArray(area.aliases) ? area.aliases : [])]
            .map(normalizeAreaSearchText)
            .join(' ')
          return searchable.includes(query)
        })
      : []
    return matches.slice(0, 12)
  }, [cleanAreaQuery, deliveryAreas])

  const selectDeliveryArea = (area) => {
    setSelectedArea(area)
    setAreaQuery(area.name)
    setAreaMenuOpen(false)
    resetEstimate()
  }

  const handleAreaQueryChange = (value) => {
    setAreaQuery(value)
    setAreaMenuOpen(true)
    setSelectedArea(null)
    resetEstimate()
  }

  const handleLocationSourceChange = (source) => {
    setLocationSource(source)
    setFeeState('idle')
    setFeeInfo(null)
    setFeeError('')
    if (source === 'address') {
      setCoords({ lat: null, lng: null })
      setLocationRequested(false)
    } else {
      setLocationRequested(true)
    }
  }

  const fetchDeliveryFee = useCallback(async (source, nextCoords = coords) => {
    if (!canEstimate) return
    setFeeState('loading')
    setFeeError('')
    try {
      const payload = {
        delivery_type: 'delivery',
        has_package: hasPackage,
        address_line_1: cleanAddressLine1,
        address_line_2: cleanAddressLine2,
        city_area: cleanCityArea,
        location_source: source,
      }
      if (source === 'current_location') {
        if (nextCoords.lat == null || nextCoords.lng == null) {
          throw new Error('Current location is required to calculate the delivery fee.')
        }
        payload.delivery_latitude = nextCoords.lat
        payload.delivery_longitude = nextCoords.lng
      }
      const { data } = await estimateDeliveryFee(payload)
      setFeeInfo(data)
      setFeeState('ready')
    } catch (err) {
      setFeeInfo(null)
      setFeeState('error')
      setFeeError(err.response?.data?.detail || err.message || 'Failed to calculate the delivery fee.')
    }
  }, [canEstimate, cleanAddressLine1, cleanAddressLine2, cleanCityArea, coords, hasPackage])

  const handleUseCurrentLocation = useCallback(() => {
    setLocationRequested(true)
    if (!navigator.geolocation) {
      setFeeState('error')
      setFeeError('Geolocation is not supported by your browser.')
      return
    }
    setFeeState('loading')
    setFeeError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }
        setCoords(nextCoords)
        void fetchDeliveryFee('current_location', nextCoords)
      },
      () => {
        setFeeState('error')
        setFeeError('Could not get your location. Please allow location access and try again.')
      }
    )
  }, [fetchDeliveryFee])

  useEffect(() => {
    if (!requireFeeEstimate || !autoEstimateFee) return

    if (!hasRequiredAddress) {
      setFeeState('idle')
      setFeeInfo(null)
      setFeeError('')
      return
    }

    if (feeState === 'loading') return

    if (locationSource === 'current_location') {
      if (coords.lat != null && coords.lng != null) {
        if (feeState !== 'idle') return
        const timer = setTimeout(() => {
          void fetchDeliveryFee('current_location', { lat: coords.lat, lng: coords.lng })
        }, 400)
        return () => clearTimeout(timer)
      }
      if (!locationRequested) return
      handleUseCurrentLocation()
      return
    }

    if (feeState !== 'idle') return

    const timer = setTimeout(() => {
      void fetchDeliveryFee('address')
    }, 700)

    return () => clearTimeout(timer)
  }, [
    requireFeeEstimate,
    autoEstimateFee,
    hasRequiredAddress,
    addressLine1,
    addressLine2,
    selectedArea,
    locationSource,
    locationRequested,
    coords.lat,
    coords.lng,
    feeState,
    fetchDeliveryFee,
    handleUseCurrentLocation,
  ])

  const selectedSourceLabel = locationSource === 'current_location' ? 'current location' : 'typed address'
  const currentLocationReady = locationSource !== 'current_location' || (coords.lat != null && coords.lng != null)
  const canConfirm = requireFeeEstimate
    ? formValid && feeState === 'ready' && Boolean(feeInfo) && currentLocationReady
    : formValid

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal sd-delivery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">{title}</h3>
          <p className="sd-modal-sub">{subtitle}</p>
        </div>

        <div className="sd-delivery-modal-body">
          <div className="sd-delivery-note">
            <span className="sd-delivery-note-icon">
              <Truck size={16} strokeWidth={2.2} />
            </span>
            <div>
              <span className="sd-delivery-note-title">{noticeTitle}</span>
              <span className="sd-delivery-note-text">{noticeText}</span>
            </div>
          </div>

          {showQuantity && (
            <div>
              <label className="sd-field-label">{quantityLabel}</label>
              <input
                className="sd-input sd-quantity-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={qty}
                onChange={(e) => setQty((current) => sanitizePackageQuantityInput(e.target.value, current))}
                onBlur={() => {
                  if (!isQtyValid) setQty('1')
                }}
              />
              <p className="sd-field-hint">Maximum {MAX_PACKAGE_QUANTITY} packages per order.</p>
              {!isQtyValid && (
                <p className="sd-field-error">Quantity must be between 1 and {MAX_PACKAGE_QUANTITY}.</p>
              )}
            </div>
          )}

          <div>
            <label className="sd-field-label">
              Address Line 1 <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input
              className="sd-input"
              type="text"
              placeholder="House / building / street"
              value={addressLine1}
              onChange={(e) => {
                setAddressLine1(e.target.value)
                resetEstimate()
              }}
            />
          </div>

          <div>
            <label className="sd-field-label">Address Line 2</label>
            <input
              className="sd-input"
              type="text"
              placeholder="Apartment, floor, block (optional)"
              value={addressLine2}
              onChange={(e) => {
                setAddressLine2(e.target.value)
                resetEstimate()
              }}
            />
          </div>

          <div>
            <label className="sd-field-label">
              Delivery Area <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <div className="sd-area-combobox">
              <input
                className="sd-input"
                type="text"
                placeholder={areasState === 'loading' ? 'Loading delivery areas...' : 'Example: Kokuvil'}
                value={areaQuery}
                disabled={areasState === 'loading'}
                onFocus={() => setAreaMenuOpen(true)}
                onBlur={() => setTimeout(() => setAreaMenuOpen(false), 120)}
                onChange={(e) => handleAreaQueryChange(e.target.value)}
                autoComplete="off"
              />
              {selectedArea && (
                <button
                  type="button"
                  className="sd-area-clear"
                  aria-label="Clear delivery area"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAreaQueryChange('')}
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              )}
              {areaMenuOpen && areasState === 'ready' && Boolean(cleanAreaQuery) && !selectedArea && (
                <div className="sd-area-options">
                  {filteredAreas.length > 0 ? filteredAreas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className="sd-area-option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectDeliveryArea(area)}
                    >
                      <span>{area.name}</span>
                    </button>
                  )) : (
                    <div className="sd-area-empty">No allowed delivery area found.</div>
                  )}
                </div>
              )}
            </div>
            {areasError && <p className="sd-field-error">{areasError}</p>}
            {!selectedArea && areasState === 'ready' && (
              <p className="sd-field-hint">Start typing and choose one of the allowed delivery areas.</p>
            )}
            {selectedArea && (
              <p className="sd-field-hint">Selected: {selectedArea.name}</p>
            )}
          </div>

          <div>
            <label className="sd-field-label">
              Phone Number <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input
              className="sd-input"
              type="tel"
              placeholder="0771234567"
              value={phone}
              onChange={(e) => setPhone(normalizePhone(e.target.value))}
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]*"
            />
            {phone.trim() && !isPhoneValid && (
              <p className="sd-field-error">
                Enter a valid Sri Lankan mobile number with exactly 10 digits (example: 0771234567).
              </p>
            )}
          </div>

          {!requireFeeEstimate && deliveryIncludedText && (
            <div className="sd-delivery-included">
              <CheckCircle2 size={16} strokeWidth={2.3} />
              <span>{deliveryIncludedText}</span>
            </div>
          )}

          {requireFeeEstimate && (
            <div className="sd-delivery-fee">
              {allowCurrentLocation && (
                <div className="sd-location-source">
                  <label className="sd-field-label">Calculate Fee Using</label>
                  <button
                    type="button"
                    className={`sd-location-source-card${locationSource === 'address' ? ' selected' : ''}`}
                    onClick={() => handleLocationSourceChange('address')}
                  >
                    <MapPin size={16} strokeWidth={2.3} />
                    <span>
                      <strong>Typed Address</strong>
                      <em>Use the address fields below.</em>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`sd-location-source-card${locationSource === 'current_location' ? ' selected' : ''}`}
                    onClick={() => handleLocationSourceChange('current_location')}
                  >
                    <MapPinned size={16} strokeWidth={2.3} />
                    <span>
                      <strong>Current Location</strong>
                      <em>Use your device GPS for distance.</em>
                    </span>
                  </button>
                </div>
              )}

              <label className="sd-field-label">Delivery Charge</label>

              {!autoEstimateFee && (
                <div className="sd-delivery-fee-actions">
                  <button
                    type="button"
                    className="sd-btn-secondary sd-delivery-fee-btn"
                    disabled={!canEstimate || feeState === 'loading'}
                    title={!canEstimate ? 'Fill address line 1 and delivery area first' : ''}
                    onClick={() => void fetchDeliveryFee('address')}
                  >
                    <Truck size={15} strokeWidth={2.2} />
                    Calculate Using Address
                  </button>
                  {allowCurrentLocation && (
                    <button
                      type="button"
                      className="sd-btn-secondary sd-delivery-fee-btn"
                      disabled={!canEstimate || feeState === 'loading'}
                      title={!canEstimate ? 'Fill address line 1 and delivery area first' : ''}
                      onClick={() => {
                        handleLocationSourceChange('current_location')
                        if (canEstimate) handleUseCurrentLocation()
                      }}
                    >
                      <MapPinned size={15} strokeWidth={2.2} />
                      Use Current Location
                    </button>
                  )}
                </div>
              )}

              {!canEstimate && (
                <p className="sd-field-hint">
                  Fill address line 1 and delivery area to calculate the delivery fee.
                </p>
              )}

              {feeState === 'loading' && (
                <div className="sd-delivery-loading">
                  <Spinner size="sm" /> Calculating from your {selectedSourceLabel}...
                </div>
              )}

              {feeError && (
                <p className="sd-field-error">{feeError}</p>
              )}

              {feeState === 'ready' && feeInfo && (
                <div className="sd-delivery-fee-result">
                  <div className="sd-delivery-fee-row">
                    <span>Delivery Charge</span>
                    <strong className="sd-delivery-fee-total">
                      {feeInfo.delivery_fee_label}
                    </strong>
                  </div>
                </div>
              )}

              {feeState !== 'ready' && canEstimate && !feeError && (
                <p className="sd-field-hint">
                  {autoEstimateFee
                    ? locationSource === 'current_location'
                      ? 'We will use your device location for distance. The typed address is still needed for the delivery team.'
                      : 'Delivery fee will calculate automatically after you enter address line 1 and delivery area.'
                    : validationHint}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="sd-modal-footer sd-delivery-modal-footer">
          <button type="button" className="sd-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="sd-btn-primary"
            disabled={!canConfirm}
            onClick={() => {
              const payload = {
                delivery_address: fullAddress,
                address_line_1: cleanAddressLine1,
                address_line_2: cleanAddressLine2,
                city_area: cleanCityArea,
                phone_number: normalizedPhone,
                location_source: requireFeeEstimate ? locationSource : 'address',
              }
              if (requireFeeEstimate && locationSource === 'current_location') {
                payload.delivery_latitude = coords.lat
                payload.delivery_longitude = coords.lng
              }
              if (showQuantity) payload.quantity = packageQty
              onConfirm(payload)
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function TakeawayModal({
  onConfirm,
  onCancel,
  showQuantity = true,
  quantityLabel = 'Number of Packages',
  title = 'Takeaway Details',
  subtitle = 'Add package quantity and contact details before placing the order.',
  noteLabel = 'Pickup Person Details (Optional)',
  notePlaceholder = 'Example: Pickup person name - Nimal, contact - 0771234567',
  confirmLabel = 'Continue',
}) {
  useBodyScrollLock()

  const [qty, setQty] = useState('1')
  const [phone, setPhone] = useState('')
  const [pickupNote, setPickupNote] = useState('')

  const normalizedPhone = normalizePhone(phone)
  const packageQty = Number(qty)
  const isQtyValid = Number.isInteger(packageQty) && packageQty >= 1 && packageQty <= MAX_PACKAGE_QUANTITY
  const isPhoneValid = isValidSriLankanMobile(phone)
  const canConfirm = (!showQuantity || isQtyValid) && isPhoneValid

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">{title}</h3>
          <p className="sd-modal-sub">{subtitle}</p>
        </div>

        {showQuantity && (
          <div>
            <label className="sd-field-label">
              {quantityLabel} <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input
              className="sd-input"
              style={{ width: '120px' }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qty}
              onChange={(e) => setQty((current) => sanitizePackageQuantityInput(e.target.value, current))}
              onBlur={() => {
                if (!isQtyValid) setQty('1')
              }}
            />
            <p className="sd-field-hint">Maximum {MAX_PACKAGE_QUANTITY} packages per order.</p>
            {!isQtyValid && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>Quantity must be between 1 and {MAX_PACKAGE_QUANTITY}.</p>
            )}
          </div>
        )}

        <div>
          <label className="sd-field-label">
            Phone Number <span style={{ color: '#E24B4A' }}>*</span>
          </label>
          <input
            className="sd-input"
            type="tel"
            placeholder="0771234567"
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value))}
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]*"
          />
          {phone.trim() && !isPhoneValid && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
              Enter a valid Sri Lankan mobile number with exactly 10 digits (example: 0771234567).
            </p>
          )}
        </div>

        <div>
          <label className="sd-field-label">{noteLabel}</label>
          <textarea
            className="sd-input"
            rows={3}
            style={{ resize: 'none' }}
            placeholder={notePlaceholder}
            value={pickupNote}
            onChange={(e) => setPickupNote(e.target.value)}
          />
        </div>

        <div className="sd-modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button type="button" className="sd-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="sd-btn-primary"
            disabled={!canConfirm}
            onClick={() => {
              const payload = {
                phone_number: normalizedPhone,
                pickup_note: pickupNote.trim(),
              }
              if (showQuantity) payload.quantity = packageQty
              onConfirm(payload)
            }}
          >
            {confirmLabel}
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

function toInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function TodayMealModal({ plan, onClose }) {
  useBodyScrollLock()

  const today = new Date()
  const todayDate = toInputDate(today)
  const maxPackageDate = toInputDate(addDays(today, 3))
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`)
  const selectedDayJs = Number.isNaN(selectedDateObj.getTime()) ? new Date().getDay() : selectedDateObj.getDay()
  const selectedDayKey = selectedDayJs === 0 ? 6 : selectedDayJs - 1
  const dayName = DAY_NAMES[selectedDayKey]
  const isToday = selectedDate === todayDate
  const selectedDateLabel = Number.isNaN(selectedDateObj.getTime())
    ? dayName
    : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const slots = Object.values(plan).filter((s) => {
    if (s.meal_time === 'lunch') return (selectedDayKey === 5 || selectedDayKey === 6) && s.day_of_week === 5
    return s.day_of_week === selectedDayKey
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
              Meal Packages
            </h3>
            <p className="sd-modal-sub" style={{ fontSize: '12px' }}>
              {isToday ? `${dayName} - available packages for today` : `${selectedDateLabel} - available packages`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <CalendarDays size={14} strokeWidth={2.2} color={T.textMuted} />
              <input
                type="date"
                min={todayDate}
                max={maxPackageDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1.5px solid #e5d8c8',
                  background: '#fff',
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: T.espresso,
                }}
              />
            </div>
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
            No meal packages configured for this date.
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
function AddMenuItemsPrompt({ onAddItems, onPlaceOnly, onCancel }) {
  useBodyScrollLock()

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal sd-package-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="sd-package-prompt-icon">
          <Package2 size={30} strokeWidth={2.2} />
        </div>

        <h3 className="sd-package-prompt-title">Package Details Ready</h3>
        <p className="sd-package-prompt-text">
          Your meal package details are saved for this checkout. Add cafe items to the same order, or place the package only now.
        </p>

        <div className="sd-package-prompt-note">
          <CheckCircle2 size={15} strokeWidth={2.3} />
          <span>No extra delivery fee is added for this meal package checkout.</span>
        </div>

        <div className="sd-package-prompt-actions">
          <button type="button" className="sd-btn-primary sd-package-prompt-primary" onClick={onAddItems}>
            <ShoppingCart size={16} strokeWidth={2.3} />
            Add Cafe Items
          </button>
          <button type="button" className="sd-btn-secondary sd-package-prompt-secondary" onClick={onPlaceOnly}>
            <Package2 size={15} strokeWidth={2.3} />
            Place Package Only
          </button>
          <button type="button" className="sd-package-prompt-back" onClick={onCancel}>
            Back
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function formatOrderSuccessDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDeliveryFeeLabel(value, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  const fee = Number(value)
  if (!Number.isFinite(fee)) return fallback
  return fee === 0 ? 'Free' : `LKR ${fee.toFixed(2)}`
}

function getPackageSummaryLine(payload, mealTypes = []) {
  const mealType = mealTypes.find((type) => Number(type.id) === Number(payload?.meal_type))
  const mealName = mealType?.name || 'Meal Package'
  const preference = payload?.preference === 'non-veg' ? 'Non-Veg' : payload?.preference === 'veg' ? 'Veg' : ''
  return {
    name: preference ? `${preference} ${mealName}` : mealName,
    qty: Number(payload?.quantity) || 1,
    date: payload?.order_date || '',
  }
}

function getPackageReadyTextFromPayload(payload, mealTypes = []) {
  const mealType = mealTypes.find((type) => Number(type.id) === Number(payload?.meal_type))
  return getPackageReadyText(mealType?.name)
}

function OrderSuccessModal({ order, onClose, onViewHistory }) {
  useBodyScrollLock()

  if (!order) return null

  const isDelivery = order.method === 'delivery'
  const methodLabel = isDelivery ? 'Delivery' : 'Takeaway'
  const methodDetail = isDelivery
    ? order.deliveryAddress || 'Delivery address saved'
    : order.pickupDetails || 'Pickup from Cafe Lush'

  return createPortal(
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal sd-order-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-order-success-hero">
          <div className="sd-order-success-icon">
            <CheckCircle2 size={34} strokeWidth={2.25} />
          </div>
          <p className="sd-order-success-kicker">Order Submitted</p>
          <h3 className="sd-order-success-title">{order.title}</h3>
          <p className="sd-order-success-text">{order.message}</p>
        </div>

        <div className="sd-order-success-body">
          <div className="sd-order-success-section">
            <div className="sd-order-success-section-title">
              <Package2 size={16} strokeWidth={2.3} />
              Order Summary
            </div>
            <div className="sd-order-success-lines">
              {order.lines.map((line, index) => (
                <div key={`${line.name}-${index}`} className="sd-order-success-line">
                  <div>
                    <strong>{line.name}</strong>
                    {line.date && <span>{formatOrderSuccessDate(line.date)}</span>}
                  </div>
                  <em>x{line.qty}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="sd-order-success-details">
            <div>
              <span>Method</span>
              <strong>{methodLabel}</strong>
            </div>
            <div>
              <span>{isDelivery ? 'Delivery' : 'Pickup'}</span>
              <strong>{methodDetail}</strong>
            </div>
            {order.phoneNumber && (
              <div>
                <span>Phone</span>
                <strong>{order.phoneNumber}</strong>
              </div>
            )}
            {isDelivery && (
              <div>
                <span>Delivery Fee</span>
                <strong>{order.deliveryFeeLabel || 'Calculated at checkout'}</strong>
              </div>
            )}
          </div>

          <div className="sd-order-success-next">
            <Bell size={16} strokeWidth={2.2} />
            <span>Cafe Lush will review your order. You will receive a notification when it is confirmed.</span>
          </div>
        </div>

        <div className="sd-order-success-actions">
          <button type="button" className="sd-btn-primary" onClick={onViewHistory}>
            <History size={16} strokeWidth={2.3} />
            View Order History
          </button>
          <button type="button" className="sd-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Panel 1 - Meal Packages ───────────────────────────────────────────────────
function MealPackagesPanel({ mealTypes, loadingTypes, onPackageReady, weeklyPlan, refetchWeeklyPlan }) {
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
  const [showTakeaway, setShowTakeaway] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [openingMealMenu, setOpeningMealMenu] = useState(false)

  const selectedType = mealTypes.find((t) => t.id === Number(form.meal_type))
  const cutoffDate = getCutoffDate(selectedType?.name, form.order_date)
  const { timeLeft, isPast } = useCountdown(cutoffDate)

  const todayDate = new Date()
  const today = toInputDate(todayDate)
  const tomorrow = toInputDate(addDays(todayDate, 1))
  const maxDate = toInputDate(addDays(todayDate, 3))
  const isPastNoon = new Date().getHours() >= 12
  const minDate = (selectedType?.name?.toLowerCase() === 'dinner' && isPastNoon) ? tomorrow : today
  const cardDate = form.order_date || today
  const cardDateObj = new Date(`${cardDate}T00:00:00`)
  const cardDayJs = Number.isNaN(cardDateObj.getTime()) ? new Date().getDay() : cardDateObj.getDay()
  const cardDayKey = cardDayJs === 0 ? 6 : cardDayJs - 1

  const canPickDate = form.meal_type && form.preference

  useEffect(() => {
    if (!canPickDate) return

    setForm((prev) => {
      const needsDefault =
        !prev.order_date ||
        prev.order_date < minDate ||
        prev.order_date > maxDate

      if (!needsDefault) return prev

      return {
        ...prev,
        order_date: minDate,
      }
    })
  }, [canPickDate, minDate, maxDate])

  const getPlanPrice = (mealTime, mealCategory) => {
    const normalizedMeal = mealTime?.toLowerCase()
    if (!normalizedMeal) return null
    const dayKey = normalizedMeal === 'lunch' && (cardDayKey === 5 || cardDayKey === 6)
      ? 5
      : cardDayKey
    const slot = weeklyPlan?.[`${dayKey}_${normalizedMeal}_${mealCategory}`]
    if (slot?.price === null || slot?.price === undefined || slot?.price === '') return null
    const priceNum = Number(slot.price)
    return Number.isFinite(priceNum) ? priceNum.toFixed(2) : null
  }

  const getCardPriceLabel = (mealTypeName) => {
    const mealTime = mealTypeName?.toLowerCase()
    const vegPrice = getPlanPrice(mealTime, 'veg')
    const nonVegPrice = getPlanPrice(mealTime, 'nonveg')

    if (vegPrice && nonVegPrice) {
      return vegPrice === nonVegPrice
        ? `LKR ${vegPrice}`
        : `Veg LKR ${vegPrice} | Non-Veg LKR ${nonVegPrice}`
    }
    if (vegPrice) return `Veg LKR ${vegPrice}`
    if (nonVegPrice) return `Non-Veg LKR ${nonVegPrice}`
    return 'LKR price updating...'
  }

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
    if (form.order_date < minDate || form.order_date > maxDate) {
      setError('Meal packages can only be ordered from today up to 3 days ahead.')
      return
    }
    if (selectedType?.name?.toLowerCase() === 'dinner' && isPastNoon && form.order_date === today) {
      setError('It is past 12:00 PM - dinner can only be ordered for tomorrow or later.')
      return
    }
    if (form.delivery_type === 'delivery') {
      setShowDelivery(true)
      return
    }
    setShowTakeaway(true)
  }

  const buildPayloadAndPrompt = ({
    quantity,
    detailsText = '',
    phoneNumber = '',
    addressLine1 = '',
    addressLine2 = '',
    cityArea = '',
    locationSource = 'address',
    deliveryLatitude = null,
    deliveryLongitude = null,
  }) => {
    const payload = {
      meal_type: Number(form.meal_type),
      order_date: form.order_date,
      delivery_type: form.delivery_type,
      quantity,
      delivery_address: detailsText,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city_area: cityArea,
      location_source: locationSource,
      delivery_latitude: deliveryLatitude,
      delivery_longitude: deliveryLongitude,
      phone_number: phoneNumber,
      order_type: 'package',
      preference: form.preference,
    }
    setPendingPayload(payload)
    setShowPrompt(true)
  }

  const handlePromptPlaceOnly = () => {
    setShowPrompt(false)
    onPackageReady(pendingPayload, false)
    setForm({ meal_type: '', preference: '', order_date: '', delivery_type: 'takeaway', quantity: 1 })
    setPendingPayload(null)
  }

  const handlePromptAddItems = () => {
    setShowPrompt(false)
    onPackageReady(pendingPayload, true)
    setForm({ meal_type: '', preference: '', order_date: '', delivery_type: 'takeaway', quantity: 1 })
    setPendingPayload(null)
  }

  const handlePromptCancel = () => {
    setShowPrompt(false)
    setPendingPayload(null)
  }

  const handleOpenMealMenu = async () => {
    setOpeningMealMenu(true)
    try {
      await refetchWeeklyPlan?.()
    } catch {
      // Keep the last loaded plan if refresh fails.
    } finally {
      setOpeningMealMenu(false)
      setShowMealMenu(true)
    }
  }

  const receiveOptions = [
    {
      value: 'takeaway',
      label: 'Takeaway',
      sub: 'Pick up your meal from Cafe Lush.',
      hint: getPackageReadyText(selectedType?.name),
      badge: 'Fixed time',
      icon: Package2,
    },
    {
      value: 'delivery',
      label: 'Delivery',
      sub: 'We deliver your meal package to your address.',
      hint: getPackageReadyText(selectedType?.name),
      badge: 'Free for packages',
      icon: Truck,
    },
  ]

  const selectedReceiveOption = receiveOptions.find((option) => option.value === form.delivery_type)
  const submitLabel = form.delivery_type === 'delivery'
    ? 'Continue to Delivery Address'
    : 'Continue to Pickup Details'
  const selectedReadyText = getPackageReadyText(selectedType?.name)

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
        <button type="button" className="sd-btn-see-meal" onClick={handleOpenMealMenu} disabled={openingMealMenu} aria-label="Choose meal">
          <UtensilsCrossed size={16} strokeWidth={2.2} />
          <span>{openingMealMenu ? 'Refreshing...' : 'Choose Meal'}</span>
        </button>
      </div>

      {!loadingTypes && (
        <div className="sd-pkg-grid">
          {mealTypes.map((t) => {
            const isBreakfast = t.name.toLowerCase() === 'breakfast'
            const priceLabel = getCardPriceLabel(t.name)
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
                    {getPackageReadyText(t.name)}
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
                    {priceLabel}
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
                setForm({ ...form, meal_type: e.target.value })
                setError('')
              }}
            >
              <option value="">Select meal type...</option>
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
              <option value="">Select preference...</option>
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
              max={maxDate}
              value={form.order_date}
              required
              disabled={!canPickDate}
              title={!canPickDate ? 'Select meal type and preference first' : ''}
              style={!canPickDate ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
              onChange={(e) => {
                setForm({ ...form, order_date: e.target.value })
                setError('')
              }}
            />
            {!canPickDate && (
              <p className="sd-input-hint">Select meal type &amp; preference first</p>
            )}
            {canPickDate && (
              <p className="sd-input-hint">Meal packages can be scheduled up to 3 days ahead.</p>
            )}
            {canPickDate && selectedType?.name?.toLowerCase() === 'dinner' && isPastNoon && (
              <p className="sd-input-hint warning">Past 12:00 PM - earliest dinner order is tomorrow.</p>
            )}
          </div>
        </div>

        <div className="sd-package-method-header">
          <div>
            <label className="sd-field-label">How would you like to receive your meal?</label>
            <p className="sd-package-method-subtitle">Choose one option. We will ask for the needed details in the next step.</p>
          </div>
          <span className="sd-package-method-selected">
            Selected: {selectedReceiveOption?.label || 'Takeaway'}
          </span>
        </div>

        <div className="sd-ot-grid sd-package-method-grid">
          {receiveOptions.map(({ value, label, sub, hint, badge, icon }) => {
            const OtIcon = icon
            const selected = form.delivery_type === value
            return (
              <button
                key={value}
                type="button"
                className={`sd-ot-card sd-package-method-card${selected ? ' selected' : ''}`}
                aria-pressed={selected}
                onClick={() => setForm({ ...form, delivery_type: value, quantity: 1 })}
              >
                <span className="sd-package-method-check">
                  {selected && <CheckCircle2 size={17} strokeWidth={2.4} />}
                </span>
                <span className="sd-package-method-top">
                  <span className="sd-package-method-icon">
                    <OtIcon size={20} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="sd-ot-name">{label}</span>
                    <span className="sd-package-method-badge">{badge}</span>
                  </span>
                </span>
                <span className="sd-ot-sub">{sub}</span>
                <span className="sd-package-method-hint">{hint}</span>
              </button>
            )
          })}
        </div>

        <div className="sd-package-method-note">
          {form.delivery_type === 'delivery'
            ? `${selectedReadyText}. Please enter a clear address after continuing.`
            : `${selectedReadyText}. Pickup is from Cafe Lush.`}
        </div>

        <button type="submit" className="sd-btn-primary" disabled={isPast}>
          {submitLabel}
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
                      Breakfast for <strong>{new Date(form.order_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> - order must be placed the evening before.
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
          title="Delivery Address"
          subtitle="Tell us where to deliver this meal package."
          confirmLabel="Confirm Details"
          allowCurrentLocation={false}
          requireFeeEstimate={false}
          hasPackage
          deliveryIncludedText="Free delivery is included for meal package checkout."
          onCancel={() => setShowDelivery(false)}
          onConfirm={({ quantity, delivery_address, phone_number, address_line_1, address_line_2, city_area, location_source, delivery_latitude, delivery_longitude }) => {
            setShowDelivery(false)
            buildPayloadAndPrompt({
              quantity,
              detailsText: delivery_address,
              phoneNumber: phone_number,
              addressLine1: address_line_1,
              addressLine2: address_line_2,
              cityArea: city_area,
              locationSource: location_source,
              deliveryLatitude: delivery_latitude,
              deliveryLongitude: delivery_longitude,
            })
          }}
        />
      )}

      {showTakeaway && (
        <TakeawayModal
          onCancel={() => setShowTakeaway(false)}
          onConfirm={({ quantity, phone_number, pickup_note }) => {
            setShowTakeaway(false)
            buildPayloadAndPrompt({
              quantity,
              detailsText: pickup_note,
              phoneNumber: phone_number,
            })
          }}
        />
      )}

      {showPrompt && (
        <AddMenuItemsPrompt
          onAddItems={handlePromptAddItems}
          onPlaceOnly={handlePromptPlaceOnly}
          onCancel={handlePromptCancel}
        />
      )}
    </div>
  )
}

function ItemDetailsModal({ item, initialQty = 1, onClose, onAdd }) {
  useBodyScrollLock()

  const [qty, setQty] = useState(Math.max(1, initialQty || 1))

  const increaseQty = () => setQty((prev) => prev + 1)
  const decreaseQty = () => setQty((prev) => Math.max(1, prev - 1))

  return createPortal(
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal sd-item-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sd-modal-close-btn" onClick={onClose} aria-label="Close item details">
          <X size={16} strokeWidth={2.4} />
        </button>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">Item Details</h3>
          <p className="sd-modal-sub">Review the item details and choose the quantity before adding it to your cart.</p>
        </div>

        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="sd-item-modal-img" />
        ) : (
          <div className="sd-item-modal-placeholder">
            <UtensilsCrossed size={34} strokeWidth={2.1} color={T.textMuted} />
          </div>
        )}

        <div className="sd-item-modal-body">
          <div className="sd-item-modal-tags">
            {item.item_id && <span className="sd-item-modal-tag">{item.item_id}</span>}
            {item.category_name && <span className="sd-item-modal-tag">{item.category_name}</span>}
          </div>

          <h4 className="sd-item-modal-name">{item.name}</h4>
          <p className="sd-item-modal-price">Rs. {Number(item.price).toFixed(2)}</p>

          <div className="sd-item-modal-qty-wrap">
            <span className="sd-field-label" style={{ marginBottom: 0 }}>Quantity</span>
            <div className="sd-item-modal-qty">
              <button type="button" className="sd-item-modal-qty-btn" onClick={decreaseQty} aria-label="Decrease quantity">
                <Minus size={15} strokeWidth={2.3} />
              </button>
              <span className="sd-item-modal-qty-value">{qty}</span>
              <button type="button" className="sd-item-modal-qty-btn" onClick={increaseQty} aria-label="Increase quantity">
                <Plus size={15} strokeWidth={2.3} />
              </button>
            </div>
          </div>
        </div>

        <div className="sd-modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button type="button" className="sd-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="sd-btn-primary" onClick={() => onAdd(item, qty)}>
            <Plus size={16} strokeWidth={2.2} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Panel 2 - Menu Items ──────────────────────────────────────────────────────
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

function MenuItemsPanel({
  refetchOrders,
  pendingPackageOrder,
  onPackageOrderSent,
  showToast,
  onOrderSuccess,
  mealTypes = [],
  onFloatingCartBarChange,
}) {
  const { data: rawItems = [], loading: loadingItems } = useApi(getStudentItems)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showOrderMethod, setShowOrderMethod] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [showTakeaway, setShowTakeaway] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [pendingRemoveItem, setPendingRemoveItem] = useState(null)
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false)
  const [showShopClosedConfirm, setShowShopClosedConfirm] = useState(false)
  const categoryRefs = useRef({})

  useBodyScrollLock(showMobileCart)

  const categories = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = q
      ? rawItems.filter((i) =>
          i.name.toLowerCase().includes(q) ||
          (i.item_id && i.item_id.toLowerCase().includes(q)) ||
          (i.category_name && i.category_name.toLowerCase().includes(q))
        )
      : rawItems

    const map = {}
    filtered.slice().sort(compareMenuItemsByCode).forEach((item) => {
      const cat = item.category_name || 'Other'
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    })
    return Object.entries(map)
  }, [rawItems, search])

  const cartEntries = Object.values(cart).filter((e) => e.qty > 0)
  const cartTotal = cartEntries.reduce((sum, e) => sum + Number(e.item.price) * e.qty, 0)
  const cartCount = cartEntries.reduce((sum, e) => sum + e.qty, 0)
  const menuOrderingOpen = isMenuItemOrderOpen()
  const showFloatingCartBar = cartEntries.length > 0
    && !selectedItem
    && !showOrderMethod
    && !showDelivery
    && !showTakeaway
    && !showMobileCart
  const orderButtonLabel = !menuOrderingOpen
    ? 'Orders open at 4:00 AM'
    : cartEntries.length === 0
      ? 'Add items to order'
      : pendingPackageOrder
        ? `Place Combined Order (${cartCount} item${cartCount > 1 ? 's' : ''} + pkg)`
        : `Place Order (${cartCount} item${cartCount > 1 ? 's' : ''})`

  useEffect(() => {
    if (cartEntries.length === 0) {
      setShowMobileCart(false)
    }
  }, [cartEntries.length])

  useEffect(() => {
    onFloatingCartBarChange?.(showFloatingCartBar)
  }, [showFloatingCartBar, onFloatingCartBarChange])

  const addToCart = (item, qtyToAdd = 1) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty ?? 0) + qtyToAdd },
    }))

  const openItemDetails = (item) => {
    setSelectedItem(item)
  }

  const closeItemDetails = () => {
    setSelectedItem(null)
  }

  const increaseQty = (item) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: prev[item.id].qty + 1 },
    }))

  const decreaseQty = (item) => {
    const current = cart[item.id]?.qty ?? 0
    if (current > 1) {
      setCart((prev) => ({
        ...prev,
        [item.id]: { item, qty: prev[item.id].qty - 1 },
      }))
      return
    }
    if (current === 1) setPendingRemoveItem(item)
  }

  const confirmRemoveCartItem = () => {
    if (!pendingRemoveItem) return
    setCart((prev) => {
      const next = { ...prev }
      delete next[pendingRemoveItem.id]
      return next
    })
    setPendingRemoveItem(null)
  }

  const clearCart = () => {
    setCart({})
    setError('')
    setSuccess('')
    setPendingRemoveItem(null)
    setShowClearCartConfirm(false)
  }

  const showShopClosedPopup = () => {
    setError('')
    setSuccess('')
    setShowShopClosedConfirm(true)
  }

  const submitCartOrder = async ({
    deliveryType,
    phoneNumber = '',
    detailsText = '',
    addressLine1 = '',
    addressLine2 = '',
    cityArea = '',
    locationSource = 'address',
    deliveryLatitude = null,
    deliveryLongitude = null,
  }) => {
    if (!isMenuItemOrderOpen()) {
      showShopClosedPopup()
      return
    }

    const checkoutMethod = pendingPackageOrder?.delivery_type || deliveryType
    const checkoutPhone = pendingPackageOrder?.phone_number || phoneNumber
    const checkoutDetails = pendingPackageOrder?.delivery_address || detailsText
    const checkoutAddressLine1 = pendingPackageOrder?.address_line_1 || addressLine1
    const checkoutAddressLine2 = pendingPackageOrder?.address_line_2 || addressLine2
    const checkoutCityArea = pendingPackageOrder?.city_area || cityArea
    const checkoutLocationSource = pendingPackageOrder?.location_source || locationSource
    const checkoutLatitude = pendingPackageOrder?.delivery_latitude ?? deliveryLatitude
    const checkoutLongitude = pendingPackageOrder?.delivery_longitude ?? deliveryLongitude
    const inheritedOrderDate = pendingPackageOrder?.order_date || ''

    setSubmitting(true)
    try {
      const itemOrders = cartEntries.map(({ item, qty }) => {
        const itemOrder = {
          delivery_type: checkoutMethod,
          quantity: qty,
          order_type: 'item',
          item: item.id,
          phone_number: checkoutPhone,
          delivery_address: checkoutDetails,
          address_line_1: checkoutAddressLine1,
          address_line_2: checkoutAddressLine2,
          city_area: checkoutCityArea,
          location_source: checkoutLocationSource,
          delivery_latitude: checkoutLatitude,
          delivery_longitude: checkoutLongitude,
        }
        if (inheritedOrderDate) itemOrder.order_date = inheritedOrderDate
        return itemOrder
      })

      const allOrders = pendingPackageOrder ? [pendingPackageOrder, ...itemOrders] : itemOrders
      const { data: createdOrders = [] } = await placeMealOrdersBatch(allOrders)
      const firstCreatedOrder = Array.isArray(createdOrders) ? createdOrders[0] : null
      const deliveryFeeLabel = checkoutMethod === 'delivery'
        ? formatDeliveryFeeLabel(firstCreatedOrder?.delivery_fee, pendingPackageOrder ? 'Free' : 'Calculated at checkout')
        : ''
      const itemSummaryLines = cartEntries.map(({ item, qty }) => ({
        name: item.name,
        qty,
      }))
      const summaryLines = pendingPackageOrder
        ? [getPackageSummaryLine(pendingPackageOrder, mealTypes), ...itemSummaryLines]
        : itemSummaryLines
      const packageReadyText = pendingPackageOrder
        ? getPackageReadyTextFromPayload(pendingPackageOrder, mealTypes)
        : ''

      setSuccess('')
      setCart({})
      if (pendingPackageOrder) onPackageOrderSent()
      refetchOrders()
      onOrderSuccess?.({
        title: 'Order Placed Successfully',
        message: pendingPackageOrder
          ? `Your meal package and cafe items have been sent together. ${packageReadyText}.`
          : 'Your menu item order has been sent to Cafe Lush.',
        method: checkoutMethod,
        deliveryAddress: checkoutMethod === 'delivery' ? checkoutDetails : '',
        pickupDetails: checkoutMethod === 'takeaway' ? checkoutDetails : '',
        phoneNumber: checkoutPhone,
        deliveryFeeLabel,
        lines: summaryLines,
      })
      setShowOrderMethod(false)
      setShowDelivery(false)
      setShowTakeaway(false)
    } catch (err) {
      const d = err.response?.data
      setError(d?.detail || d?.item?.[0] || d?.phone_number?.[0] || d?.delivery_address?.[0] || JSON.stringify(d) || 'Failed to place order.')
      showToast(d?.detail || d?.phone_number?.[0] || d?.delivery_address?.[0] || 'Failed to place order.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlaceOrder = async () => {
    setShowMobileCart(false)
    setError('')
    setSuccess('')
    if (cartEntries.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (!isMenuItemOrderOpen()) {
      showShopClosedPopup()
      return
    }

    if (pendingPackageOrder) {
      await submitCartOrder({
        deliveryType: pendingPackageOrder.delivery_type,
        phoneNumber: pendingPackageOrder.phone_number,
        detailsText: pendingPackageOrder.delivery_address || '',
      })
      return
    }

    setShowOrderMethod(true)
  }

  const scrollToCategory = (catName) => {
    categoryRefs.current[catName]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const renderCartPanel = ({ mobile = false } = {}) => (
    <div className={`sd-cart-inner${mobile ? ' sd-cart-inner-mobile' : ''}`}>
      <div className="sd-cart-header">
        <span className="sd-cart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} strokeWidth={2.2} />
          Your Cart
        </span>

        <div className="sd-cart-header-actions">
          {cartCount > 0 && <span className="sd-cart-count">{cartCount}</span>}
          {mobile && (
            <button
              type="button"
              className="sd-mobile-cart-close"
              onClick={() => setShowMobileCart(false)}
              aria-label="Close cart"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
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
                  <button type="button" className="sd-cart-qty-btn" onClick={() => decreaseQty(item)}>
                    <Minus size={14} strokeWidth={2.4} />
                  </button>
                  <span className="sd-cart-qty-num">{qty}</span>
                  <button type="button" className="sd-cart-qty-btn" onClick={() => increaseQty(item)}>
                    <Plus size={14} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sd-cart-footer">
        {cartEntries.length > 0 && (
          <div className="sd-cart-total-row">
            <span className="sd-cart-total-label">Total</span>
            <span className="sd-cart-total-val">Rs. {cartTotal.toFixed(2)}</span>
          </div>
        )}
        {error && <p className="sd-cart-feedback-error">{error}</p>}
        {success && <p className="sd-cart-feedback-success">{success}</p>}
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={submitting || cartEntries.length === 0}
          className={`sd-cart-order-btn ${cartEntries.length > 0 ? 'ready' : 'empty'}`}
        >
          {submitting ? <Spinner size="sm" /> : <HandPlatter size={16} strokeWidth={2.2} />}
          {orderButtonLabel}
        </button>
        {cartEntries.length > 0 && (
          <button
            type="button"
            className="sd-btn-secondary"
            style={{ justifyContent: 'center' }}
            onClick={() => setShowClearCartConfirm(true)}
          >
            Clear Cart
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className={`sd-panel sd-menu-panel${showFloatingCartBar ? ' has-mobile-cart' : ''}`}>
        <div className="sd-panel-header">
          <div>
            <h2 className="sd-panel-title">Menu Items</h2>
            <p className="sd-panel-subtitle">Browse and add items to your cart</p>
            <p className={menuOrderingOpen ? 'sd-input-hint' : 'sd-input-hint warning'}>
              {menuOrderingOpen
                ? MENU_ITEM_ORDER_HOURS_MESSAGE
                : 'Menu item ordering is closed now. Orders are available from 4:00 AM to 11:30 PM.'}
            </p>
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
              <strong>Meal package order is ready.</strong> Add menu items below and place the combined order with the same {pendingPackageOrder.delivery_type} details you already confirmed.
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
            placeholder="Search by name or item ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {!loadingItems && categories.length > 0 && (
          <div className="sd-category-shortcuts" aria-label="Menu categories">
            {categories.map(([catName, items]) => (
              <button
                key={catName}
                type="button"
                className="sd-category-chip"
                onClick={() => scrollToCategory(catName)}
              >
                <span>{catName}</span>
                <span className="sd-category-chip-count">{items.length}</span>
              </button>
            ))}
          </div>
        )}

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
                <div
                  key={catName}
                  ref={(el) => {
                    if (el) categoryRefs.current[catName] = el
                  }}
                  className="sd-cat-section"
                >
                  <p className="sd-cat-label">{catName}</p>
                  <div className="sd-items-grid">
                    {items.map((item) => {
                      const inCart = !!cart[item.id]
                      const inCartQty = cart[item.id]?.qty ?? 0
                      return (
                        <div
                          key={item.id}
                          className={inCart ? 'sd-item-card in-cart' : 'sd-item-card'}
                          onClick={() => openItemDetails(item)}
                        >
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
                            <p className="sd-item-name">{item.name}</p>
                            <p className="sd-item-price">Rs. {Number(item.price).toFixed(2)}</p>
                          </div>

                          <button
                            className={inCart ? 'sd-add-btn in-cart' : 'sd-add-btn'}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openItemDetails(item)
                            }}
                          >
                            {inCart ? (
                              <>
                                <CheckCircle2 size={16} strokeWidth={2.2} />
                                <span>In Cart ({inCartQty})</span>
                              </>
                            ) : (
                              <>
                                <Search size={16} strokeWidth={2.2} />
                                <span>View Details</span>
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

          <div className="sd-cart sd-cart-desktop">
            {renderCartPanel()}
          </div>
        </div>
      </div>

      {showFloatingCartBar && (
        <button type="button" className="sd-mobile-cart-bar" onClick={() => setShowMobileCart(true)}>
          <span className="sd-mobile-cart-bar-main">
            <span className="sd-mobile-cart-bar-title">
              <ShoppingCart size={16} strokeWidth={2.2} />
              {cartCount} item{cartCount > 1 ? 's' : ''}
            </span>
            <span className="sd-mobile-cart-bar-total">Rs. {cartTotal.toFixed(2)}</span>
          </span>
          <span className="sd-mobile-cart-bar-cta">Review Cart</span>
        </button>
      )}

      {showMobileCart && createPortal(
        <div className="sd-mobile-cart-overlay" onClick={() => setShowMobileCart(false)}>
          <div className="sd-mobile-cart-sheet" onClick={(e) => e.stopPropagation()}>
            {renderCartPanel({ mobile: true })}
          </div>
        </div>,
        document.body
      )}

      {showOrderMethod && (
        <OrderMethodModal
          onCancel={() => setShowOrderMethod(false)}
          onSelect={(value) => {
            setShowOrderMethod(false)
            if (value === 'delivery') {
              setShowDelivery(true)
              return
            }
            setShowTakeaway(true)
          }}
        />
      )}

      {showDelivery && (
        <DeliveryModal
          showQuantity={false}
          title="Delivery Details"
          subtitle="Enter your delivery address and phone number. We will calculate the delivery charge automatically."
          confirmLabel="Confirm Order"
          allowCurrentLocation
          requireFeeEstimate={true}
          autoEstimateFee
          onCancel={() => setShowDelivery(false)}
          onConfirm={({ delivery_address, phone_number, address_line_1, address_line_2, city_area, location_source, delivery_latitude, delivery_longitude }) => {
            setShowDelivery(false)
            submitCartOrder({
              deliveryType: 'delivery',
              phoneNumber: phone_number,
              detailsText: delivery_address,
              addressLine1: address_line_1,
              addressLine2: address_line_2,
              cityArea: city_area,
              locationSource: location_source,
              deliveryLatitude: delivery_latitude,
              deliveryLongitude: delivery_longitude,
            })
          }}
        />
      )}

      {showTakeaway && (
        <TakeawayModal
          showQuantity={false}
          title="Takeaway Details"
          subtitle="Add your contact details before confirming these menu items for pickup."
          noteLabel="Pickup Details (Optional)"
          notePlaceholder="Example: Pickup person name - Nimal, contact - 0771234567"
          confirmLabel="Confirm Order"
          onCancel={() => setShowTakeaway(false)}
          onConfirm={({ phone_number, pickup_note }) => {
            setShowTakeaway(false)
            submitCartOrder({
              deliveryType: 'takeaway',
              phoneNumber: phone_number,
              detailsText: pickup_note,
            })
          }}
        />
      )}

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          initialQty={1}
          onClose={closeItemDetails}
          onAdd={(item, qty) => {
            addToCart(item, qty)
            closeItemDetails()
          }}
        />
      )}

      {pendingRemoveItem && (
        <ConfirmDialog
          title="Remove item?"
          message={`Do you want to remove ${pendingRemoveItem.name} from your cart?`}
          confirmLabel="Yes, Remove"
          cancelLabel="No, Keep"
          onConfirm={confirmRemoveCartItem}
          onCancel={() => setPendingRemoveItem(null)}
        />
      )}

      {showClearCartConfirm && (
        <ConfirmDialog
          title="Clear cart?"
          message="Are you sure you want to remove all items from your cart?"
          confirmLabel="Yes, Clear"
          cancelLabel="No, Keep"
          onConfirm={clearCart}
          onCancel={() => setShowClearCartConfirm(false)}
        />
      )}

      {showShopClosedConfirm && (
        <ConfirmDialog
          title="Shop is closed"
          message={SHOP_CLOSED_DIALOG_MESSAGE}
          confirmLabel="OK"
          cancelLabel={null}
          onConfirm={() => setShowShopClosedConfirm(false)}
          onCancel={() => setShowShopClosedConfirm(false)}
        />
      )}
    </>
  )
}

// ── Panel 3 - Order History ───────────────────────────────────────────────────
function OrderHistoryPanel({ orders, loading, onClear, showToast }) {
  const [clearing, setClearing] = useState(false)
  const [cancellingKey, setCancellingKey] = useState('')
  const [selectedHistory, setSelectedHistory] = useState(null)

  useBodyScrollLock(Boolean(selectedHistory))

  const sessionRows = useMemo(() => {
    const statusPriority = ['pending', 'confirmed', 'cancelled']
    const today = new Date().toISOString().slice(0, 10)
    const sessionMap = new Map()

    for (const order of orders) {
      const key = order.session_id || `single-${order.id}`
      if (!sessionMap.has(key)) sessionMap.set(key, [])
      sessionMap.get(key).push(order)
    }

    return Array.from(sessionMap.values())
      .map((sessionOrders) => {
        const packageOrder = sessionOrders.find((o) => o.order_type === 'package') || null
        const firstOrder = packageOrder || sessionOrders[0]
        const itemOrders = sessionOrders.filter((o) => o.order_type === 'item')

        const nameOf = (o) => o.package_label || (o.order_type === 'item' ? o.item_name : o.meal_type_name) || '-'
        const summaryName = (() => {
          if (sessionOrders.length === 1) return nameOf(firstOrder)
          if (packageOrder) {
            const extraItems = itemOrders.length
            return extraItems > 0
              ? `${nameOf(packageOrder)} + ${extraItems} menu item${extraItems > 1 ? 's' : ''}`
              : nameOf(packageOrder)
          }
          return `${nameOf(firstOrder)} + ${sessionOrders.length - 1} more`
        })()

        const sessionDeliveryAddress =
          sessionOrders.find((o) => (o.delivery_address || '').trim())?.delivery_address?.trim() || ''
        const sessionPhoneNumber =
          sessionOrders.find((o) => (o.phone_number || '').trim())?.phone_number?.trim() || ''
        const sessionEmail =
          sessionOrders.find((o) => (o.student_email || '').trim())?.student_email?.trim() || ''
        const sessionStatusSet = new Set(sessionOrders.map((o) => o.status))
        const sessionStatus =
          statusPriority.find((s) => sessionStatusSet.has(s)) || firstOrder.status || 'pending'

        const totalQty = sessionOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0)
        const packageQty = packageOrder ? Number(packageOrder.quantity) || 0 : 0
        const itemsQty = itemOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0)
        const isCombined = Boolean(packageOrder && itemOrders.length > 0)
        const cancelInfo = getPackageCancelInfo(packageOrder, isCombined)
        const qtyLabel = isCombined
          ? `${packageQty} pkg + ${itemsQty} item${itemsQty === 1 ? '' : 's'}`
          : String(totalQty)

        const showPickupTime =
          sessionStatus === 'confirmed' &&
          Boolean(firstOrder.pickup_time) &&
          (
            firstOrder.order_type === 'package' ||
            (firstOrder.delivery_type === 'takeaway' && firstOrder.order_date === today)
          )

        const lines = sessionOrders
          .slice()
          .sort((a, b) => {
            if (a.order_type === b.order_type) return a.id - b.id
            return a.order_type === 'package' ? -1 : 1
          })
          .map((o) => ({
            id: o.id,
            kind: o.order_type,
            name: nameOf(o),
            qty: Number(o.quantity) || 0,
            orderDate: o.order_date,
            status: o.status,
            preference: o.preference,
          }))

        return {
          rowKey: firstOrder.session_id || `single-${firstOrder.id}`,
          firstOrderId: firstOrder.id,
          packageOrderId: packageOrder?.id || null,
          orderReference: firstOrder.order_reference || '-',
          summaryName,
          orderDate: firstOrder.order_date,
          kind: isCombined ? 'combined' : firstOrder.order_type,
          deliveryType: firstOrder.delivery_type,
          qtyLabel,
          status: sessionStatus,
          cancelInfo,
          canCancel: Boolean(packageOrder) && sessionStatus === 'pending' && Boolean(cancelInfo?.canCancelNow),
          placedAt: new Date(firstOrder.created_at).toLocaleString(),
          pickupOrPlaced: showPickupTime
            ? firstOrder.pickup_time
            : new Date(firstOrder.created_at).toLocaleString(),
          addressText: firstOrder.delivery_type === 'delivery' ? sessionDeliveryAddress : '',
          pickupDetails: firstOrder.delivery_type === 'takeaway' ? sessionDeliveryAddress : '',
          phoneNumber: sessionPhoneNumber,
          studentEmail: sessionEmail,
          lines,
          createdAtTs: new Date(firstOrder.created_at).getTime(),
        }
      })
      .sort((a, b) => b.createdAtTs - a.createdAtTs)
  }, [orders])

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to delete all your order history? This cannot be undone.')) return
    setClearing(true)
    try {
      await clearOrderHistory()
      setSelectedHistory(null)
      onClear()
    } finally {
      setClearing(false)
    }
  }

  const handleCancelOrder = async (row, event) => {
    event?.stopPropagation()
    const message = row.cancelInfo?.combinedText
      ? `${row.cancelInfo.ruleText} ${row.cancelInfo.combinedText}`
      : row.cancelInfo?.ruleText || 'Cancel this order?'
    if (!window.confirm(`${message}\n\nDo you want to cancel this order now?`)) return

    setCancellingKey(row.rowKey)
    try {
      await cancelStudentOrder(row.packageOrderId || row.firstOrderId)
      showToast?.('Order cancelled successfully.', 'success')
      setSelectedHistory(null)
      onClear()
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to cancel order.'
      showToast?.(detail, 'error')
    } finally {
      setCancellingKey('')
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
            {clearing ? 'Clearing...' : 'Clear'}
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
                {['#', 'Item / Package', 'Date', 'Kind', 'Type', 'Qty', 'Status', 'Pickup / Placed', 'Address', 'Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessionRows.map((row, i) => (
                <tr
                  key={row.rowKey}
                  onClick={() => setSelectedHistory(row)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedHistory(row)
                    }
                  }}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  title="Click to view full order details"
                >
                  <td className="sd-table-num" data-label="#">{i + 1}</td>
                  <td className="sd-table-name" data-label="Item / Package">
                    {row.summaryName}
                    {row.cancelInfo && row.status === 'pending' && (
                      <p className={row.canCancel ? 'sd-input-hint' : 'sd-input-hint warning'} style={{ marginTop: '4px' }}>
                        {row.canCancel ? row.cancelInfo.ruleText : 'Cancellation time has passed for this meal package order.'}
                      </p>
                    )}
                  </td>
                  <td data-label="Date">{row.orderDate}</td>
                  <td data-label="Kind">
                    <span className={row.kind === 'item' ? 'sd-badge item' : 'sd-badge package'}>
                      {row.kind === 'combined' ? 'Combined' : row.kind === 'item' ? 'Item' : 'Package'}
                    </span>
                  </td>
                  <td data-label="Type">
                    <span className={row.deliveryType === 'delivery' ? 'sd-badge delivery' : 'sd-badge takeaway'}>
                      {row.deliveryType === 'delivery' ? 'Delivery' : 'Takeaway'}
                    </span>
                  </td>
                  <td data-label="Qty">{row.qtyLabel}</td>
                  <td data-label="Status"><Badge status={row.status} /></td>
                  <td data-label="Pickup / Placed">
                    {row.pickupOrPlaced}
                  </td>
                  <td data-label="Address" className="sd-table-address">
                    {row.deliveryType === 'takeaway'
                      ? <span className="sd-table-dash">-</span>
                      : (row.addressText || <span className="sd-table-dash">-</span>)}
                  </td>
                  <td data-label="Action">
                    {row.canCancel ? (
                      <button
                        type="button"
                        className="sd-btn-secondary"
                        style={{ minWidth: 'unset', padding: '7px 10px', fontSize: '12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.35)' }}
                        disabled={cancellingKey === row.rowKey}
                        onClick={(e) => handleCancelOrder(row, e)}
                      >
                        {cancellingKey === row.rowKey ? 'Cancelling...' : 'Cancel'}
                      </button>
                    ) : (
                      <span className="sd-table-dash">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedHistory && createPortal(
        <div className="sd-modal-overlay" onClick={() => setSelectedHistory(null)}>
          <div className="sd-modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 className="sd-modal-title">Order Details</h3>
                <p className="sd-modal-sub">Complete details for this order session</p>
              </div>
              <button
                type="button"
                className="sd-btn-secondary"
                style={{ minWidth: 'unset', padding: '6px 10px' }}
                onClick={() => setSelectedHistory(null)}
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 18px', marginBottom: '16px' }}>
              <div><strong>Order Ref:</strong> {selectedHistory.orderReference}</div>
              <div><strong>Date:</strong> {selectedHistory.orderDate}</div>
              <div><strong>Type:</strong> {selectedHistory.deliveryType === 'delivery' ? 'Delivery' : 'Takeaway'}</div>
              <div><strong>Status:</strong> {selectedHistory.status}</div>
              <div><strong>Qty:</strong> {selectedHistory.qtyLabel}</div>
              <div><strong>Placed:</strong> {selectedHistory.placedAt}</div>
              <div><strong>Pickup / Placed:</strong> {selectedHistory.pickupOrPlaced}</div>
              <div><strong>Phone:</strong> {selectedHistory.phoneNumber || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Email:</strong> {selectedHistory.studentEmail || '-'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Delivery Address:</strong>{' '}
                {selectedHistory.deliveryType === 'delivery'
                  ? (selectedHistory.addressText || '-')
                  : '-'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Pickup Details:</strong>{' '}
                {selectedHistory.deliveryType === 'takeaway'
                  ? (selectedHistory.pickupDetails || '-')
                  : '-'}
              </div>
            </div>

            {selectedHistory.cancelInfo && selectedHistory.status === 'pending' && (
              <div
                className={selectedHistory.canCancel ? 'sd-alert success' : 'sd-alert error'}
                style={{ marginBottom: '14px' }}
              >
                <strong>Cancellation:</strong> {selectedHistory.cancelInfo.ruleText}
                {selectedHistory.cancelInfo.cutoffText && ` ${selectedHistory.cancelInfo.cutoffText}`}
                {selectedHistory.cancelInfo.combinedText && ` ${selectedHistory.cancelInfo.combinedText}`}
                {!selectedHistory.canCancel && selectedHistory.status === 'pending' && ' Cancellation time has passed for this meal package order.'}
              </div>
            )}

            <div className="sd-table-wrap" style={{ marginBottom: '8px' }}>
              <table className="sd-table">
                <thead>
                  <tr>
                    {['Line', 'Item / Package', 'Kind', 'Qty', 'Order Date', 'Status'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedHistory.lines.map((line, idx) => (
                    <tr key={line.id}>
                      <td data-label="Line">{idx + 1}</td>
                      <td data-label="Item / Package">{line.name}</td>
                      <td data-label="Kind">
                        <span className={line.kind === 'item' ? 'sd-badge item' : 'sd-badge package'}>
                          {line.kind === 'item' ? 'Item' : 'Package'}
                        </span>
                      </td>
                      <td data-label="Qty">{line.qty}</td>
                      <td data-label="Order Date">{line.orderDate}</td>
                      <td data-label="Status"><Badge status={line.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedHistory.canCancel && (
              <div className="sd-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="sd-btn-secondary"
                  style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.35)' }}
                  disabled={cancellingKey === selectedHistory.rowKey}
                  onClick={(e) => handleCancelOrder(selectedHistory, e)}
                >
                  {cancellingKey === selectedHistory.rowKey ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Panel 4 - Food Analytics ─────────────────────────────────────────────────
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

  if (vegPkgs.length > nonVegPkgs.length && vegPkgs.length > 2) tags.push({ label: 'Veg Lover', color: '#15803d', bg: 'rgba(21,128,61,0.1)', border: 'rgba(21,128,61,0.25)' })
  if (nonVegPkgs.length > vegPkgs.length && nonVegPkgs.length > 2) tags.push({ label: 'Non-Veg Fan', color: '#b91c1c', bg: 'rgba(185,28,28,0.08)', border: 'rgba(185,28,28,0.2)' })
  if (breakfasts.length > dinners.length && breakfasts.length > 2) tags.push({ label: 'Early Riser', color: '#b45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' })
  if (dinners.length > breakfasts.length && dinners.length > 2) tags.push({ label: 'Night Diner', color: '#4338ca', bg: 'rgba(67,56,202,0.08)', border: 'rgba(67,56,202,0.2)' })
  if (deliveries.length > orders.length * 0.5 && deliveries.length > 2) tags.push({ label: 'Delivery Regular', color: '#0369a1', bg: 'rgba(3,105,161,0.08)', border: 'rgba(3,105,161,0.2)' })
  if (items.length > pkgs.length && items.length > 3) tags.push({ label: 'A la Carte Fan', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' })
  if (orders.length >= 10) tags.push({ label: 'Regular Customer', color: '#c9a84c', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.3)' })
  if (orders.length >= 20) tags.push({ label: 'Loyal Member', color: '#c9a84c', bg: 'rgba(201,168,76,0.15)', border: 'rgba(201,168,76,0.4)' })

  const nameFreq = {}
  items.forEach((o) => { if (o.item_name) nameFreq[o.item_name] = (nameFreq[o.item_name] || 0) + o.quantity })
  const topItem = Object.entries(nameFreq).sort((a, b) => b[1] - a[1])[0]
  if (topItem && topItem[1] >= 3) tags.push({ label: `Loves ${topItem[0]}`, color: '#be185d', bg: 'rgba(190,24,93,0.08)', border: 'rgba(190,24,93,0.2)' })

  return tags
}

function SummaryCard({ label, value, CardIcon, small }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #faf6f0, #f5ede0)', border: '1.5px solid #e8d9c5', borderRadius: '14px', padding: '16px 18px' }}>
      <div style={{ marginBottom: '6px' }}><CardIcon size={20} strokeWidth={2.2} color={T.caramel} /></div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: small ? '14px' : '22px', fontWeight: 800, color: T.espresso, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
      <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '4px', fontWeight: 600 }}>{label}</div>
    </div>
  )
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

  // Heatmap: day x meal
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
        <SummaryCard label="Total Orders"   value={totalOrders}          CardIcon={Package2} />
        <SummaryCard label="Favourite Item" value={topItem?.[0] || '-'}  CardIcon={UtensilsCrossed} small />
        <SummaryCard label="Orders / Day"   value={dailyAvg}             CardIcon={CalendarDays} />
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
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.caramel, flexShrink: 0 }}>{count}x</span>
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

// ── Panel 5 - Suggestions ─────────────────────────────────────────────────────
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
      showToast('Your suggestion has been sent!')
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
            placeholder="Write your suggestion, feedback, or idea here..."
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
          {submitting ? 'Sending...' : 'Send Suggestion'}
        </button>
      </form>
    </div>
  )
}

// ── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onSaved }) {
  useBodyScrollLock()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    email:     user?.email     || '',
    full_name: user?.full_name || '',
    contact:   user?.contact   || '',
  })
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')

  const getProfileErrorMessage = (err) => {
    const data = err?.response?.data
    if (!data) return 'Failed to save changes.'
    if (typeof data === 'string' && data.trim()) return data
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail

    const priority = ['full_name', 'email', 'contact', 'non_field_errors']
    for (const key of priority) {
      const value = data?.[key]
      if (Array.isArray(value) && value.length) return String(value[0])
      if (typeof value === 'string' && value.trim()) return value
    }

    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length) return String(value[0])
      if (typeof value === 'string' && value.trim()) return value
    }
    return 'Failed to save changes.'
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fullName = form.full_name.trim()
    const email = form.email.trim()
    const contact = form.contact.trim()

    if (!fullName) {
      setError('Full name is required.')
      return
    }
    if (!isValidFullName(fullName)) {
      setError('Full name must contain letters and spaces only.')
      return
    }
    if (email && !isValidEmail(email)) {
      setError('Enter a valid email address (example: user@example.com).')
      return
    }
    if (contact && !isValidSriLankanMobile(contact)) {
      setError('Enter a valid Sri Lankan mobile number with exactly 10 digits (example: 0771234567).')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data } = await updateProfile({
        email,
        full_name: fullName,
        contact: contact ? normalizePhone(contact) : '',
      })
      onSaved(data)
      setEditing(false)
    } catch (err) {
      setError(getProfileErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    { label: 'Username',     value: user?.username },
    { label: 'Full Name',    value: user?.full_name  || '-', field: 'full_name' },
    { label: 'Email',        value: user?.email      || '-', field: 'email',    type: 'email' },
    { label: 'Contact',      value: user?.contact    || '-', field: 'contact',  type: 'tel' },
    { label: 'Role',         value: user?.role?.name || 'Student' },
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
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
                    onChange={(e) => setForm({
                      ...form,
                      [field]: field === 'contact'
                        ? normalizePhone(e.target.value)
                        : field === 'full_name'
                          ? e.target.value.replace(/[^\p{L}\s]/gu, '')
                          : e.target.value,
                    })}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    inputMode={field === 'contact' ? 'numeric' : undefined}
                    maxLength={field === 'contact' ? 10 : field === 'email' ? EMAIL_MAX_LENGTH : field === 'full_name' ? FULL_NAME_MAX_LENGTH : undefined}
                    pattern={field === 'contact' ? '[0-9]*' : undefined}
                  />
                </div>
              ))}
            </div>
            {error && <div className="sd-alert error" style={{ marginBottom: '14px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="sd-btn-secondary" onClick={() => { setEditing(false); setError('') }}>Cancel</button>
              <button type="submit" className="sd-btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? <Spinner size="sm" /> : <CheckCircle2 size={16} strokeWidth={2.2} />}
                {saving ? 'Saving...' : 'Save Changes'}
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

// ── Panel 6 - About Cafe Lush ─────────────────────────────────────────────────
function AboutCafeLushPanel() {
  return (
    <div className="sd-panel">
      <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="sd-panel-title">About Cafe Lush</h2>
          <p className="sd-panel-subtitle">Fine Dining &amp; Events - Jaffna, Sri Lanka</p>
        </div>
        <Coffee size={22} strokeWidth={2.2} color={T.caramel} />
      </div>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <img
          src="/image/image6.jpeg"
          alt="Cafe Lush logo"
          style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2.5px #C9A84C, 0 0 14px rgba(201,168,76,0.35)' }}
        />
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '18px', color: T.espresso, lineHeight: 1.2 }}>Cafe Lush</p>
          <p style={{ fontSize: '12px', color: T.textMuted, marginTop: '3px' }}>Fine Dining &amp; Events</p>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: T.coffeeMid, lineHeight: 1.7, marginBottom: '24px' }}>
        Bringing warmth, flavour, and elegance to every meal and event in Jaffna, Sri Lanka.
      </p>

      {/* Contact */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Contact Us</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="tel:+94767228485" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: T.coffeeMid, textDecoration: 'none' }}>
            <Phone size={15} strokeWidth={2.2} color={T.caramel} />
            076 722 8485
          </a>
          <a href="https://wa.me/94767228485" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: T.coffeeMid, textDecoration: 'none' }}>
            <MessageCircle size={15} strokeWidth={2.2} color={T.caramel} />
            076 722 8485 (WhatsApp)
          </a>
          <a href="mailto:shanthaenterprise2026@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: T.coffeeMid, textDecoration: 'none', wordBreak: 'break-all' }}>
            <Mail size={15} strokeWidth={2.2} color={T.caramel} />
            shanthaenterprise2026@gmail.com
          </a>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: T.coffeeMid }}>
            <MapPin size={15} strokeWidth={2.2} color={T.caramel} style={{ flexShrink: 0, marginTop: '2px' }} />
            No 173, Palaly Road, Thirunalveli, Jaffna
          </div>
        </div>
      </div>

      {/* Social */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: T.coffeeMid, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Follow Us</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="https://www.facebook.com/ShanthaEnterprice" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: T.coffeeMid, textDecoration: 'none' }}>
            <Facebook size={15} strokeWidth={2.2} color={T.caramel} />
            Shantha Enterprice
          </a>
          <a href="https://www.instagram.com/ShanthaEnterprice" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: T.coffeeMid, textDecoration: 'none' }}>
            <Instagram size={15} strokeWidth={2.2} color={T.caramel} />
            Shantha Enterprice
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'packages',    label: 'Meal Packages',    Icon: Package2   },
  { key: 'menu',        label: 'Menu Items',        Icon: BookOpen   },
  { key: 'history',     label: 'Order History',     Icon: History    },
  { key: 'analytics',   label: 'My Food Analytics', Icon: BarChart2  },
  { key: 'suggestions', label: 'Suggestions',       Icon: MessageSquare },
  { key: 'about',       label: 'About Cafe Lush',   Icon: Coffee     },
]

function formatNotificationTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  if (sameDay) return `Today, ${time}`
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatNotificationCard(notification) {
  const message = notification.message || ''
  const lower = message.toLowerCase()
  const confirmedMatch = message.match(/^Your\s+(.+?)\s+order(?:\s+for\s+([0-9-]+))?\s+has been confirmed!?/i)

  if (confirmedMatch) {
    const itemName = confirmedMatch[1]?.trim() || 'Your order'
    const orderDate = confirmedMatch[2]?.trim()
    const method = lower.includes('delivery')
      ? 'Delivery to your address'
      : lower.includes('pickup') || lower.includes('takeaway')
        ? 'Ready for pickup'
        : 'Order confirmed'

    return {
      title: 'Order Confirmed',
      detail: orderDate ? `${itemName} - ${orderDate}` : itemName,
      meta: method,
      tone: 'success',
    }
  }

  if (lower.includes('cancel')) {
    return {
      title: 'Order Cancelled',
      detail: message,
      meta: 'Please contact the cafe if you need help.',
      tone: 'danger',
    }
  }

  if (lower.includes('ready')) {
    return {
      title: 'Order Ready',
      detail: message,
      meta: 'Ready for pickup',
      tone: 'ready',
    }
  }

  return {
    title: 'Order Update',
    detail: message,
    meta: 'Latest update from Cafe Lush',
    tone: 'info',
  }
}

function NotificationDetailModal({ notification, onClose, onDelete }) {
  useBodyScrollLock()

  const card = formatNotificationCard(notification)
  const detail = notification.order_detail
  const deliveryLabel = detail?.delivery_type === 'delivery' ? 'Delivery' : 'Takeaway'
  const fee = Number(detail?.delivery_fee || 0)
  const unitPrice = Number(detail?.unit_price || 0)

  const rows = detail ? [
    ['Order Ref', detail.order_reference || '-'],
    ['Bill No', detail.bill_number || 'Not generated yet'],
    ['Status', detail.status || '-'],
    ['Type', detail.order_kind || detail.order_type || '-'],
    ['Item / Package', detail.label || detail.name || '-'],
    ['Quantity', detail.quantity || 1],
    ['Order Date', detail.order_date || '-'],
    ['Method', deliveryLabel],
    ['Ready Time', detail.pickup_time || (detail.delivery_type === 'delivery' ? 'Delivery time' : 'Ready soon')],
    ['Address / Note', detail.delivery_address || '-'],
    ['Phone', detail.phone_number || '-'],
    ['Email', detail.student_email || '-'],
    ['Unit Price', `Rs. ${unitPrice.toFixed(2)}`],
    ['Delivery Fee', `Rs. ${fee.toFixed(2)}`],
  ] : []

  return createPortal(
    <div className="sd-notif-modal-backdrop" onClick={onClose}>
      <div className="sd-notif-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-notif-modal-head">
          <div>
            <p className="sd-notif-modal-kicker">Notification details</p>
            <h2>{card.title}</h2>
          </div>
          <button type="button" className="sd-notif-close" onClick={onClose} aria-label="Close notification details">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <p className="sd-notif-modal-message">{notification.message}</p>

        {detail && (
          <div className="sd-notif-detail-grid">
            {rows.map(([label, value]) => (
              <div key={label} className="sd-notif-detail-row">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="sd-notif-modal-foot">
          <span>{formatNotificationTime(notification.created_at)}</span>
          <button type="button" className="sd-notif-action danger" onClick={() => onDelete(notification.id)}>
            Delete notification
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, setUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('packages')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [selectedNotifIds, setSelectedNotifIds] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [toast, setToast] = useState(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [notificationConfirm, setNotificationConfirm] = useState(null)

  useBodyScrollLock(showMobileSidebar)

  const showToast = (message, type = 'success') => setToast({ message, type })

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
  const selectedNotifSet = useMemo(() => new Set(selectedNotifIds), [selectedNotifIds])

  const handleOpenNotifs = () => {
    setShowNotifs(true)
  }

  const toggleNotificationSelection = (id) => {
    setSelectedNotifIds((prev) => (
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    ))
  }

  const handleNotificationClick = async (notification) => {
    if (selectionMode) {
      toggleNotificationSelection(notification.id)
      return
    }

    setSelectedNotification(notification)
    if (!notification.is_read) {
      try {
        const { data } = await markNotificationRead(notification.id)
        setNotifs((prev) => prev.map((n) => (n.id === notification.id ? data : n)))
        setSelectedNotification(data)
      } catch {
        setNotifs((prev) => prev.map((n) => (
          n.id === notification.id ? { ...n, is_read: true } : n
        )))
      }
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    if (unreadCount === 0) return
    try {
      await markAllNotificationsRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setSelectedNotification((prev) => (prev ? { ...prev, is_read: true } : prev))
    } catch {
      showToast('Failed to mark notifications as read.', 'error')
    }
  }

  const handleDeleteNotification = async (id) => {
    setNotificationConfirm({
      type: 'single',
      id,
      title: 'Delete notification?',
      message: 'Are you sure you want to delete this notification?',
      confirmLabel: 'Yes, Delete',
    })
  }

  const confirmDeleteNotification = async (id) => {
    try {
      await deleteNotification(id)
      setNotifs((prev) => prev.filter((n) => n.id !== id))
      setSelectedNotifIds((prev) => prev.filter((value) => value !== id))
      setSelectedNotification((prev) => (prev?.id === id ? null : prev))
      showToast('Notification deleted.')
    } catch {
      showToast('Failed to delete notification.', 'error')
    }
  }

  const handleDeleteSelectedNotifications = async () => {
    if (selectedNotifIds.length === 0) return
    setNotificationConfirm({
      type: 'selected',
      ids: [...selectedNotifIds],
      title: 'Delete selected?',
      message: `Are you sure you want to delete ${selectedNotifIds.length} selected notification${selectedNotifIds.length === 1 ? '' : 's'}?`,
      confirmLabel: 'Yes, Delete',
    })
  }

  const confirmDeleteSelectedNotifications = async (ids) => {
    try {
      await deleteSelectedNotifications(ids)
      const selected = new Set(ids)
      setNotifs((prev) => prev.filter((n) => !selected.has(n.id)))
      setSelectedNotification((prev) => (prev && selected.has(prev.id) ? null : prev))
      setSelectedNotifIds([])
      setSelectionMode(false)
      showToast('Selected notifications deleted.')
    } catch {
      showToast('Failed to delete selected notifications.', 'error')
    }
  }

  const handleDeleteAllNotifications = async () => {
    if (notifs.length === 0) return
    setNotificationConfirm({
      type: 'all',
      title: 'Delete all notifications?',
      message: 'Are you sure you want to delete all notifications? This cannot be undone.',
      confirmLabel: 'Yes, Delete All',
    })
  }

  const confirmDeleteAllNotifications = async () => {
    try {
      await deleteAllNotifications()
      setNotifs([])
      setSelectedNotifIds([])
      setSelectionMode(false)
      setSelectedNotification(null)
      showToast('All notifications deleted.')
    } catch {
      showToast('Failed to delete notifications.', 'error')
    }
  }

  const handleConfirmNotificationDelete = async () => {
    if (!notificationConfirm) return
    const action = notificationConfirm
    setNotificationConfirm(null)
    if (action.type === 'single') {
      await confirmDeleteNotification(action.id)
      return
    }
    if (action.type === 'selected') {
      await confirmDeleteSelectedNotifications(action.ids || [])
      return
    }
    if (action.type === 'all') {
      await confirmDeleteAllNotifications()
    }
  }

  const { data: mealTypes = [], loading: loadingTypes } = useApi(getMealTypes)
  const { data: orders = [], loading: loadingOrders, refetch: refetchOrders } = useApi(getMealOrders)
  const orderSessionCount = useMemo(() => {
    const keys = new Set()
    orders.forEach((o) => keys.add(o.session_id || `single-${o.id}`))
    return keys.size
  }, [orders])

  const [weeklyPlan, setWeeklyPlan] = useState({})
  const [mobileMenuCartVisible, setMobileMenuCartVisible] = useState(false)
  const [pendingPackageOrder, setPendingPackageOrder] = useState(null)

  const selectTab = useCallback((key) => {
    setActiveTab(key)
    setShowMobileSidebar(false)
    if (key !== 'menu') setMobileMenuCartVisible(false)
  }, [])

  const fetchWeeklyPlan = useCallback(async () => {
    try {
      const { data } = await getWeeklyMealPlan()
      const obj = {}
      data.forEach((s) => {
        obj[`${s.day_of_week}_${s.meal_time}_${s.meal_category}`] = s
      })
      setWeeklyPlan(obj)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchWeeklyPlan()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchWeeklyPlan])

  const handleSelectTab = (key) => {
    selectTab(key)
  }

  const handleLogoutClick = () => {
    setShowMobileSidebar(false)
    logout()
  }

  const renderSidebarContent = () => (
    <>
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
              onClick={() => handleSelectTab(key)}
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
              {key === 'history' && orderSessionCount > 0 && !pendingPackageOrder && (
                <span className="sd-nav-badge" style={{ marginLeft: 'auto' }}>
                  {orderSessionCount}
                </span>
              )}
              {key === 'history' && orderSessionCount > 0 && pendingPackageOrder && (
                <span className="sd-nav-badge">
                  {orderSessionCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="sd-sidebar-footer">
        <button onClick={handleLogoutClick} className="sd-logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} strokeWidth={2.2} />
          Logout
        </button>
      </div>
    </>
  )

  const handlePackageReady = async (payload, addMenuItems) => {
    if (addMenuItems) {
      setPendingPackageOrder(payload)
      selectTab('menu')
    } else {
      try {
        const { data: createdOrders = [] } = await placeMealOrdersBatch([payload])
        const firstCreatedOrder = Array.isArray(createdOrders) ? createdOrders[0] : null
        const packageReadyText = getPackageReadyTextFromPayload(payload, mealTypes)
        refetchOrders()
        setOrderSuccess({
          title: 'Order Placed Successfully',
          message: `Your meal package order has been sent to Cafe Lush. ${packageReadyText}.`,
          method: payload.delivery_type,
          deliveryAddress: payload.delivery_type === 'delivery' ? payload.delivery_address : '',
          pickupDetails: payload.delivery_type === 'takeaway' ? payload.delivery_address : '',
          phoneNumber: payload.phone_number,
          deliveryFeeLabel: payload.delivery_type === 'delivery'
            ? formatDeliveryFeeLabel(firstCreatedOrder?.delivery_fee, 'Free')
            : '',
          lines: [getPackageSummaryLine(payload, mealTypes)],
        })
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to place order.', 'error')
      }
    }
  }

  return (
    <div className="sd-root">
      <aside className="sd-sidebar">
        {renderSidebarContent()}
      </aside>

      {showMobileSidebar && (
        <div className="sd-mobile-sidebar-overlay" onClick={() => setShowMobileSidebar(false)}>
          <aside className="sd-mobile-sidebar-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sd-mobile-sidebar-head">
              <span className="sd-mobile-sidebar-title">Portal Menu</span>
              <button
                type="button"
                className="sd-mobile-sidebar-close"
                onClick={() => setShowMobileSidebar(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>
            <div className="sd-mobile-sidebar-scroll">
              {renderSidebarContent()}
            </div>
          </aside>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className={`sd-bottom-nav${mobileMenuCartVisible || showMobileSidebar ? ' sd-bottom-nav-hidden' : ''}`}>
        {TABS.map(({ key, label, Icon }) => {
          const NavIcon = Icon
          return (
            <button
              key={key}
              className={`sd-bottom-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => handleSelectTab(key)}
            >
              <NavIcon size={20} strokeWidth={2.2} />
              <span>{label.split(' ')[0]}</span>
              {key === 'menu' && pendingPackageOrder && (
                <span className="sd-bottom-nav-badge">+</span>
              )}
            </button>
          )
        })}
        <button className="sd-bottom-nav-item" onClick={handleLogoutClick}>
          <LogOut size={20} strokeWidth={2.2} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sd-main">
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button
              type="button"
              className="sd-mobile-menu-btn"
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Open portal menu"
            >
              <MenuIcon size={18} strokeWidth={2.3} />
            </button>
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
                      <div>
                        <span className="sd-notif-title">Notifications</span>
                        <p className="sd-notif-sub">
                          {unreadCount > 0
                            ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}`
                            : 'You are all caught up'}
                        </p>
                      </div>
                      <button onClick={() => setShowNotifs(false)} className="sd-notif-close">
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                    {notifs.length > 0 && (
                      <div className="sd-notif-actions">
                        <button
                          type="button"
                          className="sd-notif-action"
                          onClick={handleMarkAllNotificationsRead}
                          disabled={unreadCount === 0}
                        >
                          Mark all as read
                        </button>
                        <button
                          type="button"
                          className={`sd-notif-action ${selectionMode ? 'active' : ''}`}
                          onClick={() => {
                            setSelectionMode((prev) => {
                              if (prev) setSelectedNotifIds([])
                              return !prev
                            })
                          }}
                        >
                          {selectionMode ? 'Cancel select' : 'Select'}
                        </button>
                        {selectionMode && (
                          <button
                            type="button"
                            className="sd-notif-action danger"
                            onClick={handleDeleteSelectedNotifications}
                            disabled={selectedNotifIds.length === 0}
                          >
                            Delete selected ({selectedNotifIds.length})
                          </button>
                        )}
                        <button type="button" className="sd-notif-action danger" onClick={handleDeleteAllNotifications}>
                          Delete all
                        </button>
                      </div>
                    )}
                    <div className="sd-notif-list">
                      {notifs.length === 0 ? (
                        <div className="sd-notif-empty">
                          <Bell size={24} strokeWidth={2.1} />
                          <strong>No notifications yet</strong>
                          <span>Order updates will appear here.</span>
                        </div>
                      ) : (
                        notifs.map((n) => {
                          const card = formatNotificationCard(n)
                          return (
                            <div
                              role="button"
                              tabIndex={0}
                              key={n.id}
                              className={n.is_read ? `sd-notif-item ${card.tone}` : `sd-notif-item ${card.tone} unread`}
                              onClick={() => handleNotificationClick(n)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleNotificationClick(n)
                                }
                              }}
                            >
                              {selectionMode && (
                                <span className="sd-notif-select" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedNotifSet.has(n.id)}
                                    onChange={() => toggleNotificationSelection(n.id)}
                                    aria-label={`Select notification ${n.id}`}
                                  />
                                </span>
                              )}
                              <span className="sd-notif-icon">
                                {card.tone === 'danger'
                                  ? <X size={14} strokeWidth={2.4} />
                                  : card.tone === 'ready'
                                    ? <Package2 size={14} strokeWidth={2.4} />
                                    : <CheckCircle2 size={14} strokeWidth={2.4} />}
                              </span>
                              <div className="sd-notif-content">
                                <div className="sd-notif-topline">
                                  <p className="sd-notif-msg">{card.title}</p>
                                  {!n.is_read && <span className="sd-notif-new">New</span>}
                                </div>
                                <p className="sd-notif-detail">{card.detail}</p>
                                <div className="sd-notif-meta">
                                  <span>{card.meta}</span>
                                  <span>{formatNotificationTime(n.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })
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
              refetchWeeklyPlan={fetchWeeklyPlan}
            />
          )}

          {activeTab === 'menu' && (
            <MenuItemsPanel
              refetchOrders={refetchOrders}
              pendingPackageOrder={pendingPackageOrder}
              onPackageOrderSent={() => setPendingPackageOrder(null)}
              showToast={showToast}
              onOrderSuccess={setOrderSuccess}
              mealTypes={mealTypes}
              onFloatingCartBarChange={setMobileMenuCartVisible}
            />
          )}

          {activeTab === 'history' && (
            <OrderHistoryPanel
              orders={orders}
              loading={loadingOrders}
              onClear={refetchOrders}
              showToast={showToast}
            />
          )}

          {activeTab === 'analytics' && (
            <FoodAnalyticsPanel orders={orders} />
          )}

          {activeTab === 'suggestions' && (
            <SuggestionsPanel showToast={showToast} />
          )}

          {activeTab === 'about' && (
            <AboutCafeLushPanel />
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

      {orderSuccess && (
        <OrderSuccessModal
          order={orderSuccess}
          onClose={() => setOrderSuccess(null)}
          onViewHistory={() => {
            setOrderSuccess(null)
            selectTab('history')
          }}
        />
      )}

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onDelete={handleDeleteNotification}
        />
      )}

      {notificationConfirm && (
        <ConfirmDialog
          title={notificationConfirm.title}
          message={notificationConfirm.message}
          confirmLabel={notificationConfirm.confirmLabel}
          cancelLabel="No, Keep"
          onConfirm={handleConfirmNotificationDelete}
          onCancel={() => setNotificationConfirm(null)}
        />
      )}
    </div>
  )
}


