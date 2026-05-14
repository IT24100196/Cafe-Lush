import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  BookOpen,
  ChefHat,
  Clock3,
  Coffee,
  CalendarDays,
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

function normalizeMealSlotName(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized.includes('breakfast')) return 'breakfast'
  if (normalized.includes('dinner')) return 'dinner'
  if (normalized.includes('lunch')) return 'lunch'
  return normalized
}

const POPULAR_PREVIEW_ITEM_ORDER = [
  ['veg paneer string hoppers kottu'],
  ['prawn noodles'],
  ['chicken noodles soup', 'chicken noodels soup'],
  ['chicken sausages sandwich with cheese', 'chicken sausage sandwich with cheese'],
  ['butter milk', 'buttermilk'],
  ['vanila waffle with fruit nuts', 'vanilla waffle with fruit nuts', 'vanila waffle(with fruit/nuts)', 'vanilla waffle(with fruit/nuts)'],
]

function normalizeCategoryLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeMenuCategorySource(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ORDER_SECTION_IDS = {
  all: 'student-ordering-top',
  mealPackages: 'student-ordering-meal-packages',
}

const MENU_CATEGORY_GROUPS = [
  { key: 'vege-food', label: '🥬 Vege Food' },
  { key: 'non-veg-food', label: '🍗 Non Veg Food' },
  { key: 'shanthas-daily', label: "⭐ Shantha's Daily" },
  { key: 'soups', label: '🥣 Soups' },
  { key: 'sandwiches', label: '🥪 Sandwiches' },
  { key: 'appam', label: '🍳 Appam' },
  { key: 'salads', label: '🥗 Salads' },
  { key: 'light-meals', label: '🍽 Light Meals' },
  { key: 'snacks', label: '🍟 Snacks' },
  { key: 'hot-drinks', label: '☕ Hot Drinks' },
  { key: 'cold-drinks', label: '🥤 Cold Drinks' },
  { key: 'ice-cream', label: '🍦 Ice Cream' },
  { key: 'desserts', label: '🍰 Desserts' },
]

const ORDER_SHORTCUTS = [
  { key: 'all', label: '✨ All' },
  { key: 'meal-packages', label: '🍱 Meal Packages' },
  ...MENU_CATEGORY_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
  })),
]

function getMenuGroupKey(categoryName) {
  const normalized = normalizeMenuCategorySource(categoryName)

  if (normalized.startsWith('vege food')) return 'vege-food'
  if (normalized.startsWith('non veg food')) return 'non-veg-food'
  if (normalized.startsWith('shantha s special daily')) return 'shanthas-daily'
  if (normalized.startsWith('veg soup') || normalized.startsWith('non veg soup')) return 'soups'
  if (normalized.startsWith('sandwich') || normalized.startsWith('veg bread tost')) return 'sandwiches'
  if (normalized.startsWith('egg appam')) return 'appam'
  if (normalized.startsWith('salads')) return 'salads'
  if (normalized.startsWith('light meals')) return 'light-meals'
  if (normalized.startsWith('healthy snacks') || normalized.startsWith('quick bites')) return 'snacks'
  if (normalized.startsWith('hot blend')) return 'hot-drinks'
  if (
    normalized.startsWith('natural coolers')
    || normalized.startsWith('cold blend')
    || normalized.startsWith('boba coolers')
    || normalized.startsWith('shacks')
  ) return 'cold-drinks'
  if (normalized.startsWith('ice cream')) return 'ice-cream'
  if (normalized.startsWith('gel dessert') || normalized.startsWith('honecomb cake')) return 'desserts'

  return ''
}

const BASE_ORDER_SHORTCUTS = [
  { key: 'all', label: '✨ All' },
  { key: 'meal-packages', label: '🍱 Meal Packages' },
]

function getStudentMenuGroupEmoji(menuGroupName, categoryName = '') {
  const normalized = normalizeMenuCategorySource(`${menuGroupName} ${categoryName}`)

  if (normalized.includes('veg')) return '🥬'
  if (normalized.includes('non veg')) return '🍗'
  if (normalized.includes('daily special') || normalized.includes('special')) return '⭐'
  if (normalized.includes('soup')) return '🥣'
  if (normalized.includes('sandwich') || normalized.includes('toast')) return '🥪'
  if (normalized.includes('appam')) return '🍳'
  if (normalized.includes('salad')) return '🥗'
  if (normalized.includes('light meal')) return '🍽️'
  if (normalized.includes('snack') || normalized.includes('quick bite')) return '🍟'
  if (normalized.includes('hot blend') || normalized.includes('hot drink')) return '☕'
  if (
    normalized.includes('natural cooler')
    || normalized.includes('cold blend')
    || normalized.includes('boba')
    || normalized.includes('cooler')
    || normalized.includes('shake')
  ) return '🥤'
  if (normalized.includes('ice cream')) return '🍦'
  if (normalized.includes('waffle')) return '🧇'
  if (normalized.includes('dessert') || normalized.includes('cake')) return '🍰'
  if (normalized.includes('drink')) return '🥤'
  return '🍽️'
}

function getStudentMenuSectionKey(itemOrName) {
  const base = typeof itemOrName === 'string'
    ? itemOrName
    : (itemOrName?.menu_group_name || itemOrName?.category_name || 'Menu Items')
  const normalized = normalizeMenuCategorySource(base).replace(/\s+/g, '-')
  return `menu-group-${normalized || 'menu-items'}`
}

function getStudentMenuSectionLabel(item) {
  const groupName = item?.menu_group_name || item?.category_name || 'Menu Items'
  return `${getStudentMenuGroupEmoji(groupName, item?.category_name)} ${groupName}`
}

function getStudentItemActiveVariants(item) {
  return (item?.variants || []).filter((variant) => variant?.is_active !== false)
}

function hasStudentVariantChoices(item) {
  return getStudentItemActiveVariants(item).length > 1
}

function getStudentCartLineKey(item, variant = null) {
  return variant ? `student-menu-${item.id}::variant-${variant.id}` : `student-menu-${item.id}`
}

function buildStudentVariantItemName(item, variant) {
  const groupLabelRaw = (item?.menu_group_name || '').trim()
  const groupLabel = groupLabelRaw === 'Shakes' ? 'Shake' : groupLabelRaw
  const baseName = (item?.name || '').trim()
  const variantName = (variant?.name || '').trim()
  const baseLower = baseName.toLowerCase()
  const groupLower = groupLabel.toLowerCase()
  const fullBaseName = groupLabel && !baseLower.includes(groupLower)
    ? `${baseName} ${groupLabel}`
    : baseName
  return variantName ? `${fullBaseName} - ${variantName}` : fullBaseName
}

function buildStudentCartItem(item, variant = null) {
  const hasChoices = hasStudentVariantChoices(item)
  const useVariant = hasChoices && variant
  return {
    id: getStudentCartLineKey(item, useVariant ? variant : null),
    source_item_id: item.id,
    menu_item_id: item.id,
    item_variant_id: useVariant ? variant.id : null,
    item_id: item.item_id || '',
    name: useVariant ? buildStudentVariantItemName(item, variant) : item.name,
    price: Number(useVariant ? variant.price : item.price || 0),
    image_url: item.image_url || '',
    category_name: item.menu_group_name || item.category_name || 'Menu Item',
    menu_group_name: item.menu_group_name || '',
  }
}

function getStudentItemCartQuantity(cart, item) {
  return Object.values(cart || {}).reduce((sum, entry) => (
    Number(entry?.item?.source_item_id) === Number(item?.id) ? sum + Number(entry?.qty || 0) : sum
  ), 0)
}

const STUDENT_CART_DRAFT_KEY_PREFIX = 'student_cart_draft_'

function getStudentCartDraftStorageKey(user) {
  const identity = user?.id || user?.student_id || user?.username || user?.email || 'student'
  return `${STUDENT_CART_DRAFT_KEY_PREFIX}${identity}`
}

function readStudentCartDraft(storageKey) {
  const emptyDraft = {
    selectedDate: '',
    packageCart: {},
    pendingPackageOrder: null,
    menuCart: {},
  }
  if (!storageKey) return emptyDraft
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return emptyDraft
    const parsed = JSON.parse(raw)
    return {
      selectedDate: typeof parsed?.selectedDate === 'string' ? parsed.selectedDate : '',
      packageCart: parsed?.packageCart && typeof parsed.packageCart === 'object' ? parsed.packageCart : {},
      pendingPackageOrder: parsed?.pendingPackageOrder ?? null,
      menuCart: parsed?.menuCart && typeof parsed.menuCart === 'object' ? parsed.menuCart : {},
    }
  } catch {
    return emptyDraft
  }
}

function writeStudentCartDraft(storageKey, draft) {
  if (!storageKey) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(draft))
  } catch {
    // ignore persistence failures
  }
}

function removeStudentCartDraft(storageKey) {
  if (!storageKey) return
  try {
    localStorage.removeItem(storageKey)
  } catch {
    // ignore removal failures
  }
}

function areSharedCartSnapshotsEqual(prev = {}, next = {}) {
  if (prev === next) return true
  if ((prev.selectedDateLabel || '') !== (next.selectedDateLabel || '')) return false
  if ((prev.summaryTotal || 0) !== (next.summaryTotal || 0)) return false
  if ((prev.cartError || '') !== (next.cartError || '')) return false
  if (Boolean(prev.hasSummaryItems) !== Boolean(next.hasSummaryItems)) return false

  const prevPackages = Array.isArray(prev.summaryPackageEntries) ? prev.summaryPackageEntries : []
  const nextPackages = Array.isArray(next.summaryPackageEntries) ? next.summaryPackageEntries : []
  if (prevPackages.length !== nextPackages.length) return false
  for (let index = 0; index < prevPackages.length; index += 1) {
    const prevEntry = prevPackages[index]
    const nextEntry = nextPackages[index]
    if ((prevEntry?.key || prevEntry?.name || '') !== (nextEntry?.key || nextEntry?.name || '')) return false
    if (Number(prevEntry?.quantity || prevEntry?.qty || 0) !== Number(nextEntry?.quantity || nextEntry?.qty || 0)) return false
  }

  const prevMenu = Array.isArray(prev.summaryMenuEntries) ? prev.summaryMenuEntries : []
  const nextMenu = Array.isArray(next.summaryMenuEntries) ? next.summaryMenuEntries : []
  if (prevMenu.length !== nextMenu.length) return false
  for (let index = 0; index < prevMenu.length; index += 1) {
    const prevEntry = prevMenu[index]
    const nextEntry = nextMenu[index]
    if (Number(prevEntry?.item?.id || 0) !== Number(nextEntry?.item?.id || 0)) return false
    if (Number(prevEntry?.qty || 0) !== Number(nextEntry?.qty || 0)) return false
  }

  return true
}

function normalizePreviewItemName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPopularPreviewItems(items = []) {
  const withImages = items.filter((item) => item.image_url)
  if (withImages.length === 0) return []

  const usedItemIds = new Set()
  const selected = []

  POPULAR_PREVIEW_ITEM_ORDER.forEach((nameOptions) => {
    const match = withImages.find((item) => {
      const normalizedName = normalizePreviewItemName(item.name)
      return !usedItemIds.has(item.id) && nameOptions.some((candidate) => normalizePreviewItemName(candidate) === normalizedName)
    })

    if (!match) return
    selected.push(match)
    usedItemIds.add(match.id)
  })

  if (selected.length >= 6) return selected.slice(0, 6)

  const usedCategories = new Set(selected.map((item) => normalizeCategoryLabel(item.category_name)))

  withImages.forEach((item) => {
    if (selected.length >= 6) return
    const normalizedCategory = normalizeCategoryLabel(item.category_name)
    if (usedItemIds.has(item.id) || usedCategories.has(normalizedCategory)) return
    selected.push(item)
    usedItemIds.add(item.id)
    usedCategories.add(normalizedCategory)
  })

  return selected.slice(0, 6)
}

function normalizeAreaSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPackageReadyTime(mealTypeName) {
  const normalized = normalizeMealSlotName(mealTypeName)
  if (normalized === 'breakfast') return '7:30 AM'
  if (normalized === 'lunch') return '12:30 PM'
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
const MEAL_CARD_IMAGES = {
  breakfast: {
    defaultPreference: 'veg',
    image: '/image/meal-breakfast-veg-hero.png',
    label: 'Veg Rice & Curry',
  },
  lunch: {
    defaultPreference: 'non-veg',
    image: '/image/meal-lunch-nonveg-special.png',
    label: 'Special Lunch',
  },
  dinner: {
    defaultPreference: 'non-veg',
    image: '/image/meal-dinner-nonveg-hero.png',
    label: 'Non-Veg Rice & Curry',
  },
}

const PACKAGE_CATEGORY_META = {
  veg: {
    title: 'Veg Rice & Curry',
    image: '/image/meal-breakfast-veg-hero.png',
    badge: 'Veg Packages',
    icon: Vegan,
  },
  nonveg: {
    title: 'Non-Veg Rice & Curry',
    image: '/image/meal-dinner-nonveg-hero.png',
    badge: 'Non-Veg Packages',
    icon: ChefHat,
  },
}

const PACKAGE_MEAL_META = {
  breakfast: {
    label: 'Breakfast',
    icon: Sun,
  },
  lunch: {
    label: 'Lunch',
    icon: HandPlatter,
  },
  dinner: {
    label: 'Dinner',
    icon: MoonStar,
  },
}

function getPackageTimingDetails(mealTime) {
  const normalized = String(mealTime || '').trim().toLowerCase()
  if (normalized === 'breakfast') {
    return {
      title: 'Breakfast Package',
      orderText: 'Order before 8:00 PM previous day',
      readyText: getPackageReadyText('breakfast'),
    }
  }
  if (normalized === 'dinner') {
    return {
      title: 'Dinner Package',
      orderText: 'Order before 12:00 PM same day',
      readyText: getPackageReadyText('dinner'),
    }
  }
  if (normalized === 'lunch') {
    return {
      title: 'Special Lunch',
      orderText: 'Order before 8:00 AM same day',
      readyText: getPackageReadyText('lunch'),
    }
  }
  return {
    title: 'Meal Package',
    orderText: 'Order window will be announced soon',
    readyText: getPackageReadyText(normalized),
  }
}

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
  const normalized = normalizeMealSlotName(mealTypeName)
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

function OrderMethodModal({
  onSelect,
  onCancel,
  title = 'Choose Order Method',
  subtitle = 'Select how you would like to receive this order.',
  options = null,
}) {
  useBodyScrollLock()

  const orderOptions = options || [
    { value: 'takeaway', label: 'Takeaway', sub: 'Pick up in about 30 minutes', icon: Package2 },
    { value: 'delivery', label: 'Delivery', sub: 'Deliver to your address', icon: Truck },
  ]

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sd-modal-close-btn sd-modal-close-btn-danger" onClick={onCancel} aria-label="Close order method">
          <X size={14} strokeWidth={2.5} />
        </button>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">{title}</h3>
          <p className="sd-modal-sub">{subtitle}</p>
        </div>

        <div className="sd-ot-grid">
          {orderOptions.map(({ value, label, sub, icon }) => {
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
    return query
      ? deliveryAreas.filter((area) => {
          const searchable = [area.name, ...(Array.isArray(area.aliases) ? area.aliases : [])]
            .map(normalizeAreaSearchText)
            .join(' ')
          return searchable.includes(query)
        })
      : deliveryAreas
  }, [cleanAreaQuery, deliveryAreas])

  const hasAreaSearch = Boolean(normalizeAreaSearchText(cleanAreaQuery))

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

          {requireFeeEstimate && allowCurrentLocation && (
            <div className="sd-location-toggle">
              {locationSource === 'current_location' ? (
                <div className="sd-location-toggle-active">
                  <span className="sd-location-toggle-status">
                    <MapPinned size={15} strokeWidth={2.2} />
                    Using Current Location
                  </span>
                  <button
                    type="button"
                    className="sd-location-toggle-btn secondary"
                    onClick={() => handleLocationSourceChange('address')}
                  >
                    Cancel Current Location
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="sd-location-toggle-btn"
                  onClick={() => {
                    handleLocationSourceChange('current_location')
                    handleUseCurrentLocation()
                  }}
                >
                  <MapPinned size={15} strokeWidth={2.2} />
                  Use Current Location
                </button>
              )}
            </div>
          )}

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
                className={`sd-input sd-area-input${selectedArea ? ' has-clear' : ''}`}
                type="text"
                placeholder={areasState === 'loading' ? 'Loading delivery areas...' : 'Choose your town or area. Example: Kokuvil, Thirunelveli, Chunnakam.'}
                value={areaQuery}
                disabled={areasState === 'loading'}
                aria-expanded={areaMenuOpen}
                aria-controls="sd-delivery-area-options"
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
              {areaMenuOpen && areasState === 'ready' && !selectedArea && (
                <div id="sd-delivery-area-options" className="sd-area-options">
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
                  )) : hasAreaSearch ? (
                    <div className="sd-area-empty">No matching area found.</div>
                  ) : (
                    <div className="sd-area-empty">No delivery areas are available right now.</div>
                  )}
                </div>
              )}
            </div>
            {areasError && <p className="sd-field-error">{areasError}</p>}
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
              if (requireFeeEstimate) {
                payload.delivery_fee_label = feeInfo?.delivery_fee_label || formatDeliveryFeeLabel(feeInfo?.delivery_fee, '')
                payload.delivery_fee_value = Number(feeInfo?.delivery_fee || 0)
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
  const name = normalizeMealSlotName(mealTypeName)

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

  if (name === 'lunch') {
    const d = new Date(date)
    d.setHours(8, 0, 0, 0)
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
function AddMenuItemsPrompt({
  onAddItems,
  onPlaceOnly,
  onCancel,
  deliveryType = 'takeaway',
  canAddItems = true,
  addItemsHint = MENU_ITEM_ORDER_HOURS_MESSAGE,
}) {
  useBodyScrollLock()
  const isDelivery = String(deliveryType || '').toLowerCase() === 'delivery'
  const promptTitle = isDelivery ? 'Delivery Details Ready' : 'Pickup Details Ready'
  const promptText = isDelivery
    ? 'Your meal package delivery details are saved for this checkout.'
    : 'Your meal package pickup details are saved for this checkout.'
  const primaryNote = isDelivery
    ? 'Place Package Only keeps this meal package as a delivery order.'
    : 'Place Package Only keeps this meal package as a takeaway order.'
  const secondaryNote = isDelivery
    ? 'If you add cafe items, the delivery fee will be calculated for the combined order at checkout.'
    : 'If you add cafe items, they will be added to the same takeaway order.'

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal sd-package-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="sd-package-prompt-icon">
          <Package2 size={30} strokeWidth={2.2} />
        </div>

        <h3 className="sd-package-prompt-title">{promptTitle}</h3>
        <p className="sd-package-prompt-text">{promptText}</p>

        <div className="sd-package-prompt-note">
          <CheckCircle2 size={15} strokeWidth={2.3} />
          <span>{primaryNote}</span>
        </div>

        <div className="sd-package-prompt-note warning">
          <Package2 size={15} strokeWidth={2.3} />
          <span>{secondaryNote}</span>
        </div>

        {!canAddItems && (
          <div className="sd-package-prompt-note warning">
            <Clock3 size={15} strokeWidth={2.3} />
            <span>{addItemsHint}</span>
          </div>
        )}

        <div className="sd-package-prompt-actions">
          <button
            type="button"
            className="sd-btn-primary sd-package-prompt-primary"
            onClick={onAddItems}
            disabled={!canAddItems}
          >
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

function PackageSuggestionModal({ suggestedLabel, mealTitle = 'selected', onAddOther, onContinue, onClose }) {
  useBodyScrollLock()

  return createPortal(
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal sd-package-upsell-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h3 className="sd-modal-title">Add Another Option?</h3>
          <p className="sd-modal-sub">
            You can continue now, or add a {suggestedLabel.toLowerCase()} {mealTitle.toLowerCase()} package before checkout.
          </p>
        </div>

        <div className="sd-package-upsell-note">
          <CheckCircle2 size={16} strokeWidth={2.3} />
          <span>You can mix veg and non-veg only within the same selected meal slot and date.</span>
        </div>

        <div className="sd-package-upsell-actions">
          <button type="button" className="sd-btn-primary" onClick={onAddOther}>
            Add {suggestedLabel} {mealTitle}
          </button>
          <button type="button" className="sd-btn-secondary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PackageCategoryDetailsModal({
  category,
  selectedDate,
  dateOptions,
  maxDate,
  cartEntries,
  cartCount,
  cartTotal,
  cartError = '',
  onClose,
  onDateChange,
  onAddPackage,
  onDecreasePackage,
  onRemovePackage,
  onClearCart,
  onContinue,
  selectionHint = '',
  lockedDateValue = '',
  focusMealTime = '',
}) {
  useBodyScrollLock()
  const modalRef = useRef(null)
  const cartSectionRef = useRef(null)
  const packageRefs = useRef({})
  const [showMobileReviewBar, setShowMobileReviewBar] = useState(false)
  const CategoryIcon = category?.icon || UtensilsCrossed

  const handleReviewCart = (e) => {
    e?.stopPropagation?.()
    const modalEl = modalRef.current
    const cartEl = cartSectionRef.current
    if (!modalEl || !cartEl) return

    const modalRect = modalEl.getBoundingClientRect()
    const cartRect = cartEl.getBoundingClientRect()
    const nextTop = modalEl.scrollTop + (cartRect.top - modalRect.top) - 12
    modalEl.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
  }

  useEffect(() => {
    const modalEl = modalRef.current
    const cartEl = cartSectionRef.current
    if (!modalEl || !cartEl || cartCount <= 0) {
      setShowMobileReviewBar(false)
      return
    }

    const updateReviewBarVisibility = () => {
      const modalRect = modalEl.getBoundingClientRect()
      const cartRect = cartEl.getBoundingClientRect()
      const isVisibleInModal = cartRect.top < (modalRect.bottom - 96) && cartRect.bottom > (modalRect.top + 24)
      setShowMobileReviewBar(!isVisibleInModal)
    }

    updateReviewBarVisibility()
    modalEl.addEventListener('scroll', updateReviewBarVisibility, { passive: true })
    window.addEventListener('resize', updateReviewBarVisibility)

    return () => {
      modalEl.removeEventListener('scroll', updateReviewBarVisibility)
      window.removeEventListener('resize', updateReviewBarVisibility)
    }
  }, [cartCount, category?.key, selectedDate])

  useEffect(() => {
    if (!focusMealTime) return
    const modalEl = modalRef.current
    const normalizedMealTime = normalizeMealSlotName(focusMealTime)
    const target = packageRefs.current[normalizedMealTime]
    if (!modalEl || !target) return

    requestAnimationFrame(() => {
      const modalRect = modalEl.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const nextTop = modalEl.scrollTop + (targetRect.top - modalRect.top) - 12
      modalEl.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
    })
  }, [category?.key, focusMealTime, selectedDate])

  if (!category) return null

  return createPortal(
    <div className="sd-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`sd-modal sd-package-category-modal${cartCount > 0 && showMobileReviewBar ? ' has-mobile-review-bar' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="sd-modal-close-btn sd-package-category-close-btn"
          onClick={onClose}
          aria-label="Close package details"
        >
          <X size={16} strokeWidth={2.4} />
        </button>

        <div className="sd-package-category-hero">
          <img src={category.image} alt={category.title} className="sd-package-category-hero-img" />
          <span className={`sd-package-category-badge ${category.key === 'veg' ? 'veg' : 'nonveg'}`}>
            <CategoryIcon size={15} strokeWidth={2.2} />
            {category.badge}
          </span>
        </div>

        <div className="sd-package-category-body">
          <div className="sd-package-category-datebar">
            <div>
              <p className="sd-package-category-datebar-kicker">Choose meal day</p>
              <p className="sd-package-category-datebar-text">Switch the day here to view package details without leaving this window.</p>
            </div>
            <div className="sd-date-strip compact" aria-label="Choose package date">
              {dateOptions.map((option) => {
                const isLockedOut = Boolean(lockedDateValue) && option.value !== lockedDateValue
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`sd-date-chip${selectedDate === option.value ? ' active' : ''}${isLockedOut ? ' disabled' : ''}`}
                    onClick={() => onDateChange(option.value)}
                    disabled={isLockedOut}
                    title={isLockedOut ? 'Clear the selected package to switch to another date.' : ''}
                  >
                    <span>{option.label}</span>
                    <small>{option.sub}</small>
                  </button>
                )
              })}
              <input
                className="sd-date-picker"
                type="date"
                min={dateOptions[0]?.value}
                max={maxDate}
                value={selectedDate}
                disabled={Boolean(lockedDateValue)}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
          </div>

          <div className="sd-modal-header">
            <h3 className="sd-modal-title">{category.title}</h3>
            <p className="sd-modal-sub">{category.dateLabel} package details</p>
          </div>

          <div className="sd-package-category-layout">
            <div>
              {selectionHint && (
                <div className="sd-package-category-cart-note" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={16} strokeWidth={2.3} />
                  <span>{selectionHint}</span>
                </div>
              )}

              {category.packages.length === 0 ? (
                <div className="sd-package-category-empty">
                  <UtensilsCrossed size={18} strokeWidth={2.2} />
                  <span>No packages are configured for this category on the selected date.</span>
                </div>
              ) : (
                <div className="sd-package-category-list">
                  {category.packages.map((pkg) => {
                    const PackageIcon = pkg.icon || UtensilsCrossed
                    const quantity = pkg.cartQuantity || 0
                    return (
                      <article
                        key={pkg.key}
                        ref={(node) => {
                          packageRefs.current[normalizeMealSlotName(pkg.mealTime)] = node
                        }}
                        className="sd-package-category-card"
                        style={{
                          borderColor: pkg.border,
                          background: pkg.background,
                        }}
                      >
                        <div className="sd-package-category-card-head">
                          <div className="sd-package-category-card-title">
                            <span className="sd-package-category-card-icon" style={{ color: pkg.color }}>
                              <PackageIcon size={16} strokeWidth={2.2} />
                            </span>
                            <div>
                              <strong>{pkg.title}</strong>
                              <small>{pkg.priceLabel}</small>
                            </div>
                          </div>
                          {!pkg.canOrder && (
                            <span className="sd-package-category-status viewonly">View Only</span>
                          )}
                          {pkg.closed && (
                            <span className="sd-package-category-status closed">Closed</span>
                          )}
                        </div>

                        <div className="sd-package-category-card-meta">
                          <span>
                            <Clock3 size={14} strokeWidth={2.2} />
                            {pkg.orderText}
                          </span>
                          <span>
                            <Package2 size={14} strokeWidth={2.2} />
                            {pkg.readyText}
                          </span>
                        </div>

                        {pkg.dishes.length === 0 ? (
                          <p className="sd-package-category-card-empty">Dishes will be updated soon.</p>
                        ) : (
                          <>
                            <div className="sd-package-category-card-dishes-head">
                              <UtensilsCrossed size={14} strokeWidth={2.1} />
                              <span>What&apos;s inside this package</span>
                            </div>
                            <div className="sd-package-category-card-dishes">
                              {pkg.dishes.map((dish) => (
                                <span key={`${pkg.key}_${dish}`}>{dish}</span>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="sd-package-category-card-actions">
                          {pkg.canOrder && !pkg.closed && !pkg.selectionBlocked ? (
                            quantity > 0 ? (
                              <div className="sd-package-inline-qty">
                                <button type="button" className="sd-package-inline-qty-btn" onClick={() => onDecreasePackage(pkg)}>
                                  <Minus size={14} strokeWidth={2.4} />
                                </button>
                                <span className="sd-package-inline-qty-value">{quantity}</span>
                                <button type="button" className="sd-package-inline-qty-btn" onClick={() => onAddPackage(pkg)}>
                                  <Plus size={14} strokeWidth={2.4} />
                                </button>
                              </div>
                            ) : (
                              <button type="button" className="sd-package-add-cart-btn" onClick={() => onAddPackage(pkg)}>
                                <ShoppingCart size={15} strokeWidth={2.2} />
                                Add to Cart
                              </button>
                            )
                          ) : (
                            <div className="sd-package-category-card-note">
                              {pkg.closed
                                ? 'Ordering closed for this package.'
                                : pkg.selectionBlocked
                                  ? pkg.selectionBlockedReason
                                  : 'This package is available to view only.'}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <aside ref={cartSectionRef} className="sd-package-category-cart">
              <div className="sd-package-category-cart-head">
                <div>
                  <h4>Your Cart</h4>
                  <p>{cartCount === 0 ? 'Add packages to continue.' : `${cartCount} package${cartCount === 1 ? '' : 's'} selected`}</p>
                </div>
                {cartCount > 0 && <span className="sd-package-category-cart-count">{cartCount}</span>}
              </div>

              {cartEntries.length === 0 ? (
                <div className="sd-package-category-cart-empty">
                  <ShoppingCart size={18} strokeWidth={2.2} />
                  <span>No meal packages in your cart yet.</span>
                </div>
              ) : (
                <div className="sd-package-category-cart-list">
                  {cartEntries.map((entry) => (
                    <div key={entry.key} className="sd-package-category-cart-row">
                      <div>
                        <strong>{entry.label}</strong>
                        <span>{entry.dateLabel}</span>
                        <span>{entry.priceLabel} each</span>
                      </div>
                      <div className="sd-package-category-cart-controls">
                        <button type="button" className="sd-package-inline-qty-btn" onClick={() => onDecreasePackage(entry)}>
                          <Minus size={14} strokeWidth={2.4} />
                        </button>
                        <span className="sd-package-inline-qty-value">{entry.quantity}</span>
                        <button type="button" className="sd-package-inline-qty-btn" onClick={() => onAddPackage(entry)}>
                          <Plus size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="sd-package-category-cart-note">
                <CheckCircle2 size={16} strokeWidth={2.3} />
                <span>Meal packages include free delivery during package checkout.</span>
              </div>

              {cartError && <div className="sd-alert error">{cartError}</div>}

              <div className="sd-package-category-cart-total">
                <span>Total</span>
                <strong>LKR {cartTotal.toFixed(2)}</strong>
              </div>

              <div className="sd-package-category-actions cart">
                <button type="button" className="sd-btn-secondary" disabled={cartEntries.length === 0} onClick={onClearCart}>
                  Clear Cart
                </button>
                <button type="button" className="sd-btn-primary" disabled={cartEntries.length === 0} onClick={onContinue}>
                  Continue
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {cartCount > 0 && showMobileReviewBar && (
        <button
          type="button"
          className="sd-package-mobile-cart-bar"
          onClick={handleReviewCart}
        >
          <span className="sd-package-mobile-cart-bar-main">
            <span className="sd-package-mobile-cart-bar-title">
              <ShoppingCart size={15} strokeWidth={2.2} />
              {cartCount} package{cartCount === 1 ? '' : 's'}
            </span>
            <span className="sd-package-mobile-cart-bar-total">Rs. {cartTotal.toFixed(2)}</span>
          </span>
          <span className="sd-package-mobile-cart-bar-cta">Review Cart</span>
        </button>
      )}
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

function getWeeklyPlanDayKeyForDate(value) {
  const date = new Date(`${value}T00:00:00`)
  const dayIndex = Number.isNaN(date.getTime()) ? new Date().getDay() : date.getDay()
  return dayIndex === 0 ? 6 : dayIndex - 1
}

function getPendingPackagePriceValue(payload, mealTypes = [], weeklyPlan = {}) {
  const mealType = mealTypes.find((type) => Number(type.id) === Number(payload?.meal_type))
  const mealTime = normalizeMealSlotName(mealType?.name)
  if (!mealTime) return 0

  const orderDate = payload?.order_date || toInputDate(new Date())
  const dayKey = getWeeklyPlanDayKeyForDate(orderDate)
  const mealCategory = payload?.preference === 'non-veg' ? 'nonveg' : 'veg'
  const slotDayKey = mealTime === 'lunch' && (dayKey === 5 || dayKey === 6) ? 5 : dayKey
  const slot = weeklyPlan?.[`${slotDayKey}_${mealTime}_${mealCategory}`]
  const price = Number(slot?.price || 0)
  return Number.isFinite(price) ? price : 0
}

function getPendingPackageEntries(payload, mealTypes = [], weeklyPlan = {}) {
  return normalizePackagePayloads(payload).map((item, index) => {
    const summary = getPackageSummaryLine(item, mealTypes)
    const priceValue = getPendingPackagePriceValue(item, mealTypes, weeklyPlan)
    return {
      ...summary,
      key: `${item?.meal_type || 'pkg'}_${item?.preference || 'pref'}_${item?.order_date || 'date'}_${index}`,
      priceValue,
      subtotalLabel: priceValue > 0 ? `Rs. ${(priceValue * summary.qty).toFixed(2)}` : '',
      unitPriceLabel: priceValue > 0 ? `Rs. ${priceValue.toFixed(2)} each` : '',
      payload: item,
    }
  })
}

function getPackageReadyTextFromPayload(payload, mealTypes = []) {
  const mealType = mealTypes.find((type) => Number(type.id) === Number(payload?.meal_type))
  return getPackageReadyText(mealType?.name)
}

function normalizePackagePayloads(payload) {
  if (!payload) return []
  return Array.isArray(payload) ? payload.filter(Boolean) : [payload]
}

function getPackageSummaryLines(payload, mealTypes = []) {
  return normalizePackagePayloads(payload).map((item) => getPackageSummaryLine(item, mealTypes))
}

function getPackageReadyTextFromPayloads(payload, mealTypes = []) {
  const names = normalizePackagePayloads(payload)
    .map((item) => {
      const mealType = mealTypes.find((type) => Number(type.id) === Number(item?.meal_type))
      return mealType?.name
    })
    .filter(Boolean)

  const uniqueNames = [...new Set(names.map((name) => name.toLowerCase()))]
  if (uniqueNames.length > 1) {
    return 'Breakfast is ready at 7:30 AM. Lunch is ready at 12:30 PM. Dinner is ready at 7:00 PM.'
  }
  return getPackageReadyTextFromPayload(normalizePackagePayloads(payload)[0], mealTypes)
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

function CombinedOrderReviewModal({ review, submitting = false, onConfirm, onCancel }) {
  useBodyScrollLock()

  if (!review) return null

  const isDelivery = review.method === 'delivery'

  return createPortal(
    <div className="sd-modal-overlay" onClick={onCancel}>
      <div className="sd-modal sd-order-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-order-review-hero">
          <div className="sd-order-review-icon">
            <Package2 size={32} strokeWidth={2.2} />
          </div>
          <p className="sd-order-review-kicker">Final Review</p>
          <h3 className="sd-order-review-title">{review.title}</h3>
          <p className="sd-order-review-text">{review.message}</p>
        </div>

        <div className="sd-order-review-body">
          <div className="sd-order-review-section">
            <div className="sd-order-review-section-title">
              <Package2 size={16} strokeWidth={2.2} />
              Meal Packages
            </div>
            <div className="sd-order-review-lines">
              {review.packageLines.map((line, index) => (
                <div key={`${line.name}-${index}`} className="sd-order-review-line">
                  <div>
                    <strong>{line.name}</strong>
                    {line.date && <span>{formatOrderSuccessDate(line.date)}</span>}
                    {line.subtotalLabel && <span>{line.subtotalLabel}</span>}
                  </div>
                  <em>x{line.qty}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="sd-order-review-section">
            <div className="sd-order-review-section-title">
              <ShoppingCart size={16} strokeWidth={2.2} />
              Cafe Items
            </div>
            {review.itemLines.length === 0 ? (
              <div className="sd-order-review-empty">No cafe items added to this order.</div>
            ) : (
              <div className="sd-order-review-lines">
                {review.itemLines.map((line, index) => (
                  <div key={`${line.name}-${index}`} className="sd-order-review-line">
                    <div>
                      <strong>{line.name}</strong>
                      {line.subtotal && <span>{line.subtotal}</span>}
                    </div>
                    <em>x{line.qty}</em>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sd-order-review-totals">
            <div className="sd-order-review-totals-head">Order Summary</div>
            <div className="sd-order-review-total-row">
              <span>Food Total</span>
              <strong>{review.foodSubtotalLabel || 'LKR 0.00'}</strong>
            </div>
            {isDelivery && (
              <div className="sd-order-review-total-row">
                <span>Delivery Fee</span>
                <strong>{review.deliveryFeeLabel || 'Calculated at checkout'}</strong>
              </div>
            )}
            <div className="sd-order-review-total-row grand">
              <span>Total Amount</span>
              <strong>{review.totalAmountLabel || review.foodSubtotalLabel || 'LKR 0.00'}</strong>
            </div>
          </div>

          <div className="sd-order-review-details">
            <div>
              <span>Method</span>
              <strong>{isDelivery ? 'Delivery' : 'Takeaway'}</strong>
            </div>
            <div>
              <span>{isDelivery ? 'Delivery' : 'Pickup'}</span>
              <strong>{isDelivery ? review.deliveryAddress || 'Delivery address saved' : review.pickupDetails || 'Pickup from Cafe Lush'}</strong>
            </div>
            {review.phoneNumber && (
              <div>
                <span>Phone</span>
                <strong>{review.phoneNumber}</strong>
              </div>
            )}
          </div>

          {review.deliveryFeeNote && (
            <div className="sd-order-review-note">
              <Truck size={16} strokeWidth={2.2} />
              <span>{review.deliveryFeeNote}</span>
            </div>
          )}

          <div className="sd-order-review-note">
            <CheckCircle2 size={16} strokeWidth={2.2} />
            <span>
              {review.confirmationNote || `Press confirm to place this combined order with ${review.packageLines.length} package type${review.packageLines.length === 1 ? '' : 's'} and ${review.itemLines.length} cafe item${review.itemLines.length === 1 ? '' : 's'}.`}
            </span>
          </div>
        </div>

        <div className="sd-order-review-actions">
          <button type="button" className="sd-btn-secondary" onClick={onCancel} disabled={submitting}>
            Back
          </button>
          <button type="button" className="sd-btn-primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : <HandPlatter size={16} strokeWidth={2.2} />}
            Confirm Order
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Panel 1 - Meal Packages ───────────────────────────────────────────────────
function MealPackagesPanel({ mealTypes, loadingTypes, onPackageReady, weeklyPlan, refetchWeeklyPlan, onOpenMenu }) {
  const { data: menuPreviewItems = [], loading: loadingMenuPreview } = useApi(getStudentItems)
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()))
  const [selectedPackages, setSelectedPackages] = useState({})
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
  const firstSelectedPackage = Object.values(selectedPackages)[0]
  const activeType = firstSelectedPackage
    ? mealTypes.find((t) => Number(t.id) === Number(firstSelectedPackage.mealTypeId))
    : selectedType
  const cutoffDate = getCutoffDate(activeType?.name, selectedDate)
  const { timeLeft, isPast } = useCountdown(cutoffDate)

  const todayDate = new Date()
  const today = toInputDate(todayDate)
  const maxDate = toInputDate(addDays(todayDate, 3))
  const minDate = today
  const cardDate = selectedDate || today
  const cardDateObj = new Date(`${cardDate}T00:00:00`)
  const cardDayJs = Number.isNaN(cardDateObj.getTime()) ? new Date().getDay() : cardDateObj.getDay()
  const cardDayKey = cardDayJs === 0 ? 6 : cardDayJs - 1

  const selectedDateObj = new Date(`${selectedDate}T00:00:00`)
  const selectedDateLabel = Number.isNaN(selectedDateObj.getTime())
    ? 'selected date'
    : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const selectedPackageEntries = Object.values(selectedPackages)
  const selectedPackageCount = selectedPackageEntries.reduce((sum, item) => sum + item.quantity, 0)
  const selectedPackageTotal = selectedPackageEntries.reduce((sum, item) => sum + item.quantity * Number(item.price || 0), 0)
  const previewItems = buildPopularPreviewItems(menuPreviewItems)
  const dateOptions = Array.from({ length: 4 }, (_, index) => {
    const date = addDays(todayDate, index)
    const value = toInputDate(date)
    const label = index === 0
      ? 'Today'
      : index === 1
        ? 'Tomorrow'
        : date.toLocaleDateString('en-US', { weekday: 'short' })
    return {
      value,
      label,
      sub: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })

  useEffect(() => {
    setShowDelivery(false)
    setShowTakeaway(false)
    setShowPrompt(false)
    setPendingPayload(null)
  }, [selectedDate])

  useEffect(() => {
    setForm((prev) => {
      return {
        ...prev,
        order_date: selectedDate,
      }
    })
  }, [selectedDate])

  const getPlanPrice = (mealTime, mealCategory) => {
    const normalizedMeal = normalizeMealSlotName(mealTime)
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
    const mealTime = normalizeMealSlotName(mealTypeName)
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

  const getPackageOptionPrice = (mealTypeName, preference) => {
    const mealTime = normalizeMealSlotName(mealTypeName)
    const mealCategory = preference === 'non-veg' ? 'nonveg' : 'veg'
    return getPlanPrice(mealTime, mealCategory) || '200.00'
  }

  const getPackageSlot = (mealTypeName, preference) => {
    const normalizedMeal = normalizeMealSlotName(mealTypeName)
    const mealCategory = preference === 'non-veg' ? 'nonveg' : 'veg'
    const dayKey = normalizedMeal === 'lunch' && (cardDayKey === 5 || cardDayKey === 6)
      ? 5
      : cardDayKey
    return weeklyPlan?.[`${dayKey}_${normalizedMeal}_${mealCategory}`]
  }

  const getPackageSelectionKey = (mealTypeId, preference) => `${mealTypeId}_${preference}`

  const addPackageSelection = (mealType, preference) => {
    const key = getPackageSelectionKey(mealType.id, preference)
    const price = getPackageOptionPrice(mealType.name, preference)
    setSelectedPackages((prev) => {
      const current = prev[key]
      const nextQuantity = Math.min(MAX_PACKAGE_QUANTITY, (current?.quantity || 0) + 1)
      return {
        ...prev,
        [key]: {
          key,
          mealTypeId: mealType.id,
          mealTypeName: mealType.name,
          preference,
          quantity: nextQuantity,
          price,
        },
      }
    })
    setForm((prev) => ({
      ...prev,
      meal_type: String(mealType.id),
      preference,
      order_date: selectedDate,
    }))
    setError('')
  }

  const decreasePackageSelection = (entry) => {
    setSelectedPackages((prev) => {
      const next = { ...prev }
      if (!next[entry.key]) return prev
      if (next[entry.key].quantity <= 1) {
        delete next[entry.key]
        return next
      }
      next[entry.key] = { ...next[entry.key], quantity: next[entry.key].quantity - 1 }
      return next
    })
  }

  const clearSelectedPackages = () => {
    setSelectedPackages({})
    setError('')
  }

  const isPackageOptionClosed = (mealTypeName) => {
    const cutoff = getCutoffDate(mealTypeName, selectedDate)
    return Boolean(cutoff) && new Date() > cutoff
  }

  const handleOrder = async (e) => {
    e.preventDefault()
    if (selectedPackageEntries.length === 0) {
      setError('Please add at least one meal package first.')
      return
    }
    const closedPackage = selectedPackageEntries.find((entry) => isPackageOptionClosed(entry.mealTypeName))
    if (closedPackage) {
      setError(`${closedPackage.mealTypeName} ordering is closed for ${selectedDateLabel}.`)
      return
    }
    if (selectedDate < minDate || selectedDate > maxDate) {
      setError('Meal packages can only be ordered from today up to 3 days ahead.')
      return
    }
    if (form.delivery_type === 'delivery') {
      setShowDelivery(true)
      return
    }
    setShowTakeaway(true)
  }

  const buildPayloadAndPrompt = ({
    detailsText = '',
    phoneNumber = '',
    addressLine1 = '',
    addressLine2 = '',
    cityArea = '',
    locationSource = 'address',
    deliveryLatitude = null,
    deliveryLongitude = null,
  }) => {
    const payloads = selectedPackageEntries.map((entry) => ({
      meal_type: Number(entry.mealTypeId),
      order_date: selectedDate,
      delivery_type: form.delivery_type,
      quantity: entry.quantity,
      delivery_address: detailsText,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city_area: cityArea,
      location_source: locationSource,
      delivery_latitude: deliveryLatitude,
      delivery_longitude: deliveryLongitude,
      phone_number: phoneNumber,
      order_type: 'package',
      preference: entry.preference,
    }))
    const payload = payloads.length === 1 ? payloads[0] : payloads
    setPendingPayload(payload)
    setShowPrompt(true)
  }

  const handlePromptPlaceOnly = async () => {
    setShowPrompt(false)
    await onPackageReady(pendingPayload, false)
    setForm({ meal_type: '', preference: '', order_date: '', delivery_type: 'takeaway', quantity: 1 })
    setSelectedPackages({})
    setPendingPayload(null)
  }

  const handlePromptAddItems = async () => {
    const didQueueMenuItems = await onPackageReady(pendingPayload, true)
    if (!didQueueMenuItems) return
    setShowPrompt(false)
    setForm({ meal_type: '', preference: '', order_date: '', delivery_type: 'takeaway', quantity: 1 })
    setSelectedPackages({})
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
          <p className="sd-panel-subtitle">Choose a date, add today&apos;s packages, and checkout once.</p>
        </div>
        <button type="button" className="sd-btn-see-meal" onClick={handleOpenMealMenu} disabled={openingMealMenu} aria-label="View weekly meals">
          <UtensilsCrossed size={16} strokeWidth={2.2} />
          <span>{openingMealMenu ? 'Refreshing...' : 'Weekly Meals'}</span>
        </button>
      </div>

      <div className="sd-home-hero">
        <div>
          <p className="sd-home-kicker">Meals for {selectedDateLabel}</p>
          <h3 className="sd-home-title">Fresh packages ready to order</h3>
          <p className="sd-home-copy">Add breakfast, dinner, veg, or non-veg together. Pickup or delivery details come at checkout.</p>
        </div>
        <div className="sd-date-strip" aria-label="Choose menu date">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`sd-date-chip${selectedDate === option.value ? ' active' : ''}`}
              onClick={() => {
                setSelectedDate(option.value)
                setError('')
              }}
            >
              <span>{option.label}</span>
              <small>{option.sub}</small>
            </button>
          ))}
          <input
            className="sd-date-picker"
            type="date"
            min={today}
            max={maxDate}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setError('')
            }}
          />
        </div>
      </div>

      {!loadingTypes && (
        <div className="sd-pkg-grid">
          {mealTypes.map((t) => {
            const mealKey = t.name.toLowerCase()
            const isBreakfast = mealKey === 'breakfast'
            const media = MEAL_CARD_IMAGES[mealKey] || MEAL_CARD_IMAGES.breakfast
            const priceLabel = getCardPriceLabel(t.name)
            const defaultPreference = media.defaultPreference || 'veg'
            const defaultSlot = getPackageSlot(t.name, defaultPreference)
            const defaultDishes = Array.isArray(defaultSlot?.dishes) ? defaultSlot.dishes.slice(0, 4) : []
            const optionClosed = isPackageOptionClosed(t.name)
            return (
              <div key={t.id} className="sd-pkg-card sd-pkg-card-visual">
                <div className="sd-pkg-image-wrap">
                  <img src={media.image} alt={`${media.label} ${t.name}`} className="sd-pkg-hero-img" />
                  <span className="sd-pkg-image-badge">
                    {isBreakfast ? <Sun size={14} strokeWidth={2.2} /> : <MoonStar size={14} strokeWidth={2.2} />}
                    {media.label}
                  </span>
                  {optionClosed && <span className="sd-pkg-closed-badge">Closed</span>}
                </div>

                <div className="sd-pkg-content">
                  <div className="sd-pkg-card-top">
                    <div>
                      <p className="sd-pkg-name">{t.name} Package</p>
                      <p className="sd-pkg-rule">
                        {isBreakfast ? 'Order before 8:00 PM previous day' : 'Order before 12:00 PM same day'}
                      </p>
                    </div>
                    <span className="sd-pkg-footer-price">{priceLabel}</span>
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
                  </div>

                  {defaultDishes.length > 0 && (
                    <div className="sd-pkg-dishes">
                      {defaultDishes.map((dish) => (
                        <span key={dish}>{dish}</span>
                      ))}
                    </div>
                  )}

                  <div className="sd-pkg-actions">
                    {[
                      { preference: 'veg', label: 'Add Veg', icon: Vegan },
                      { preference: 'non-veg', label: 'Add Non-Veg', icon: ChefHat },
                    ].map(({ preference, label, icon }) => {
                      const Icon = icon
                      const key = getPackageSelectionKey(t.id, preference)
                      const qty = selectedPackages[key]?.quantity || 0
                      return (
                        <button
                          key={preference}
                          type="button"
                          className={`sd-pkg-add-btn ${preference === 'veg' ? 'veg' : 'nonveg'}${qty > 0 ? ' active' : ''}`}
                          disabled={optionClosed}
                          onClick={() => addPackageSelection(t, preference)}
                        >
                          <Icon size={14} strokeWidth={2.2} />
                          <span>{qty > 0 ? `${label} (${qty})` : label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <div className="sd-alert error">{error}</div>}

      <form onSubmit={handleOrder}>
        <div className="sd-package-summary">
          <div className="sd-package-summary-head">
            <div>
              <label className="sd-field-label">Your order for {selectedDateLabel}</label>
              <p className="sd-package-method-subtitle">
                {selectedPackageEntries.length === 0
                  ? 'Choose one meal slot for one date, then add veg or non-veg for that selected slot.'
                  : `${selectedPackageCount} package${selectedPackageCount === 1 ? '' : 's'} selected.`}
              </p>
            </div>
            {selectedPackageEntries.length > 0 && (
              <button type="button" className="sd-summary-clear" onClick={clearSelectedPackages}>
                Clear
              </button>
            )}
          </div>

          {selectedPackageEntries.length === 0 ? (
            <div className="sd-package-summary-empty">
              <ShoppingCart size={18} strokeWidth={2.2} />
              <span>No meal packages selected yet.</span>
            </div>
          ) : (
            <div className="sd-package-summary-list">
              {selectedPackageEntries.map((entry) => (
                <div key={entry.key} className="sd-package-summary-row">
                  <div>
                    <strong>{entry.preference === 'non-veg' ? 'Non-Veg' : 'Veg'} {entry.mealTypeName}</strong>
                    <span>LKR {Number(entry.price || 0).toFixed(2)} each</span>
                  </div>
                  <div className="sd-cart-qty-controls">
                    <button type="button" className="sd-cart-qty-btn" onClick={() => decreasePackageSelection(entry)}>
                      <Minus size={14} strokeWidth={2.4} />
                    </button>
                    <span className="sd-cart-qty-num">{entry.quantity}</span>
                    <button type="button" className="sd-cart-qty-btn" onClick={() => addPackageSelection({ id: entry.mealTypeId, name: entry.mealTypeName }, entry.preference)}>
                      <Plus size={14} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="sd-package-summary-total">
                <span>Total</span>
                <strong>LKR {selectedPackageTotal.toFixed(2)}</strong>
              </div>
            </div>
          )}
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

        <button type="submit" className="sd-btn-primary" disabled={selectedPackageEntries.length === 0}>
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
              {activeType?.name?.toLowerCase() === 'breakfast' ? (
                isPast ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Order window closed</span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Breakfast for <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> had to be ordered by{' '}
                      <strong>8:00 PM on {new Date(new Date(selectedDate + 'T00:00:00').setDate(new Date(selectedDate + 'T00:00:00').getDate() - 1)).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>.
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>
                      Order by <strong>8:00 PM on {new Date(new Date(selectedDate + 'T00:00:00').setDate(new Date(selectedDate + 'T00:00:00').getDate() - 1)).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
                    </span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Breakfast for <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> - order must be placed the evening before.
                    </span>
                  </>
                )
              ) : (
                isPast ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Order window closed</span>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '2px', fontWeight: 400 }}>
                      Dinner for <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> had to be ordered by <strong>12:00 PM on the same day</strong>.
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>
                      Order by <strong>12:00 PM on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
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
            const isBreakfast = activeType?.name?.toLowerCase() === 'breakfast'
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

      <section className="sd-menu-preview">
        <div className="sd-menu-preview-head">
          <div>
            <p className="sd-home-kicker">Menu for {selectedDateLabel}</p>
            <h3 className="sd-menu-preview-title">Popular cafe items</h3>
            <p className="sd-menu-preview-subtitle">
              A curated look at today&apos;s most-loved cafe picks, with bigger visuals and clearer pricing.
            </p>
          </div>
          <button type="button" className="sd-btn-see-meal" onClick={onOpenMenu}>
            <BookOpen size={16} strokeWidth={2.2} />
            View Full Menu
          </button>
        </div>

        {loadingMenuPreview ? (
          <div className="sd-menu-preview-loading">
            <Spinner size="sm" />
            <span>Loading menu items...</span>
          </div>
        ) : previewItems.length === 0 ? (
          <div className="sd-package-summary-empty">
            <UtensilsCrossed size={18} strokeWidth={2.2} />
            <span>No menu images available right now.</span>
          </div>
        ) : (
          <div className="sd-menu-preview-grid">
            {previewItems.map((item, index) => (
              <article
                key={item.id}
                className="sd-menu-preview-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpenMenu?.()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpenMenu?.()
                  }
                }}
              >
                <div className="sd-menu-preview-media">
                  <img src={item.image_url} alt={item.name} />
                  {index < 2 && (
                    <span className={`sd-menu-preview-badge ${index === 0 ? 'top' : 'chef'}`}>
                      {index === 0 ? 'Top Pick' : 'Chef Pick'}
                    </span>
                  )}
                </div>
                <div className="sd-menu-preview-card-body">
                  <strong>{item.name}</strong>
                  <div className="sd-menu-preview-card-meta">
                    <span>Rs. {Number(item.price).toFixed(2)}</span>
                    <button
                      type="button"
                      className="sd-menu-preview-link"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenMenu?.()
                      }}
                    >
                      View details in full menu
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showMealMenu && weeklyPlan && (
        <TodayMealModal plan={weeklyPlan} onClose={() => setShowMealMenu(false)} />
      )}

      {showDelivery && (
        <DeliveryModal
          title="Delivery Address"
          subtitle="Tell us where to deliver this meal package."
          confirmLabel="Confirm Details"
          showQuantity={false}
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
          showQuantity={false}
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
          deliveryType={normalizePackagePayloads(pendingPayload)[0]?.delivery_type}
          canAddItems={isMenuItemOrderOpen()}
          onAddItems={handlePromptAddItems}
          onPlaceOnly={handlePromptPlaceOnly}
          onCancel={handlePromptCancel}
        />
      )}
    </div>
  )
}

function MealPackagesViewerPanel({
  mealTypes,
  loadingTypes,
  onPackageReady,
  weeklyPlan,
  onOpenMenu,
  onContinuePendingOrder,
  hasPendingPackageOrder = false,
  pendingPackageOrder = null,
  sharedMenuCart = {},
  onSharedMenuCartChange = null,
  onPendingPackageOrderChange = null,
  onSharedCartSnapshotChange = null,
  sharedCartActionRef = null,
  initialSelectedDate = '',
  initialPackageCart = {},
  draftSyncToken = 0,
  onDraftStateChange = null,
}) {
  const { data: menuPreviewItems = [], loading: loadingMenuPreview } = useApi(getStudentItems)
  const [selectedDate, setSelectedDate] = useState(() => initialSelectedDate || toInputDate(new Date()))
  const [activeCategoryKey, setActiveCategoryKey] = useState(null)
  const [focusedMealTime, setFocusedMealTime] = useState('')
  const [selectedMealTime, setSelectedMealTime] = useState('')
  const [wizardStep, setWizardStep] = useState(1)
  const [packageCart, setPackageCart] = useState(() => initialPackageCart || {})
  const [cartError, setCartError] = useState('')
  const [pendingRemovePackage, setPendingRemovePackage] = useState(null)
  const [pendingRemoveMenuItem, setPendingRemoveMenuItem] = useState(null)
  const [showClearPackageCartConfirm, setShowClearPackageCartConfirm] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestedCategoryKey, setSuggestedCategoryKey] = useState('')
  const [showOrderMethod, setShowOrderMethod] = useState(false)
  const [deliveryType, setDeliveryType] = useState('takeaway')
  const [showDelivery, setShowDelivery] = useState(false)
  const [showTakeaway, setShowTakeaway] = useState(false)

  const todayDate = new Date()
  const setSharedMenuCart = onSharedMenuCartChange || (() => {})
  const today = toInputDate(todayDate)
  const maxDate = toInputDate(addDays(todayDate, 3))
  const cardDate = selectedDate || today
  const cardDateObj = new Date(`${cardDate}T00:00:00`)
  const cardDayJs = Number.isNaN(cardDateObj.getTime()) ? new Date().getDay() : cardDateObj.getDay()
  const cardDayKey = cardDayJs === 0 ? 6 : cardDayJs - 1
  const isWeekend = cardDayKey === 5 || cardDayKey === 6

  useEffect(() => {
    setSelectedDate(initialSelectedDate || today)
    setPackageCart(initialPackageCart || {})
  }, [draftSyncToken, initialSelectedDate, initialPackageCart, today])

  useEffect(() => {
    onDraftStateChange?.({
      selectedDate,
      packageCart,
    })
  }, [selectedDate, packageCart, onDraftStateChange])

  const selectedDateObj = new Date(`${selectedDate}T00:00:00`)
  const selectedDateLabel = Number.isNaN(selectedDateObj.getTime())
    ? 'selected date'
    : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const previewItems = buildPopularPreviewItems(menuPreviewItems)
  const pendingSummary = useMemo(() => {
    const queuedPackageOrders = normalizePackagePayloads(pendingPackageOrder)
    const packageEntries = getPendingPackageEntries(queuedPackageOrders, mealTypes, weeklyPlan)
    const packageTotal = packageEntries.reduce((sum, line) => sum + (Number(line.priceValue) || 0) * (Number(line.qty) || 0), 0)
    const menuEntries = Object.values(sharedMenuCart).filter((entry) => (entry?.qty || 0) > 0)
    const menuTotal = menuEntries.reduce((sum, entry) => sum + Number(entry.item?.price || 0) * Number(entry.qty || 0), 0)

    return {
      packageEntries,
      packageTotal,
      menuEntries,
      menuTotal,
    }
  }, [pendingPackageOrder, mealTypes, weeklyPlan, sharedMenuCart])
  const dateOptions = Array.from({ length: 4 }, (_, index) => {
    const date = addDays(todayDate, index)
    const value = toInputDate(date)
    const label = index === 0
      ? 'Today'
      : index === 1
        ? 'Tomorrow'
        : date.toLocaleDateString('en-US', { weekday: 'short' })
    return {
      value,
      label,
      sub: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })

  const getDateContext = (dateValue) => {
    const dateObj = new Date(`${dateValue}T00:00:00`)
    const dayJs = Number.isNaN(dateObj.getTime()) ? new Date().getDay() : dateObj.getDay()
    const dayKey = dayJs === 0 ? 6 : dayJs - 1
    const weekend = dayKey === 5 || dayKey === 6
    const dateLabel = Number.isNaN(dateObj.getTime())
      ? 'selected date'
      : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    return {
      dayKey,
      isWeekend: weekend,
      dateLabel,
    }
  }

  const getPlanPriceForDate = (mealTime, mealCategory, dateValue) => {
    const normalizedMeal = mealTime?.toLowerCase()
    if (!normalizedMeal) return null
    const { dayKey, isWeekend: weekend } = getDateContext(dateValue)
    const effectiveDayKey = normalizedMeal === 'lunch' && weekend ? 5 : dayKey
    const slot = weeklyPlan?.[`${effectiveDayKey}_${normalizedMeal}_${mealCategory}`]
    if (slot?.price === null || slot?.price === undefined || slot?.price === '') return null
    const priceNum = Number(slot.price)
    return Number.isFinite(priceNum) ? priceNum.toFixed(2) : null
  }

  const getPlanPrice = (mealTime, mealCategory) => getPlanPriceForDate(mealTime, mealCategory, selectedDate)

  const getPlanSlotForDate = (mealTime, mealCategory, dateValue) => {
    const normalizedMeal = mealTime?.toLowerCase()
    if (!normalizedMeal) return null
    const { dayKey, isWeekend: weekend } = getDateContext(dateValue)
    const effectiveDayKey = normalizedMeal === 'lunch' && weekend ? 5 : dayKey
    return weeklyPlan?.[`${effectiveDayKey}_${normalizedMeal}_${mealCategory}`] || null
  }

  const getPlanSlot = (mealTime, mealCategory) => getPlanSlotForDate(mealTime, mealCategory, selectedDate)

  const buildPackageEntryForDate = (mealTime, mealCategory, dateValue) => {
    const slot = getPlanSlotForDate(mealTime, mealCategory, dateValue)
    if (!slot) return null

    const { dateLabel } = getDateContext(dateValue)
    const normalizedMeal = normalizeMealSlotName(mealTime)
    const slotKey = `${dateValue}_${mealTime}_${mealCategory}`
    const matchingMealType = mealTypes.find((type) => normalizeMealSlotName(type?.name) === normalizedMeal)
    const slotMeta = SLOT_META[slotKey] || {
      icon: UtensilsCrossed,
      color: T.coffeeMid,
      bg: 'rgba(196,149,106,0.08)',
      border: 'rgba(196,149,106,0.2)',
    }
    const timing = getPackageTimingDetails(mealTime)
    const price = getPlanPriceForDate(mealTime, mealCategory, dateValue)
    const cutoff = matchingMealType ? getCutoffDate(matchingMealType.name, dateValue) : null
    const closed = Boolean(cutoff) && new Date() > cutoff
    const preference = mealCategory === 'nonveg' ? 'non-veg' : 'veg'

    return {
      key: slotKey,
      mealTime,
      orderDate: dateValue,
      dateLabel,
      mealTypeId: matchingMealType?.id || null,
      mealTypeName: matchingMealType?.name || timing.title,
      categoryKey: mealCategory,
      preference,
      canOrder: Boolean(matchingMealType?.id),
      closed,
      title: timing.title,
      orderText: timing.orderText,
      readyText: timing.readyText,
      priceLabel: price ? `LKR ${price}` : 'LKR price updating...',
      priceValue: Number(price || 0),
      dishes: Array.isArray(slot?.dishes) ? slot.dishes : [],
      icon: slotMeta.icon,
      color: slotMeta.color,
      background: slotMeta.bg,
      border: slotMeta.border,
    }
  }

  const buildPackageEntry = (mealTime, mealCategory) => buildPackageEntryForDate(mealTime, mealCategory, selectedDate)

  const categoryCards = ['veg', 'nonveg'].map((categoryKey) => {
    const meta = PACKAGE_CATEGORY_META[categoryKey]
    const mealTimes = categoryKey === 'nonveg' && isWeekend
      ? ['breakfast', 'dinner', 'lunch']
      : ['breakfast', 'dinner']
    const packages = mealTimes
      .map((mealTime) => buildPackageEntry(mealTime, categoryKey))
      .filter(Boolean)
    const breakfastPackage = packages.find((pkg) => pkg.mealTime === 'breakfast') || null
    const lunchPackage = packages.find((pkg) => pkg.mealTime === 'lunch') || null
    const dinnerPackage = packages.find((pkg) => pkg.mealTime === 'dinner') || null

    return {
      ...meta,
      key: categoryKey,
      packages,
      summaryTitles: packages.map((pkg) => pkg.title),
      breakfastPackage,
      lunchPackage,
      dinnerPackage,
      dateLabel: selectedDateLabel,
    }
  })

  const categoryLookup = categoryCards.reduce((acc, category) => {
    acc[category.key] = category
    return acc
  }, {})

  const getInitialCategoryMealTime = (category) => {
    if (!category?.packages?.length) return ''
    const firstActivePackage = category.packages.find((pkg) => pkg.canOrder && !pkg.closed)
    return firstActivePackage?.mealTime || category.packages[0]?.mealTime || ''
  }

  const findFirstActiveCategorySelection = (categoryKey) => {
    const orderedDates = [selectedDate, ...dateOptions.map((option) => option.value).filter((value) => value !== selectedDate)]

    for (const dateValue of orderedDates) {
      const { isWeekend: weekend } = getDateContext(dateValue)
      const mealTimes = categoryKey === 'nonveg' && weekend
        ? ['breakfast', 'dinner', 'lunch']
        : ['breakfast', 'dinner']
      const packages = mealTimes
        .map((mealTime) => buildPackageEntryForDate(mealTime, categoryKey, dateValue))
        .filter(Boolean)
      const firstActivePackage = packages.find((pkg) => pkg.canOrder && !pkg.closed)
      if (firstActivePackage) {
        return {
          dateValue,
          mealTime: firstActivePackage.mealTime,
        }
      }
    }

    return {
      dateValue: selectedDate,
      mealTime: getInitialCategoryMealTime(categoryLookup[categoryKey]),
    }
  }

  const cartEntries = Object.values(packageCart)
  const cartCount = cartEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  const cartTotal = cartEntries.reduce((sum, entry) => sum + (Number(entry.priceValue) || 0) * entry.quantity, 0)
  const lockedPackageEntry = cartEntries[0] || null
  const lockedMealTime = lockedPackageEntry?.mealTime || ''
  const lockedDate = lockedPackageEntry?.orderDate || ''
  const lockedDateLabel = lockedPackageEntry?.dateLabel || ''
  const lockedMealTitle = lockedPackageEntry?.title || 'Selected package'
  const lockedReadyTime = getPackageReadyTime(lockedPackageEntry?.mealTypeName || lockedPackageEntry?.mealTime)
  const summaryPackageEntries = cartEntries.length > 0 ? cartEntries : pendingSummary.packageEntries
  const summaryPackageTotal = cartEntries.length > 0 ? cartTotal : pendingSummary.packageTotal
  const summaryMenuEntries = pendingSummary.menuEntries
  const summaryTotal = summaryPackageTotal + pendingSummary.menuTotal
  const hasSummaryItems = summaryPackageEntries.length > 0 || summaryMenuEntries.length > 0

  useEffect(() => {
    if (lockedPackageEntry?.mealTime) {
      setSelectedMealTime(normalizeMealSlotName(lockedPackageEntry.mealTime))
      setWizardStep(3)
    }
  }, [lockedPackageEntry?.mealTime])

  const openPackageCategory = (categoryKey, mealTime = '', dateValue = selectedDate) => {
    setSelectedDate(dateValue || selectedDate)
    setSelectedMealTime(normalizeMealSlotName(mealTime))
    setWizardStep(3)
    setFocusedMealTime(mealTime || '')
    setActiveCategoryKey(categoryKey)
  }

  const addPackageToCart = (pkg) => {
    if (!pkg?.canOrder || pkg?.closed) return
    if (lockedPackageEntry) {
      const sameDate = pkg.orderDate === lockedDate
      const sameMealSlot = normalizeMealSlotName(pkg.mealTime) === normalizeMealSlotName(lockedMealTime)
      if (!sameDate || !sameMealSlot) {
        setCartError(`${lockedMealTitle} is already selected for ${lockedDateLabel}. Clear the cart to switch to another meal slot or date.`)
        return
      }
    }
    setPackageCart((prev) => {
      const current = prev[pkg.key]
      const nextQuantity = Math.min(MAX_PACKAGE_QUANTITY, (current?.quantity || 0) + 1)
      return {
        ...prev,
        [pkg.key]: {
          ...pkg,
          label: `${pkg.preference === 'non-veg' ? 'Non-Veg' : 'Veg'} ${pkg.title}`,
          dateLabel: pkg.dateLabel,
          orderDate: pkg.orderDate,
          quantity: nextQuantity,
        },
      }
    })
    setCartError('')
  }

  const handleSelectedDateChange = (nextDate) => {
    if (lockedPackageEntry && nextDate !== lockedDate) {
      setCartError(`${lockedMealTitle} is already selected for ${lockedDateLabel}. Clear the cart to switch to another date.`)
      return
    }
    setSelectedDate(nextDate)
    if (!lockedPackageEntry) {
      setSelectedMealTime('')
      setWizardStep(2)
    }
    setCartError('')
  }

  const getPackageCartLabel = (pkg) => {
    const dateText = pkg?.dateLabel ? ` for ${pkg.dateLabel}` : ''
    if (pkg?.label) return `${pkg.label}${dateText}`
    if (pkg?.preference && pkg?.title) {
      return `${pkg.preference === 'non-veg' ? 'Non-Veg' : 'Veg'} ${pkg.title}${dateText}`
    }
    return `${pkg?.title || 'this package'}${dateText}`
  }

  const decreasePackageInCart = (pkg) => {
    const key = typeof pkg === 'string' ? pkg : pkg?.key
    if (!key) return

    const currentEntry = packageCart[key]
    if (currentEntry?.quantity === 1) {
      setPendingRemovePackage({
        key,
        name: getPackageCartLabel(currentEntry),
      })
      return
    }

    setPackageCart((prev) => {
      const next = { ...prev }
      if (!next[key]) return prev
      if (next[key].quantity <= 1) {
        delete next[key]
        return next
      }
      next[key] = { ...next[key], quantity: next[key].quantity - 1 }
      return next
    })
  }

  const removePackageFromCart = (key) => {
    setPackageCart((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const requestRemovePackageFromCart = (pkg) => {
    const key = typeof pkg === 'string' ? pkg : pkg?.key
    if (!key) return
    const currentEntry = typeof pkg === 'string' ? packageCart[key] : pkg
    setPendingRemovePackage({
      key,
      name: getPackageCartLabel(currentEntry),
    })
  }

  const confirmRemovePackageFromCart = () => {
    if (!pendingRemovePackage?.key) return
    removePackageFromCart(pendingRemovePackage.key)
    setPendingRemovePackage(null)
  }

  const requestRemoveMenuItemFromSummary = (item) => {
    if (!item?.id) return
    setPendingRemoveMenuItem(item)
  }

  const increaseMenuItemInSummary = (item) => {
    if (!item?.id) return
    setSharedMenuCart((prev) => ({
      ...prev,
      [item.id]: {
        item,
        qty: (prev?.[item.id]?.qty ?? 0) + 1,
      },
    }))
  }

  const decreaseMenuItemInSummary = (item) => {
    if (!item?.id) return
    const currentQty = Number(sharedMenuCart?.[item.id]?.qty || 0)
    if (currentQty <= 1) {
      setPendingRemoveMenuItem(item)
      return
    }

    setSharedMenuCart((prev) => ({
      ...prev,
      [item.id]: {
        item,
        qty: Math.max(0, Number(prev?.[item.id]?.qty || 0) - 1),
      },
    }))
  }

  const confirmRemoveMenuItemFromSummary = () => {
    if (!pendingRemoveMenuItem?.id) return
    setSharedMenuCart((prev) => {
      const next = { ...prev }
      delete next[pendingRemoveMenuItem.id]
      return next
    })
    setPendingRemoveMenuItem(null)
  }

  const clearPackageCart = () => {
    setPackageCart({})
    setSharedMenuCart({})
    onPendingPackageOrderChange?.(null)
    setCartError('')
    setShowClearPackageCartConfirm(false)
    setPendingRemoveMenuItem(null)
    setSelectedMealTime('')
    setWizardStep(1)
  }

  const buildPackageCheckoutPayloads = ({
    detailsText = '',
    phoneNumber = '',
    addressLine1 = '',
    addressLine2 = '',
    cityArea = '',
    locationSource = 'address',
    deliveryLatitude = null,
    deliveryLongitude = null,
  }) => {
    const payloads = cartEntries
      .filter((entry) => entry.mealTypeId)
      .map((entry) => ({
        meal_type: Number(entry.mealTypeId),
        order_date: entry.orderDate || selectedDate,
        delivery_type: deliveryType,
        quantity: entry.quantity,
        delivery_address: detailsText,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city_area: cityArea,
        location_source: locationSource,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        phone_number: phoneNumber,
        order_type: 'package',
        preference: entry.preference,
      }))

    if (payloads.length === 0) {
      setCartError('Add at least one breakfast, lunch, or dinner package to continue.')
      return
    }

    return payloads
  }

  const resetPackageCheckout = () => {
    setPackageCart({})
    setShowDelivery(false)
    setShowTakeaway(false)
    setShowOrderMethod(false)
    setShowSuggestion(false)
    setSuggestedCategoryKey('')
    setCartError('')
    setPendingRemovePackage(null)
    setShowClearPackageCartConfirm(false)
    setActiveCategoryKey(null)
    setFocusedMealTime('')
    setSelectedMealTime('')
    setWizardStep(1)
  }

  const queuePackageCheckout = async (details = {}) => {
    const payloads = buildPackageCheckoutPayloads(details)
    if (!payloads || payloads.length === 0) return
    const didQueueCheckout = await onPackageReady(payloads, true)
    if (!didQueueCheckout) return
    resetPackageCheckout()
    onContinuePendingOrder?.({ waitForPendingPackage: true })
  }

  const handleContinueFromCart = () => {
    if (cartEntries.length === 0) {
      if (summaryMenuEntries.length > 0) {
        onContinuePendingOrder?.({ waitForPendingPackage: pendingSummary.packageEntries.length > 0 })
        return
      }
      if (pendingSummary.packageEntries.length > 0) {
        onContinuePendingOrder?.({ waitForPendingPackage: true })
        return
      }
      setCartError('Add at least one menu item or meal package to continue.')
      return
    }

    setShowOrderMethod(true)
  }

  const sharedCartSnapshot = useMemo(() => ({
    selectedDateLabel,
    summaryPackageEntries,
    summaryMenuEntries,
    summaryTotal,
    cartError,
    hasSummaryItems,
  }), [selectedDateLabel, summaryPackageEntries, summaryMenuEntries, summaryTotal, cartError, hasSummaryItems])

  useEffect(() => {
    onSharedCartSnapshotChange?.(sharedCartSnapshot)
  }, [onSharedCartSnapshotChange, sharedCartSnapshot])

  useEffect(() => {
    if (!sharedCartActionRef) return
    sharedCartActionRef.current = {
      onIncreasePackage: addPackageToCart,
      onDecreasePackage: decreasePackageInCart,
      onRemovePackage: requestRemovePackageFromCart,
      onIncreaseMenuItem: increaseMenuItemInSummary,
      onDecreaseMenuItem: decreaseMenuItemInSummary,
      onRemoveMenuItem: requestRemoveMenuItemFromSummary,
      requestClearSharedCart: () => setShowClearPackageCartConfirm(true),
      onCheckout: handleContinueFromCart,
    }
  }, [
    sharedCartActionRef,
    addPackageToCart,
    decreasePackageInCart,
    requestRemovePackageFromCart,
    increaseMenuItemInSummary,
    decreaseMenuItemInSummary,
    requestRemoveMenuItemFromSummary,
    handleContinueFromCart,
  ])

  const activeCategory = activeCategoryKey ? categoryLookup[activeCategoryKey] || null : null

  const activeCategoryWithCart = activeCategory
    ? {
        ...activeCategory,
        packages: activeCategory.packages.map((pkg) => ({
          ...pkg,
          selectionBlocked: Boolean(lockedPackageEntry)
            && (
              pkg.orderDate !== lockedDate
              || normalizeMealSlotName(pkg.mealTime) !== normalizeMealSlotName(lockedMealTime)
            ),
          selectionBlockedReason: lockedPackageEntry
            ? `${lockedMealTitle} is already selected for ${lockedDateLabel}. Clear the cart to switch to ${pkg.title.toLowerCase()}.`
            : '',
          cartQuantity: packageCart[pkg.key]?.quantity || 0,
        })),
      }
    : null

  const packageSelectionHint = lockedPackageEntry
    ? `${lockedMealTitle} is selected for ${lockedDateLabel}. You can keep adding veg or non-veg only for this meal slot. Ready time: ${lockedReadyTime || 'scheduled meal time'}.`
    : 'Choose one meal slot for the selected date. After you select Breakfast, Lunch, or Dinner, the other meal slots become unavailable for this checkout. You can still add veg or non-veg within the selected slot.'

  const packageOrderMethodOptions = lockedPackageEntry ? [
    {
      value: 'takeaway',
      label: 'Takeaway',
      sub: `Pickup at ${lockedReadyTime || 'the scheduled meal time'}`,
      icon: Package2,
    },
    {
      value: 'delivery',
      label: 'Delivery',
      sub: `Deliver at ${lockedReadyTime || 'the scheduled meal time'}`,
      icon: Truck,
    },
  ] : null

  const packageTakeawaySubtitle = lockedPackageEntry
    ? `This ${lockedMealTitle.toLowerCase()} will be ready at ${lockedReadyTime || 'the scheduled meal time'}. Add a phone number and optional pickup note below.`
    : 'Add your contact details before placing this meal package order.'
  const packageDeliverySubtitle = lockedPackageEntry
    ? `This ${lockedMealTitle.toLowerCase()} will be delivered at ${lockedReadyTime || 'the scheduled meal time'}. Enter your address and phone number below.`
    : 'Tell us where to deliver this meal package order.'

  const packageCardKeys = isWeekend
    ? ['breakfast_veg', 'breakfast_nonveg', 'lunch_nonveg', 'dinner_veg', 'dinner_nonveg']
    : ['breakfast_veg', 'breakfast_nonveg', 'dinner_veg', 'dinner_nonveg']

  const packageCards = packageCardKeys.map((slotKey) => {
    const [mealTime, rawCategory] = slotKey.split('_')
    const categoryKey = rawCategory === 'nonveg' ? 'nonveg' : 'veg'
    const pkg = buildPackageEntryForDate(mealTime, categoryKey, selectedDate)
    const mealMeta = PACKAGE_MEAL_META[mealTime]
    const categoryMeta = PACKAGE_CATEGORY_META[categoryKey]
    const timing = getPackageTimingDetails(mealTime)
    const fallbackMealType = mealTypes.find((type) => normalizeMealSlotName(type?.name) === mealTime)
    const cutoff = getCutoffDate(pkg?.mealTypeName || fallbackMealType?.name || mealTime, selectedDate)
    const msToCutoff = cutoff ? cutoff.getTime() - Date.now() : null
    const quantity = pkg?.key ? packageCart[pkg.key]?.quantity || 0 : 0
    const lockedToOtherMeal = Boolean(lockedPackageEntry)
      && (selectedDate !== lockedDate || normalizeMealSlotName(lockedMealTime) !== mealTime)
    const isWeekendLunchSpecial = mealTime === 'lunch' && categoryKey === 'nonveg'
    const displayMealTitle = isWeekendLunchSpecial ? timing.title : (mealMeta?.label || timing.title)
    const imageSrc = isWeekendLunchSpecial
      ? MEAL_CARD_IMAGES.lunch?.image || categoryMeta?.image || ''
      : categoryMeta?.image || MEAL_CARD_IMAGES[mealTime]?.image || ''

    let statusTone = 'available'
    let statusLabel = 'Available'
    let helperText = mealTime === 'breakfast'
      ? 'Breakfast ordering closes at 8:00 PM on the previous day.'
      : mealTime === 'lunch'
        ? 'Lunch ordering closes at 8:00 AM on the same day.'
        : 'Dinner ordering closes at 12:00 PM on the same day.'

    if (!pkg?.canOrder) {
      statusTone = 'muted'
      statusLabel = 'Unavailable'
      helperText = 'This package is not configured for the selected day yet.'
    } else if (pkg?.closed) {
      statusTone = 'closed'
      statusLabel = 'Closed'
      helperText = mealTime === 'breakfast'
        ? 'Breakfast ordering closed for this date.'
        : mealTime === 'lunch'
          ? 'Lunch ordering closed for this date.'
        : 'Dinner ordering closed for this date.'
    } else if (lockedToOtherMeal) {
      statusTone = 'locked'
      statusLabel = 'Locked'
      helperText = `${lockedMealTitle} is already selected for ${lockedDateLabel}. Clear the cart to switch to another meal slot or date.`
    } else if (msToCutoff != null && msToCutoff <= 3 * 60 * 60 * 1000) {
      statusTone = 'soon'
      statusLabel = 'Closing Soon'
      helperText = mealTime === 'breakfast'
        ? 'Breakfast ordering closes at 8:00 PM on the previous day.'
        : mealTime === 'lunch'
          ? 'Lunch ordering closes at 8:00 AM on the same day.'
        : 'Dinner ordering closes at 12:00 PM on the same day.'
    }

    return {
      key: slotKey,
      mealTime,
      pkg,
      title: `${displayMealTitle} ${categoryKey === 'veg' ? 'Veg' : 'Non-Veg'}`,
      imageSrc,
      imageAlt: `${displayMealTitle} ${categoryKey} package`,
      mealLabel: isWeekendLunchSpecial ? 'Lunch' : (mealMeta?.label || timing.title),
      categoryLabel: isWeekendLunchSpecial ? 'Weekend Special' : (categoryKey === 'veg' ? 'Veg Package' : 'Non-Veg Package'),
      priceLabel: pkg?.priceLabel || 'LKR price updating...',
      orderText: pkg?.orderText || timing.orderText,
      readyText: pkg?.readyText || timing.readyText,
      statusTone,
      statusLabel,
      helperText,
      dishes: Array.isArray(pkg?.dishes) ? pkg.dishes.slice(0, 4) : [],
      quantity,
      disabled: lockedToOtherMeal || !pkg?.canOrder || pkg?.closed,
    }
  })

  const packageMealSections = ['breakfast', 'lunch', 'dinner']
    .map((mealTime) => {
      const cards = packageCards.filter((card) => card.mealTime === mealTime)
      if (!cards.length) return null

      const mealMeta = PACKAGE_MEAL_META[mealTime]
      const timing = getPackageTimingDetails(mealTime)

      return {
        mealTime,
        title: mealMeta?.label || timing.title,
        orderText: timing.orderText,
        readyText: timing.readyText,
        cards,
      }
    })
    .filter(Boolean)

  return (
    <div id={ORDER_SECTION_IDS.all} className="sd-panel sd-order-stage-card sd-scroll-anchor">
      <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 className="sd-panel-title">Meal Ordering</h2>
        </div>
        {hasPendingPackageOrder && <span className="sd-order-placeholder-badge">Extras unlocked</span>}
      </div>

      <div className="sd-ordering-main">
          <section className="sd-order-stage">
            <div className="sd-order-stage-head">
              <div>
                <h3 className="sd-home-title">Select Meal Day</h3>
                <p className="sd-home-copy">Choose the date first. Availability, pricing, and package details update automatically below.</p>
              </div>
              <div className="sd-order-date-badge">{selectedDateLabel}</div>
            </div>

            <div className="sd-order-date-panel">
              <div className="sd-date-strip compact" aria-label="Select meal day">
                {dateOptions.map((option) => {
                  const isLockedOut = Boolean(lockedPackageEntry) && option.value !== lockedDate
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`sd-date-chip${selectedDate === option.value ? ' active' : ''}${isLockedOut ? ' disabled' : ''}`}
                      onClick={() => handleSelectedDateChange(option.value)}
                      disabled={isLockedOut}
                    >
                      <span>{option.label}</span>
                      <small>{option.sub}</small>
                    </button>
                  )
                })}
              </div>

              <div className="sd-order-date-picker-shell">
                <div className="sd-order-date-picker-copy">
                  <span className="sd-order-date-picker-label">Pick another day</span>
                  <strong>{selectedDateLabel}</strong>
                  <small>Use the calendar to choose any available date in this order window.</small>
                </div>
                <label className="sd-order-date-picker-control">
                  <CalendarDays size={16} strokeWidth={2.2} />
                  <input
                    type="date"
                    className="sd-date-picker sd-order-date-picker-input"
                    value={selectedDate}
                    min={today}
                    max={maxDate}
                    onChange={(e) => handleSelectedDateChange(e.target.value)}
                    disabled={Boolean(lockedPackageEntry)}
                  />
                </label>
              </div>

              <div className={`sd-package-lock-note${lockedPackageEntry ? '' : ' soft'}`}>
                {lockedPackageEntry
                  ? `${lockedMealTitle} is selected for ${lockedDateLabel}. Keep adding within that meal slot, or clear the cart to switch.`
                  : 'One meal slot remains active per checkout, while Veg and Non-Veg stay available inside that selected slot.'}
              </div>
            </div>
          </section>

          <section id={ORDER_SECTION_IDS.mealPackages} className="sd-order-stage sd-scroll-anchor">
            <div className="sd-order-stage-head">
              <div>
                <h3 className="sd-home-title">Choose Your Meal Package</h3>
              </div>
            </div>

            {loadingTypes ? (
              <div className="sd-package-summary-empty">
                <Spinner size="sm" />
                <span>Loading meal packages...</span>
              </div>
            ) : (
              <div className="sd-order-package-groups">
                {packageMealSections.map((section) => (
                  <div key={section.mealTime} className="sd-order-package-group">
                    <div className="sd-order-package-group-head">
                      <div>
                        <h4 className="sd-order-package-group-title">{section.title}</h4>
                        <p className="sd-order-package-group-copy">
                          {section.orderText}
                          {' • '}
                          {section.readyText}
                        </p>
                      </div>
                    </div>

                    <div className={`sd-order-package-grid${section.cards.length === 1 ? ' single' : ''}`}>
                      {section.cards.map((card) => (
                        <article key={card.key} className={`sd-order-package-card status-${card.statusTone}${card.quantity > 0 ? ' in-cart' : ''}`}>
                          <div className="sd-order-package-media">
                            {card.imageSrc ? (
                              <img src={card.imageSrc} alt={card.imageAlt} className="sd-order-package-image" />
                            ) : (
                              <div className="sd-order-package-image-placeholder">
                                <UtensilsCrossed size={28} strokeWidth={2.2} />
                              </div>
                            )}
                            <span className={`sd-order-status-badge ${card.statusTone}`}>{card.statusLabel}</span>
                            <div className="sd-order-package-badges">
                              <span className="sd-order-pill">{card.mealLabel}</span>
                              <span className="sd-order-pill subtle">{card.categoryLabel}</span>
                            </div>
                          </div>

                          <div className="sd-order-package-body">
                            <div className="sd-order-package-copy">
                              <h4>{card.title}</h4>
                            </div>

                            <div className="sd-order-package-meta">
                              <span>
                                <Clock3 size={14} strokeWidth={2.2} />
                                {card.orderText}
                              </span>
                              <span>
                                <Package2 size={14} strokeWidth={2.2} />
                                {card.readyText}
                              </span>
                            </div>

                            <div className="sd-order-package-includes">
                              <strong>Included meal details</strong>
                              <div className="sd-order-package-dish-list">
                                {card.dishes.length > 0 ? card.dishes.map((dish) => (
                                  <span key={dish} className="sd-order-package-dish">{dish}</span>
                                )) : (
                                  <span className="sd-order-package-dish muted">Meal details will appear here for this selected day.</span>
                                )}
                              </div>
                            </div>

                            <div className="sd-order-package-footer">
                              <div className="sd-order-package-price">
                                <span>Price</span>
                                <strong>{card.priceLabel}</strong>
                              </div>
                              <button
                                type="button"
                                className="sd-order-package-action"
                                disabled={card.disabled}
                                onClick={() => card.pkg && addPackageToCart(card.pkg)}
                              >
                                {card.disabled
                                  ? card.statusLabel
                                  : card.quantity > 0
                                    ? `Add Another (${card.quantity})`
                                    : 'Add to Cart'}
                              </button>
                            </div>

                            <p className={`sd-order-package-helper tone-${card.statusTone}`}>{card.helperText}</p>

                            {card.quantity > 0 && card.pkg && (
                              <div className="sd-order-package-qty-row">
                                <span>In cart</span>
                                <div className="sd-cart-qty-controls">
                                  <button type="button" className="sd-cart-qty-btn" onClick={() => decreasePackageInCart(card.pkg)}>
                                    <Minus size={14} strokeWidth={2.4} />
                                  </button>
                                  <span className="sd-cart-qty-num">{card.quantity}</span>
                                  <button type="button" className="sd-cart-qty-btn" onClick={() => addPackageToCart(card.pkg)}>
                                    <Plus size={14} strokeWidth={2.4} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </section>

        </div>

      {pendingRemovePackage && (
        <ConfirmDialog
          title="Remove package?"
          message={`Do you want to remove ${pendingRemovePackage.name} from your cart?`}
          confirmLabel="Yes, Remove"
          cancelLabel="No, Keep"
          onConfirm={confirmRemovePackageFromCart}
          onCancel={() => setPendingRemovePackage(null)}
        />
      )}

      {showClearPackageCartConfirm && (
        <ConfirmDialog
          title="Clear cart?"
          message="Are you sure you want to remove all items from your shared cart?"
          confirmLabel="Yes, Clear"
          cancelLabel="No, Keep"
          onConfirm={clearPackageCart}
          onCancel={() => setShowClearPackageCartConfirm(false)}
        />
      )}

      {pendingRemoveMenuItem && (
        <ConfirmDialog
          title="Remove item?"
          message={`Do you want to remove ${pendingRemoveMenuItem.name} from your cart?`}
          confirmLabel="Yes, Remove"
          cancelLabel="No, Keep"
          onConfirm={confirmRemoveMenuItemFromSummary}
          onCancel={() => setPendingRemoveMenuItem(null)}
        />
      )}

      {showOrderMethod && (
        <OrderMethodModal
          title="Choose Order Method"
          subtitle="Select how you would like to receive this meal package order."
          options={packageOrderMethodOptions}
          onSelect={(method) => {
            setDeliveryType(method)
            setShowOrderMethod(false)
            if (method === 'delivery') {
              setShowDelivery(true)
              return
            }
            setShowTakeaway(true)
          }}
          onCancel={() => setShowOrderMethod(false)}
        />
      )}

      {showDelivery && (
        <DeliveryModal
          title={summaryMenuEntries.length > 0 ? 'Delivery Details' : 'Delivery Address'}
          subtitle={summaryMenuEntries.length > 0 ? '' : packageDeliverySubtitle}
          confirmLabel={summaryMenuEntries.length > 0 ? 'Review Order' : 'Confirm Details'}
          showQuantity={false}
          allowCurrentLocation={summaryMenuEntries.length > 0}
          requireFeeEstimate={summaryMenuEntries.length > 0}
          autoEstimateFee={summaryMenuEntries.length > 0}
          hasPackage={summaryMenuEntries.length === 0}
          deliveryIncludedText={summaryMenuEntries.length > 0
            ? ''
            : 'Free delivery applies only to meal-package-only orders.'}
          onCancel={() => setShowDelivery(false)}
          onConfirm={({ delivery_address, phone_number, address_line_1, address_line_2, city_area, location_source, delivery_latitude, delivery_longitude }) => {
            setShowDelivery(false)
            void queuePackageCheckout({
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
          title="Pickup Details"
          subtitle={packageTakeawaySubtitle}
          showQuantity={false}
          onCancel={() => setShowTakeaway(false)}
          onConfirm={({ phone_number, pickup_note }) => {
            setShowTakeaway(false)
            void queuePackageCheckout({
              detailsText: pickup_note,
              phoneNumber: phone_number,
            })
          }}
        />
      )}
    </div>
  )

  const mealSlotCards = ['breakfast', 'lunch', 'dinner'].map((mealTime) => {
    const meta = PACKAGE_MEAL_META[mealTime]
    const timing = getPackageTimingDetails(mealTime)
    const choices = ['veg', 'nonveg'].map((categoryKey) => {
      const pkg = buildPackageEntryForDate(mealTime, categoryKey, selectedDate)
      const isLockedToOtherMeal = Boolean(lockedPackageEntry)
        && normalizeMealSlotName(lockedMealTime) !== normalizeMealSlotName(mealTime)
      const disabled = isLockedToOtherMeal || !pkg?.canOrder || pkg?.closed
      const helper = isLockedToOtherMeal
        ? 'Unavailable for this checkout'
        : !pkg?.canOrder
          ? 'Not available'
          : pkg?.closed
            ? 'Closed'
            : pkg?.priceLabel || 'View details'

      return {
        categoryKey,
        label: categoryKey === 'veg' ? 'Veg' : 'Non-Veg',
        pkg,
        disabled,
        helper,
      }
    })

    const scheduledChoices = choices.filter((choice) => choice.pkg)
    const orderableChoices = scheduledChoices.filter((choice) => choice.pkg?.canOrder)
    const availableChoices = orderableChoices.filter((choice) => !choice.pkg?.closed)
    const priceValues = availableChoices
      .map((choice) => Number(choice.pkg?.priceValue) || 0)
      .filter((value) => value > 0)
    const fallbackPriceValues = orderableChoices
      .map((choice) => Number(choice.pkg?.priceValue) || 0)
      .filter((value) => value > 0)
    const fromPrice = priceValues[0] || fallbackPriceValues[0] || 0

    let statusTone = 'closed'
    let statusLabel = 'Not scheduled'
    let helperText = 'We are preparing this package for another day.'

    if (lockedPackageEntry && normalizeMealSlotName(lockedMealTime) !== normalizeMealSlotName(mealTime)) {
      statusTone = 'muted'
      statusLabel = 'Locked by your cart'
      helperText = `${lockedMealTitle} is already selected for ${lockedDateLabel}. Clear the cart to switch meal time.`
    } else if (mealTime === 'lunch' && !isWeekend) {
      statusTone = 'info'
      statusLabel = 'Weekend only'
      helperText = 'Lunch packages are available on Saturday and Sunday only.'
    } else if (availableChoices.length > 1) {
      statusTone = 'open'
      statusLabel = 'Veg & Non-Veg available'
      helperText = 'Choose the option you want below and we will open the right package details.'
    } else if (availableChoices.length === 1) {
      statusTone = 'open'
      statusLabel = `${availableChoices[0].label} available`
      helperText = availableChoices[0].categoryKey === 'nonveg' && mealTime === 'lunch'
        ? 'Weekend lunch is currently available under Non-Veg.'
        : 'One package option is ready to order right now.'
    } else if (orderableChoices.length > 0) {
      statusTone = 'closed'
      statusLabel = 'Closed for this day'
      helperText = 'The ordering cutoff has already passed for this date.'
    }

    return {
      mealTime,
      title: meta.label,
      Icon: meta.icon,
      orderText: timing.orderText,
      readyText: timing.readyText,
      statusTone,
      statusLabel,
      helperText,
      choices,
      canProceed: availableChoices.length > 0,
      fromPrice: fromPrice > 0 ? `From LKR ${fromPrice.toFixed(2)}` : 'Price updating',
    }
  })

  const selectedMealCard = mealSlotCards.find((slot) => slot.mealTime === selectedMealTime) || null
  const packagePreviewCards = [
    {
      key: 'breakfast',
      title: 'Breakfast',
      subtitle: 'Veg or Non-Veg',
      orderText: getPackageTimingDetails('breakfast').orderText,
      readyText: getPackageTimingDetails('breakfast').readyText,
      Icon: PACKAGE_MEAL_META.breakfast.icon,
    },
    {
      key: 'lunch',
      title: 'Lunch',
      subtitle: 'Weekend Non-Veg',
      orderText: getPackageTimingDetails('lunch').orderText,
      readyText: getPackageTimingDetails('lunch').readyText,
      Icon: PACKAGE_MEAL_META.lunch.icon,
    },
    {
      key: 'dinner',
      title: 'Dinner',
      subtitle: 'Veg or Non-Veg',
      orderText: getPackageTimingDetails('dinner').orderText,
      readyText: getPackageTimingDetails('dinner').readyText,
      Icon: PACKAGE_MEAL_META.dinner.icon,
    },
  ]
  const wizardProgress = [
    {
      number: 1,
      label: 'Date',
      active: wizardStep === 1,
      complete: wizardStep > 1,
    },
    {
      number: 2,
      label: 'Meal',
      active: wizardStep === 2,
      complete: wizardStep > 2,
    },
    {
      number: 3,
      label: 'Package',
      active: wizardStep === 3 || Boolean(activeCategoryKey),
      complete: Boolean(activeCategoryKey) || cartEntries.length > 0,
    },
  ]

  return (
    <div className="sd-panel">
      <div
        className="sd-panel-header"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <div>
          <h2 className="sd-panel-title">Meal Packages</h2>
          <p className="sd-panel-subtitle">Breakfast 7:30 AM  •  Lunch 12:30 PM  •  Dinner 7:00 PM</p>
        </div>
      </div>

      <section className="sd-package-flow-shell">
        <div className="sd-package-flow-head">
          <div>
            <h3 className="sd-home-title">Choose Your Package</h3>
            <p className="sd-home-copy">For {selectedDateLabel}</p>
          </div>

          <div className="sd-package-progress">
            {wizardProgress.map((step) => (
              <div
                key={step.number}
                className={`sd-package-progress-step${step.active ? ' active' : ''}${step.complete ? ' complete' : ''}`}
              >
                <span className="sd-package-progress-number">{step.number}</span>
                <span className="sd-package-progress-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sd-package-preview-band">
          <div className="sd-package-preview-copy">
            <p className="sd-home-kicker">What You Can Order</p>
            <h4 className="sd-package-preview-title">Meal package options</h4>
            <p className="sd-package-preview-text">Pick the date after you decide whether you want Breakfast, Lunch, or Dinner.</p>
          </div>

          <div className="sd-package-preview-grid">
            {packagePreviewCards.map((item) => {
              const ItemIcon = item.Icon
              return (
                <article key={item.key} className="sd-package-preview-card">
                  <div className="sd-package-preview-card-head">
                    <span className="sd-package-preview-icon">
                      <ItemIcon size={17} strokeWidth={2.2} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </div>
                  </div>

                  <div className="sd-package-preview-meta">
                    <span>
                      <Clock3 size={14} strokeWidth={2.2} />
                      {item.orderText}
                    </span>
                    <span>
                      <Package2 size={14} strokeWidth={2.2} />
                      {item.readyText}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="sd-package-focus-card">
          {wizardStep === 1 && (
            <>
              <div className="sd-package-question-head">
                <div className="sd-package-focus-copy">
                  <p className="sd-home-kicker">Step 1 of 3</p>
                  <h3 className="sd-home-title">Which day do you want your package for?</h3>
                  <p className="sd-home-copy">Select a date.</p>
                </div>

                <div className="sd-package-question-aside">
                  <span className="sd-package-question-aside-label">Selected Day</span>
                  <strong>{selectedDateLabel}</strong>
                  <small>Next: choose meal time</small>
                </div>
              </div>

              <div className="sd-package-date-panel compact-card">
                <div className="sd-date-strip compact">
                  {dateOptions.map((option) => {
                    const isLockedOut = Boolean(lockedPackageEntry) && option.value !== lockedDate
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`sd-date-chip${selectedDate === option.value ? ' active' : ''}${isLockedOut ? ' disabled' : ''}`}
                        onClick={() => handleSelectedDateChange(option.value)}
                        disabled={isLockedOut}
                      >
                        <span>{option.label}</span>
                        <small>{option.sub}</small>
                      </button>
                    )
                  })}
                </div>

                <input
                  type="date"
                  className="sd-date-picker"
                  value={selectedDate}
                  min={today}
                  max={maxDate}
                  onChange={(e) => handleSelectedDateChange(e.target.value)}
                  disabled={Boolean(lockedPackageEntry)}
                />

                <div className={`sd-package-lock-note${lockedPackageEntry ? '' : ' soft'}`}>
                  {lockedPackageEntry
                    ? `${lockedMealTitle} is selected for ${lockedDateLabel}. Other dates and meal times stay inactive until you clear the cart.`
                    : 'One meal slot per date. Choose Veg or Non-Veg after the meal step.'}
                </div>
              </div>

              <div className="sd-package-step-actions centered highlight">
                <button type="button" className="sd-btn-primary" onClick={() => setWizardStep(2)}>
                  Use {selectedDateLabel} and Continue
                </button>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div className="sd-package-question-head">
                <div className="sd-package-focus-copy">
                  <p className="sd-home-kicker">Step 2 of 3</p>
                  <h3 className="sd-home-title">What meal do you want on {selectedDateLabel}?</h3>
                  <p className="sd-home-copy">Choose one meal time.</p>
                </div>

                <div className="sd-package-question-aside compact">
                  <span className="sd-package-question-aside-label">Selected Day</span>
                  <strong>{selectedDateLabel}</strong>
                </div>
              </div>

              {loadingTypes ? (
                <div className="sd-package-summary-empty">
                  <Spinner size="sm" />
                  <span>Loading meal packages...</span>
                </div>
              ) : (
                <div className="sd-package-slot-grid focus">
                  {mealSlotCards.map((slot) => {
                    const SlotIcon = slot.Icon
                    const isSelected = selectedMealTime === slot.mealTime
                    return (
                      <article key={slot.mealTime} className={`sd-package-slot-card ${slot.statusTone}${isSelected ? ' selected' : ''}`}>
                        <div className="sd-package-slot-card-top">
                          <div className="sd-package-slot-title-group">
                            <span className="sd-package-slot-icon">
                              <SlotIcon size={18} strokeWidth={2.2} />
                            </span>
                            <div className="sd-package-slot-title-copy">
                              <strong>{slot.title}</strong>
                              <small>{slot.fromPrice}</small>
                            </div>
                          </div>
                          <span className={`sd-package-slot-status ${slot.statusTone}`}>{slot.statusLabel}</span>
                        </div>

                        <div className="sd-package-slot-meta">
                          <span className="sd-package-slot-meta-line">
                            <Clock3 size={15} strokeWidth={2.2} />
                            {slot.orderText}
                          </span>
                          <span className="sd-package-slot-meta-line">
                            <Package2 size={15} strokeWidth={2.2} />
                            {slot.readyText}
                          </span>
                        </div>

                        <p className="sd-package-slot-note">{slot.helperText}</p>

                        <button
                          type="button"
                          className="sd-package-slot-cta"
                          disabled={!slot.canProceed}
                          onClick={() => {
                            setSelectedMealTime(slot.mealTime)
                            setWizardStep(3)
                            setCartError('')
                          }}
                        >
                          {slot.canProceed ? `Choose ${slot.title}` : slot.statusLabel}
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}

              <div className="sd-package-step-actions">
                <button type="button" className="sd-btn-secondary" onClick={() => setWizardStep(1)}>
                  Back
                </button>
              </div>
            </>
          )}

          {wizardStep === 3 && selectedMealCard && (
            <>
              <div className="sd-package-question-head">
                <div className="sd-package-focus-copy">
                  <p className="sd-home-kicker">Step 3 of 3</p>
                  <h3 className="sd-home-title">Do you want Veg or Non-Veg {selectedMealCard.title}?</h3>
                  <p className="sd-home-copy">{selectedMealCard.title} for {selectedDateLabel}</p>
                </div>

                <div className="sd-package-question-aside compact">
                  <span className="sd-package-question-aside-label">Selected Meal</span>
                  <strong>{selectedMealCard.title}</strong>
                  <small>{selectedDateLabel}</small>
                </div>
              </div>

              <div className="sd-package-selected-meal-card">
                <div className="sd-package-focus-summary">
                  <span className="sd-package-guide-chip">Date: {selectedDateLabel}</span>
                  <span className="sd-package-guide-chip">Meal: {selectedMealCard.title}</span>
                </div>

                <div className="sd-package-slot-meta">
                  <span className="sd-package-slot-meta-line">
                    <Clock3 size={15} strokeWidth={2.2} />
                    {selectedMealCard.orderText}
                  </span>
                  <span className="sd-package-slot-meta-line">
                    <Package2 size={15} strokeWidth={2.2} />
                    {selectedMealCard.readyText}
                  </span>
                </div>
                <p className="sd-package-slot-note">{selectedMealCard.helperText}</p>
              </div>

              <div className="sd-package-choice-row wizard">
                {selectedMealCard.choices.map((choice) => (
                  <button
                    key={`${selectedMealCard.mealTime}_${choice.categoryKey}`}
                    type="button"
                    className={`sd-package-choice-btn ${choice.categoryKey}`}
                    disabled={choice.disabled}
                    onClick={() => {
                      if (!choice.pkg) return
                      openPackageCategory(choice.categoryKey, selectedMealCard.mealTime, selectedDate)
                    }}
                  >
                    <span>{choice.label}</span>
                    <small>{choice.helper}</small>
                  </button>
                ))}
              </div>

              <div className="sd-package-step-actions">
                <button
                  type="button"
                  className="sd-btn-secondary"
                  onClick={() => {
                    setSelectedMealTime('')
                    setWizardStep(2)
                  }}
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="sd-menu-preview sd-menu-preview-inline">
        <div className="sd-menu-preview-head">
          <div>
            <h3 className="sd-menu-preview-title">Popular Menu Items</h3>
          </div>
          <button type="button" className="sd-btn-see-meal" onClick={onOpenMenu}>
            <BookOpen size={16} strokeWidth={2.2} />
            View Full Menu
          </button>
        </div>

        {loadingMenuPreview ? (
          <div className="sd-menu-preview-loading">
            <Spinner size="sm" />
            <span>Loading menu items...</span>
          </div>
        ) : previewItems.length === 0 ? (
          <div className="sd-package-summary-empty">
            <UtensilsCrossed size={18} strokeWidth={2.2} />
            <span>No menu items available right now.</span>
          </div>
        ) : (
          <div className="sd-menu-preview-grid">
            {previewItems.slice(0, 6).map((item, index) => (
              <article
                key={item.id}
                className="sd-menu-preview-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpenMenu?.()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpenMenu?.()
                  }
                }}
              >
                <div className="sd-menu-preview-media">
                  <img src={item.image_url} alt={item.name} />
                  {index < 2 && (
                    <span className={`sd-menu-preview-badge ${index === 0 ? 'top' : 'chef'}`}>
                      {index === 0 ? 'Top Pick' : 'Chef Pick'}
                    </span>
                  )}
                </div>
                <div className="sd-menu-preview-card-body">
                  <strong>{item.name}</strong>
                  <div className="sd-menu-preview-card-meta">
                    <span>Rs. {Number(item.price).toFixed(2)}</span>
                    <button
                      type="button"
                      className="sd-menu-preview-link"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenMenu?.()
                      }}
                    >
                      View details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeCategoryWithCart && (
        <PackageCategoryDetailsModal
          category={activeCategoryWithCart}
          selectedDate={selectedDate}
          dateOptions={dateOptions}
          maxDate={maxDate}
          cartEntries={cartEntries}
          cartCount={cartCount}
          cartTotal={cartTotal}
          cartError={cartError}
          onDateChange={handleSelectedDateChange}
          onAddPackage={addPackageToCart}
          onDecreasePackage={decreasePackageInCart}
          onRemovePackage={requestRemovePackageFromCart}
          onClearCart={() => setShowClearPackageCartConfirm(true)}
          onContinue={handleContinueFromCart}
          selectionHint={packageSelectionHint}
          lockedDateValue={lockedDate}
          focusMealTime={focusedMealTime}
          onClose={() => {
            setActiveCategoryKey(null)
            setFocusedMealTime('')
          }}
        />
      )}

      {showSuggestion && (
        <PackageSuggestionModal
          suggestedLabel={suggestedCategoryKey === 'nonveg' ? 'Non-Veg' : 'Veg'}
          mealTitle={lockedMealTitle}
          onAddOther={() => {
            setShowSuggestion(false)
            const nextCategory = categoryLookup[suggestedCategoryKey]
            if (nextCategory) {
              setFocusedMealTime(lockedMealTime)
              setActiveCategoryKey(nextCategory.key)
            }
          }}
          onContinue={() => {
            setShowSuggestion(false)
            setShowOrderMethod(true)
          }}
          onClose={() => setShowSuggestion(false)}
        />
      )}

      {showOrderMethod && (
        <OrderMethodModal
          title="Choose Order Method"
          subtitle="Select how you would like to receive this meal package order."
          options={packageOrderMethodOptions}
          onSelect={(method) => {
            setDeliveryType(method)
            setShowOrderMethod(false)
            if (method === 'delivery') {
              setShowDelivery(true)
              return
            }
            setShowTakeaway(true)
          }}
          onCancel={() => setShowOrderMethod(false)}
        />
      )}

      {showDelivery && (
        <DeliveryModal
          title={summaryMenuEntries.length > 0 ? 'Delivery Details' : 'Delivery Address'}
          subtitle={summaryMenuEntries.length > 0 ? '' : packageDeliverySubtitle}
          confirmLabel={summaryMenuEntries.length > 0 ? 'Review Order' : 'Confirm Details'}
          showQuantity={false}
          allowCurrentLocation={summaryMenuEntries.length > 0}
          requireFeeEstimate={summaryMenuEntries.length > 0}
          autoEstimateFee={summaryMenuEntries.length > 0}
          hasPackage={summaryMenuEntries.length === 0}
          deliveryIncludedText={summaryMenuEntries.length > 0
            ? ''
            : 'Free delivery applies only to meal-package-only orders.'}
          onCancel={() => setShowDelivery(false)}
          onConfirm={({ delivery_address, phone_number, address_line_1, address_line_2, city_area, location_source, delivery_latitude, delivery_longitude }) => {
            setShowDelivery(false)
            void queuePackageCheckout({
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
          title="Pickup Details"
          subtitle={packageTakeawaySubtitle}
          showQuantity={false}
          onCancel={() => setShowTakeaway(false)}
          onConfirm={({ phone_number, pickup_note }) => {
            setShowTakeaway(false)
            void queuePackageCheckout({
              detailsText: pickup_note,
              phoneNumber: phone_number,
            })
          }}
        />
      )}
    </div>
  )
}

function ItemDetailsModal({
  item,
  initialQty = 1,
  onClose,
  onAdd,
  getVariantQty = () => 0,
  onAddVariant = () => {},
  onDecreaseVariant = () => {},
}) {
  useBodyScrollLock()

  const hasVariants = hasStudentVariantChoices(item)
  const variants = getStudentItemActiveVariants(item)
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
          <h3 className="sd-modal-title">{hasVariants ? 'View Item' : 'Item Details'}</h3>
          <p className="sd-modal-sub">
            {hasVariants
              ? 'Choose the variant you want and add it directly to your cart.'
              : 'Review the item details and choose the quantity before adding it to your cart.'}
          </p>
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
            {(item.menu_group_name || item.category_name) && <span className="sd-item-modal-tag">{item.menu_group_name || item.category_name}</span>}
          </div>

          <h4 className="sd-item-modal-name">{item.name}</h4>
          <p className="sd-item-modal-price">Rs. {Number(item.price).toFixed(2)}</p>

          {hasVariants ? (
            <div style={{ display: 'grid', gap: '10px', marginTop: '18px' }}>
              {variants.map((variant) => {
                const variantQty = getVariantQty(item, variant)
                return (
                  <div
                    key={variant.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1px solid rgba(156, 120, 91, 0.16)',
                      background: '#fff',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: T.coffee }}>{variant.name}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: T.caramel, marginTop: '4px' }}>
                        Rs. {Number(variant.price || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="sd-cart-qty-controls sd-item-modal-variant-controls">
                      <button type="button" className="sd-cart-qty-btn sd-item-modal-variant-btn" onClick={() => onDecreaseVariant(item, variant)} disabled={variantQty <= 0}>
                        <Minus size={14} strokeWidth={2.4} />
                      </button>
                      <span className="sd-cart-qty-num sd-item-modal-variant-qty">{variantQty}</span>
                      <button type="button" className="sd-cart-qty-btn sd-item-modal-variant-btn" onClick={() => onAddVariant(item, variant)}>
                        <Plus size={14} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
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
          )}
        </div>

        <div className="sd-modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button type="button" className={hasVariants ? 'sd-btn-primary' : 'sd-btn-secondary'} onClick={onClose}>
            {hasVariants ? 'Done' : 'Cancel'}
          </button>
          {!hasVariants && (
            <button type="button" className="sd-btn-primary" onClick={() => onAdd(item, qty)}>
              <Plus size={16} strokeWidth={2.2} />
              Add to Cart
            </button>
          )}
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

function buildStudentMenuSections(items = [], activeShortcut = 'all', search = '') {
  const q = search.toLowerCase().trim()
  const grouped = new Map()

  const filteredItems = q
    ? items.filter((item) => {
        const variantText = getStudentItemActiveVariants(item).map((variant) => variant.name || '').join(' ').toLowerCase()
        return (
          (item.name || '').toLowerCase().includes(q)
          || (item.item_id || '').toLowerCase().includes(q)
          || (item.menu_group_name || '').toLowerCase().includes(q)
          || (item.category_name || '').toLowerCase().includes(q)
          || variantText.includes(q)
        )
      })
    : items

  filteredItems.slice().sort(compareMenuItemsByCode).forEach((item) => {
    const key = getStudentMenuSectionKey(item)
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: getStudentMenuSectionLabel(item),
        items: [],
      })
    }
    grouped.get(key).items.push(item)
  })

  const sections = [...grouped.values()]

  if (activeShortcut === 'all' || activeShortcut === 'meal-packages') {
    return sections
  }

  const selectedSection = sections.find((section) => section.key === activeShortcut)
  if (!selectedSection) return sections
  return [selectedSection, ...sections.filter((section) => section.key !== activeShortcut)]
}

function SharedOrderCartSidebar({
  snapshot,
  actionsRef,
  mobile = false,
  onClose = null,
}) {
  const {
    selectedDateLabel = 'Selected date',
    summaryPackageEntries = [],
    summaryMenuEntries = [],
    summaryTotal = 0,
    cartError = '',
    hasSummaryItems = false,
  } = snapshot || {}

  const actions = actionsRef?.current || {}
  const packageItemCount = summaryPackageEntries.reduce((sum, entry) => sum + Number(entry.quantity || entry.qty || 0), 0)
  const menuItemCount = summaryMenuEntries.reduce((sum, entry) => sum + Number(entry.qty || 0), 0)
  const totalItemCount = packageItemCount + menuItemCount

  return (
    <section className={`sd-order-summary-card${mobile ? ' sd-order-summary-card-mobile' : ''}`}>
      <div className="sd-order-stage-head compact">
        <div>
          <p className="sd-home-kicker">Your Cart</p>
          <p className="sd-order-summary-subtitle">Selected items</p>
        </div>
        <div className="sd-order-summary-head-actions">
          {hasSummaryItems && (
            <span className="sd-order-summary-count">{totalItemCount} item{totalItemCount === 1 ? '' : 's'}</span>
          )}
          {mobile && (
            <button
              type="button"
              className="sd-mobile-cart-close"
              onClick={() => onClose?.()}
              aria-label="Close cart"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      <div className="sd-order-summary-day">
        <span>Selected Meal Day</span>
        <strong>{selectedDateLabel}</strong>
      </div>

      <div className="sd-order-summary-items">
        {!hasSummaryItems ? (
          <div className="sd-package-summary-empty">
            <ShoppingCart size={18} strokeWidth={2.2} />
            <span>No items selected yet.</span>
          </div>
        ) : (
          <>
            {summaryPackageEntries.length > 0 && (
              <>
                <div className="sd-order-summary-section-label">Meal Packages</div>
                <div className="sd-order-summary-list">
                  {summaryPackageEntries.map((entry) => {
                    const qty = Number(entry.quantity || entry.qty || 0)
                    const unitPrice = Number(entry.priceValue || 0)
                    const totalLabel = `LKR ${(unitPrice * qty).toFixed(2)}`
                    const detailLabel = entry.dateLabel || (entry.date ? formatOrderSuccessDate(entry.date) : selectedDateLabel)
                    const unitLabel = entry.unitPriceLabel || `LKR ${unitPrice.toFixed(2)} each`

                    return (
                      <div key={entry.key} className="sd-order-summary-row cashier-style">
                        <div className="sd-order-summary-row-info">
                          <div className="sd-order-summary-row-name">{entry.label || entry.name}</div>
                          <div className="sd-order-summary-row-meta">{detailLabel}</div>
                          <div className="sd-order-summary-row-unit">{unitLabel}</div>
                          <div className="sd-cart-qty-controls">
                            <button type="button" className="sd-cart-qty-btn" onClick={() => actions.onDecreasePackage?.(entry)}>
                              <Minus size={14} strokeWidth={2.4} />
                            </button>
                            <span className="sd-cart-qty-num">{qty}</span>
                            <button type="button" className="sd-cart-qty-btn" onClick={() => actions.onIncreasePackage?.(entry)}>
                              <Plus size={14} strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                        <div className="sd-order-summary-row-right">
                          <span className="sd-order-summary-line-total">{totalLabel}</span>
                          <button type="button" className="sd-order-summary-remove" onClick={() => actions.onRemovePackage?.(entry)}>
                            <X size={14} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {summaryMenuEntries.length > 0 && (
              <>
                <div className="sd-order-summary-section-label">Menu Items</div>
                <div className="sd-order-summary-list">
                  {summaryMenuEntries.map(({ item, qty }) => {
                    const unitPrice = Number(item.price || 0)
                    const totalLabel = `Rs.${(unitPrice * qty).toFixed(2)}`
                    const unitLabel = `Rs.${unitPrice.toFixed(2)} each`

                    return (
                      <div key={item.id} className="sd-order-summary-row cashier-style">
                        <div className="sd-order-summary-row-info">
                          <div className="sd-order-summary-row-name">{item.name}</div>
                          <div className="sd-order-summary-row-meta">{item.category_name || 'Menu Item'}</div>
                          <div className="sd-order-summary-row-unit">{unitLabel}</div>
                          <div className="sd-cart-qty-controls">
                            <button type="button" className="sd-cart-qty-btn" onClick={() => actions.onDecreaseMenuItem?.(item)}>
                              <Minus size={14} strokeWidth={2.4} />
                            </button>
                            <span className="sd-cart-qty-num">{qty}</span>
                            <button type="button" className="sd-cart-qty-btn" onClick={() => actions.onIncreaseMenuItem?.(item)}>
                              <Plus size={14} strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                        <div className="sd-order-summary-row-right">
                          <span className="sd-order-summary-line-total">{totalLabel}</span>
                          <button type="button" className="sd-order-summary-remove" onClick={() => actions.onRemoveMenuItem?.(item)}>
                            <X size={14} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {cartError && <div className="sd-alert error">{cartError}</div>}

      {hasSummaryItems && <div className="sd-order-summary-divider" />}

      <div className="sd-package-summary-total">
        <span>Total</span>
        <strong>LKR {Number(summaryTotal || 0).toFixed(2)}</strong>
      </div>

      <div className="sd-order-summary-footer-actions">
        <button
          type="button"
          className="sd-btn-primary"
          disabled={!hasSummaryItems}
          onClick={() => actions.onCheckout?.()}
        >
          Checkout
        </button>
        {hasSummaryItems && (
          <button type="button" className="sd-summary-clear sd-summary-clear-bottom" onClick={() => actions.requestClearSharedCart?.()}>
            Clear
          </button>
        )}
      </div>
    </section>
  )
}

function MenuItemsPanel({
  refetchOrders,
  pendingPackageOrder,
  onPendingPackageOrderChange,
  onPackageOrderSent,
  showToast,
  onOrderSuccess,
  mealTypes = [],
  weeklyPlan = {},
  onFloatingCartBarChange,
  embedded = false,
  headerTitle = 'Menu Items',
  headerSubtitle = '',
  sharedCart = null,
  onSharedCartChange = null,
  embeddedCheckoutRequestToken = 0,
  activeShortcut = 'all',
  suppressEmbeddedMobileCart = false,
}) {
  const { data: rawItems = [], loading: loadingItems } = useApi(getStudentItems)
  const [search, setSearch] = useState('')
  const [localCart, setLocalCart] = useState({})
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
  const [pendingRemoveCartPackage, setPendingRemoveCartPackage] = useState(null)
  const [showClearMenuPackagesConfirm, setShowClearMenuPackagesConfirm] = useState(false)
  const [combinedOrderReview, setCombinedOrderReview] = useState(null)
  const [preparingCombinedReview, setPreparingCombinedReview] = useState(false)
  const [selectedMenuDate, setSelectedMenuDate] = useState(() => toInputDate(new Date()))
  const lastEmbeddedCheckoutTokenRef = useRef(0)
  const cart = sharedCart ?? localCart
  const setCart = onSharedCartChange ?? setLocalCart
  const packageOrders = normalizePackagePayloads(pendingPackageOrder)
  const hasPendingPackageOrder = packageOrders.length > 0
  const primaryPackageOrder = packageOrders[0]
  const pendingPackageEntries = getPendingPackageEntries(packageOrders, mealTypes, weeklyPlan)
  const packageCount = pendingPackageEntries.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)
  const packageTotal = pendingPackageEntries.reduce((sum, line) => sum + (Number(line.priceValue) || 0) * (Number(line.qty) || 0), 0)
  const todayDate = new Date()
  const activeMenuDate = primaryPackageOrder?.order_date || selectedMenuDate
  const activeMenuDateObj = new Date(`${activeMenuDate}T00:00:00`)
  const activeMenuDateLabel = Number.isNaN(activeMenuDateObj.getTime())
    ? 'selected date'
    : activeMenuDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  useBodyScrollLock(showMobileCart)

  const menuSections = useMemo(() => {
    return buildStudentMenuSections(rawItems, activeShortcut, search)
  }, [activeShortcut, rawItems, search])

  const cartEntries = Object.values(cart).filter((e) => e.qty > 0)
  const cartTotal = cartEntries.reduce((sum, e) => sum + Number(e.item.price) * e.qty, 0)
  const combinedCartTotal = cartTotal + packageTotal
  const cartCount = cartEntries.reduce((sum, e) => sum + e.qty, 0)
  const displayCartCount = cartCount + packageCount
  const menuOrderingOpen = isMenuItemOrderOpen()
  const hasMenuItemsInCart = cartEntries.length > 0
  const isPackageOnlyCheckout = hasPendingPackageOrder && !hasMenuItemsInCart
  const showFloatingCartBar = (cartEntries.length > 0 || hasPendingPackageOrder)
    && !selectedItem
    && !showOrderMethod
    && !showDelivery
    && !showTakeaway
    && !showMobileCart
  const orderButtonLabel = !menuOrderingOpen && hasMenuItemsInCart
    ? 'Orders open at 4:00 AM'
    : hasPendingPackageOrder && cartCount === 0
      ? `Place Order (${packageCount} pkg)`
      : cartEntries.length === 0
        ? 'Add items to order'
        : hasPendingPackageOrder
        ? `Place Combined Order (${cartCount} item${cartCount > 1 ? 's' : ''} + ${packageCount} pkg)`
        : `Place Order (${cartCount} item${cartCount > 1 ? 's' : ''})`
  const floatingCartLabel = hasPendingPackageOrder && cartCount > 0
    ? `${packageCount} pkg + ${cartCount} item${cartCount > 1 ? 's' : ''}`
    : hasPendingPackageOrder
      ? `${packageCount} pkg`
      : `${cartCount} item${cartCount > 1 ? 's' : ''}`
  const floatingCartMeta = `Rs. ${combinedCartTotal.toFixed(2)}`

  useEffect(() => {
    if (cartEntries.length === 0 && !hasPendingPackageOrder) {
      setShowMobileCart(false)
    }
  }, [cartEntries.length, hasPendingPackageOrder])

  useEffect(() => {
    onFloatingCartBarChange?.(showFloatingCartBar)
  }, [showFloatingCartBar, onFloatingCartBarChange])

  const addToCart = (item, qtyToAdd = 1) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty ?? 0) + qtyToAdd },
    }))

  const addBaseMenuItemToCart = (item, qtyToAdd = 1) => {
    addToCart(buildStudentCartItem(item), qtyToAdd)
  }

  const addVariantToCart = (item, variant, qtyToAdd = 1) => {
    addToCart(buildStudentCartItem(item, variant), qtyToAdd)
  }

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

  const getVariantQty = (item, variant) => cart[getStudentCartLineKey(item, variant)]?.qty ?? 0

  const updatePendingPackageQuantity = (entry, delta) => {
    if (!onPendingPackageOrderChange) return
    if (delta < 0 && Number(entry?.qty || 0) <= 1) {
      setPendingRemoveCartPackage(entry)
      return
    }
    const next = normalizePackagePayloads(pendingPackageOrder).map((item) => ({ ...item }))
    const targetIndex = next.findIndex((item) =>
      Number(item?.meal_type) === Number(entry?.payload?.meal_type)
      && String(item?.preference || '') === String(entry?.payload?.preference || '')
      && String(item?.order_date || '') === String(entry?.payload?.order_date || '')
    )
    if (targetIndex === -1) return

    const currentQty = Number(next[targetIndex]?.quantity || 1)
    const nextQty = currentQty + delta
    if (nextQty <= 0) {
      next.splice(targetIndex, 1)
    } else {
      next[targetIndex].quantity = Math.min(MAX_PACKAGE_QUANTITY, nextQty)
    }
    onPendingPackageOrderChange(next.length > 0 ? next : null)
  }

  const confirmRemovePendingPackage = () => {
    if (!pendingRemoveCartPackage) return
    const next = normalizePackagePayloads(pendingPackageOrder)
      .map((item) => ({ ...item }))
      .filter((item) => !(
        Number(item?.meal_type) === Number(pendingRemoveCartPackage?.payload?.meal_type)
        && String(item?.preference || '') === String(pendingRemoveCartPackage?.payload?.preference || '')
        && String(item?.order_date || '') === String(pendingRemoveCartPackage?.payload?.order_date || '')
      ))
    onPendingPackageOrderChange?.(next.length > 0 ? next : null)
    setPendingRemoveCartPackage(null)
  }

  const clearPendingPackagesOnly = () => {
    onPendingPackageOrderChange?.(null)
    setShowClearMenuPackagesConfirm(false)
  }

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

  const getPackageOnlyDeliveryFeeLabel = (value) => {
    const formatted = formatDeliveryFeeLabel(value, '')
    return formatted === 'Free' || !formatted ? 'Free (meal package only)' : formatted
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
    if (cartEntries.length > 0 && !isMenuItemOrderOpen()) {
      showShopClosedPopup()
      return
    }

    const checkoutMethod = primaryPackageOrder?.delivery_type || deliveryType
    const checkoutPhone = primaryPackageOrder?.phone_number || phoneNumber
    const checkoutDetails = primaryPackageOrder?.delivery_address || detailsText
    const checkoutAddressLine1 = primaryPackageOrder?.address_line_1 || addressLine1
    const checkoutAddressLine2 = primaryPackageOrder?.address_line_2 || addressLine2
    const checkoutCityArea = primaryPackageOrder?.city_area || cityArea
    const checkoutLocationSource = primaryPackageOrder?.location_source || locationSource
    const checkoutLatitude = primaryPackageOrder?.delivery_latitude ?? deliveryLatitude
    const checkoutLongitude = primaryPackageOrder?.delivery_longitude ?? deliveryLongitude
    const inheritedOrderDate = primaryPackageOrder?.order_date || ''

    setSubmitting(true)
    try {
      const itemOrders = cartEntries.map(({ item, qty }) => {
        const itemOrder = {
          delivery_type: checkoutMethod,
          quantity: qty,
          order_type: 'item',
          menu_item: item.menu_item_id || null,
          item_variant: item.item_variant_id || null,
          phone_number: checkoutPhone,
          delivery_address: checkoutDetails,
          address_line_1: checkoutAddressLine1,
          address_line_2: checkoutAddressLine2,
          city_area: checkoutCityArea,
          location_source: checkoutLocationSource,
          delivery_latitude: checkoutLatitude,
          delivery_longitude: checkoutLongitude,
        }
        itemOrder.order_date = inheritedOrderDate || selectedMenuDate
        return itemOrder
      })

      const allOrders = hasPendingPackageOrder ? [...packageOrders, ...itemOrders] : itemOrders
      const { data: createdOrders = [] } = await placeMealOrdersBatch(allOrders)
      const firstCreatedOrder = Array.isArray(createdOrders) ? createdOrders[0] : null
      const packageOnlyCheckout = hasPendingPackageOrder && cartEntries.length === 0
      const deliveryFeeLabel = checkoutMethod === 'delivery'
        ? packageOnlyCheckout
          ? getPackageOnlyDeliveryFeeLabel(firstCreatedOrder?.delivery_fee)
          : formatDeliveryFeeLabel(firstCreatedOrder?.delivery_fee, 'Calculated at checkout')
        : ''
      const itemSummaryLines = cartEntries.map(({ item, qty }) => ({
        name: item.name,
        qty,
      }))
      const summaryLines = hasPendingPackageOrder
        ? [...getPackageSummaryLines(packageOrders, mealTypes), ...itemSummaryLines]
        : itemSummaryLines
      const packageReadyText = hasPendingPackageOrder
        ? getPackageReadyTextFromPayloads(packageOrders, mealTypes)
        : ''

      setSuccess('')
      setCart({})
      if (hasPendingPackageOrder) onPackageOrderSent()
      refetchOrders()
      onOrderSuccess?.({
        title: 'Order Placed Successfully',
        message: hasPendingPackageOrder
          ? cartEntries.length > 0
            ? `Your meal package and cafe items have been sent together. ${packageReadyText}`
            : `Your meal package order has been sent. ${packageReadyText}`
          : 'Your menu item order has been sent to Cafe Lush.',
        method: checkoutMethod,
        deliveryAddress: checkoutMethod === 'delivery' ? checkoutDetails : '',
        pickupDetails: checkoutMethod === 'takeaway' ? checkoutDetails : '',
        phoneNumber: checkoutPhone,
        deliveryFeeLabel,
        lines: summaryLines,
      })
      setCombinedOrderReview(null)
      setShowOrderMethod(false)
      setShowDelivery(false)
      setShowTakeaway(false)
    } catch (err) {
      const d = err.response?.data
      setError(d?.detail || d?.menu_item?.[0] || d?.item_variant?.[0] || d?.item?.[0] || d?.phone_number?.[0] || d?.delivery_address?.[0] || JSON.stringify(d) || 'Failed to place order.')
      showToast(d?.detail || d?.menu_item?.[0] || d?.item_variant?.[0] || d?.phone_number?.[0] || d?.delivery_address?.[0] || 'Failed to place order.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openCheckoutReview = async ({
    deliveryType = primaryPackageOrder?.delivery_type || 'takeaway',
    phoneNumber = primaryPackageOrder?.phone_number || '',
    detailsText = primaryPackageOrder?.delivery_address || '',
    addressLine1 = primaryPackageOrder?.address_line_1 || '',
    addressLine2 = primaryPackageOrder?.address_line_2 || '',
    cityArea = primaryPackageOrder?.city_area || '',
    locationSource = primaryPackageOrder?.location_source || 'address',
    deliveryLatitude = primaryPackageOrder?.delivery_latitude ?? null,
    deliveryLongitude = primaryPackageOrder?.delivery_longitude ?? null,
    deliveryFeeLabel: providedDeliveryFeeLabel = '',
    deliveryFeeValue: providedDeliveryFeeValue = null,
  } = {}) => {
    const packageLines = getPendingPackageEntries(packageOrders, mealTypes, weeklyPlan)
    const itemLines = cartEntries.map(({ item, qty }) => ({
      name: item.name,
      qty,
      subtotal: `Rs. ${(Number(item.price) * qty).toFixed(2)}`,
    }))
    const hasPackageLines = packageLines.length > 0
    const hasItemLines = itemLines.length > 0
    const packageSubtotalValue = packageLines.reduce(
      (sum, line) => sum + (Number(line.priceValue) || 0) * (Number(line.qty) || 0),
      0
    )
    const itemSubtotalValue = cartEntries.reduce(
      (sum, entry) => sum + (Number(entry.item?.price) || 0) * (Number(entry.qty) || 0),
      0
    )
    const foodSubtotalValue = packageSubtotalValue + itemSubtotalValue

    let deliveryFeeLabel = ''
    let deliveryFeeNote = ''
    let deliveryFeeValue = Number(providedDeliveryFeeValue || 0)
    if (deliveryType === 'delivery') {
      if (hasPackageLines && !hasItemLines) {
        deliveryFeeLabel = 'Free (meal package only)'
        deliveryFeeValue = 0
        deliveryFeeNote = 'Free delivery applies because this checkout contains only meal packages.'
      } else {
        deliveryFeeNote = hasPackageLines
          ? 'Delivery charges apply because cafe items are included in this combined order.'
          : 'Delivery charges apply to menu-item orders.'

        if (providedDeliveryFeeLabel) {
          deliveryFeeLabel = providedDeliveryFeeLabel
        } else {
          setPreparingCombinedReview(true)
          try {
            const { data } = await estimateDeliveryFee({
              delivery_type: 'delivery',
              has_package: false,
              address_line_1: addressLine1,
              address_line_2: addressLine2,
              city_area: cityArea,
              location_source: locationSource,
              delivery_latitude: deliveryLatitude,
              delivery_longitude: deliveryLongitude,
            })
            deliveryFeeLabel = data?.delivery_fee_label || formatDeliveryFeeLabel(data?.delivery_fee, 'Calculated at checkout')
            deliveryFeeValue = Number(data?.delivery_fee || 0)
          } catch (err) {
            const message = err.response?.data?.detail || err.message || 'Failed to calculate the delivery fee.'
            setError(message)
            showToast(message, 'error')
            return
          } finally {
            setPreparingCombinedReview(false)
          }
        }
      }
    }
    const totalAmountValue = foodSubtotalValue + (deliveryType === 'delivery' ? deliveryFeeValue : 0)

    const title = hasPackageLines && hasItemLines
      ? `Place Combined Order (${cartCount} item${cartCount > 1 ? 's' : ''} + ${packageCount} pkg)`
      : hasPackageLines
        ? `Place Order (${packageCount} pkg)`
        : `Place Order (${cartCount} item${cartCount > 1 ? 's' : ''})`
    const message = hasPackageLines && hasItemLines
      ? 'Review your meal packages, cafe items, and order details before placing the order.'
      : hasPackageLines
        ? 'Review your meal package details before confirming the order.'
        : 'Review your cafe items and order details before confirming the order.'
    const confirmationNote = hasPackageLines && hasItemLines
      ? `Press confirm to place this combined order with ${packageLines.length} package type${packageLines.length === 1 ? '' : 's'} and ${itemLines.length} cafe item${itemLines.length === 1 ? '' : 's'}.`
      : hasPackageLines
        ? `Press confirm to place this meal package order with ${packageLines.length} package type${packageLines.length === 1 ? '' : 's'}.`
        : `Press confirm to place this cafe order with ${itemLines.length} item${itemLines.length === 1 ? '' : 's'}.`

    setCombinedOrderReview({
      title,
      message,
      method: deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? detailsText : '',
      pickupDetails: deliveryType === 'takeaway' ? detailsText : '',
      phoneNumber,
      foodSubtotalLabel: `LKR ${foodSubtotalValue.toFixed(2)}`,
      deliveryFeeLabel,
      deliveryFeeValue,
      totalAmountLabel: `LKR ${totalAmountValue.toFixed(2)}`,
      deliveryFeeNote,
      confirmationNote,
      packageLines,
      itemLines,
      checkoutPayload: {
        deliveryType,
        phoneNumber,
        detailsText,
        addressLine1,
        addressLine2,
        cityArea,
        locationSource,
        deliveryLatitude,
        deliveryLongitude,
      },
    })
  }

  const confirmCombinedOrder = async () => {
    const checkoutPayload = combinedOrderReview?.checkoutPayload
    if (checkoutPayload) {
      await submitCartOrder(checkoutPayload)
      return
    }
    if (!primaryPackageOrder) return
    await submitCartOrder({
      deliveryType: primaryPackageOrder.delivery_type,
      phoneNumber: primaryPackageOrder.phone_number,
      detailsText: primaryPackageOrder.delivery_address || '',
      addressLine1: primaryPackageOrder.address_line_1 || '',
      addressLine2: primaryPackageOrder.address_line_2 || '',
      cityArea: primaryPackageOrder.city_area || '',
      locationSource: primaryPackageOrder.location_source || 'address',
      deliveryLatitude: primaryPackageOrder.delivery_latitude ?? null,
      deliveryLongitude: primaryPackageOrder.delivery_longitude ?? null,
    })
  }

  const handlePlaceOrder = async () => {
    setShowMobileCart(false)
    setError('')
    setSuccess('')
    if (cartEntries.length === 0 && !hasPendingPackageOrder) {
      setError('Your cart is empty.')
      return
    }
    if (cartEntries.length > 0 && !isMenuItemOrderOpen()) {
      showShopClosedPopup()
      return
    }

    if (hasPendingPackageOrder) {
      await openCheckoutReview()
      return
    }

    setShowOrderMethod(true)
  }

  useEffect(() => {
    if (!embedded || embeddedCheckoutRequestToken === 0) return
    if (embeddedCheckoutRequestToken === lastEmbeddedCheckoutTokenRef.current) return
    lastEmbeddedCheckoutTokenRef.current = embeddedCheckoutRequestToken
    void handlePlaceOrder()
  }, [embedded, embeddedCheckoutRequestToken, handlePlaceOrder])

  const renderCartPanel = ({ mobile = false } = {}) => (
      <div className={`sd-cart-inner${mobile ? ' sd-cart-inner-mobile' : ''}`}>
      <div className="sd-cart-header">
        <span className="sd-cart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} strokeWidth={2.2} />
          Your Cart
        </span>

        <div className="sd-cart-header-actions">
          {displayCartCount > 0 && <span className="sd-cart-count">{displayCartCount}</span>}
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
        {cartEntries.length === 0 && !hasPendingPackageOrder ? (
          <div className="sd-cart-empty">
            <span className="sd-cart-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <ShoppingCart size={24} strokeWidth={2.2} />
            </span>
            <p className="sd-cart-empty-text">No items added yet</p>
          </div>
        ) : (
          <>
            {hasPendingPackageOrder && (
              <div className="sd-cart-package-block">
                <div className="sd-cart-section-label">Selected Packages</div>
                {pendingPackageEntries.map((line) => (
                  <div key={line.key} className="sd-cart-row package">
                    <div className="sd-cart-row-info">
                      <p className="sd-cart-row-name">{line.name}</p>
                      <p className="sd-cart-row-subtotal">{line.date ? formatOrderSuccessDate(line.date) : 'Package selected'}</p>
                      {line.unitPriceLabel && <p className="sd-cart-row-qty">{line.unitPriceLabel}</p>}
                    </div>
                    <div className="sd-cart-row-right">
                      <div className="sd-cart-qty-controls">
                        <button type="button" className="sd-cart-qty-btn" onClick={() => updatePendingPackageQuantity(line, -1)}>
                          <Minus size={14} strokeWidth={2.4} />
                        </button>
                        <span className="sd-cart-qty-num">{line.qty}</span>
                        <button type="button" className="sd-cart-qty-btn" onClick={() => updatePendingPackageQuantity(line, 1)}>
                          <Plus size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cartEntries.length > 0 && (
              <div className="sd-cart-package-block">
                {hasPendingPackageOrder && <div className="sd-cart-section-label">Cafe Items</div>}
                {cartEntries.map(({ item, qty }) => (
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
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sd-cart-footer">
        {(cartEntries.length > 0 || hasPendingPackageOrder) && (
          <div className="sd-cart-total-row">
            <span className="sd-cart-total-label">Total</span>
            <span className="sd-cart-total-val">Rs. {combinedCartTotal.toFixed(2)}</span>
          </div>
        )}
        {error && <p className="sd-cart-feedback-error">{error}</p>}
        {success && <p className="sd-cart-feedback-success">{success}</p>}
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={submitting || (cartEntries.length === 0 && !hasPendingPackageOrder) || preparingCombinedReview}
          className={`sd-cart-order-btn ${(cartEntries.length > 0 || hasPendingPackageOrder) ? 'ready' : 'empty'}`}
        >
          {(submitting || preparingCombinedReview) ? <Spinner size="sm" /> : <HandPlatter size={16} strokeWidth={2.2} />}
          {orderButtonLabel}
        </button>
        {hasPendingPackageOrder && (
          <button
            type="button"
            className="sd-btn-secondary"
            style={{ justifyContent: 'center' }}
            onClick={() => setShowClearMenuPackagesConfirm(true)}
          >
            Clear Packages
          </button>
        )}
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
      <div className={`sd-panel sd-menu-panel${embedded ? ' sd-menu-panel-embedded' : ''}${showFloatingCartBar ? ' has-mobile-cart' : ''}`}>
        <div className="sd-panel-header">
          <div>
            <h2 className="sd-panel-title">{headerTitle}</h2>
            <p className="sd-panel-subtitle">
              {headerSubtitle || `Browse menu items for ${activeMenuDateLabel} and add them to your cart`}
            </p>
            <p className={menuOrderingOpen ? 'sd-input-hint' : 'sd-input-hint warning'}>
              {menuOrderingOpen
                ? MENU_ITEM_ORDER_HOURS_MESSAGE
                : 'Menu item ordering is closed now. Orders are available from 4:00 AM to 11:30 PM.'}
            </p>
          </div>
        </div>

        {hasPendingPackageOrder && (
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
              <strong>{packageOrders.length} meal package{packageOrders.length === 1 ? '' : 's'} ready.</strong>{' '}
              Add cafe items below if you want to combine them with this checkout.
              {primaryPackageOrder.delivery_type === 'delivery'
                ? ' Free delivery applies only to meal-package-only orders, so delivery charges will apply once cafe items are added.'
                : ' Cafe items will be added to the same takeaway order.'}
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

        <div className="sd-menu-layout">
          <div className="sd-items-col">
            {loadingItems ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spinner />
              </div>
            ) : menuSections.length === 0 ? (
              <EmptyState message="No menu items available right now." />
            ) : (
              menuSections.map((section) => (
                <div
                  key={section.key}
                  id={`student-menu-group-${section.key}`}
                  className="sd-cat-section sd-scroll-anchor"
                >
                  <p className="sd-cat-label sd-cat-label-friendly">{section.label}</p>
                  <div className="sd-items-grid">
                    {section.items.map((item) => {
                      const hasVariants = hasStudentVariantChoices(item)
                      const baseCartKey = getStudentCartLineKey(item)
                      const inCart = hasVariants
                        ? getStudentItemCartQuantity(cart, item) > 0
                        : !!cart[baseCartKey]
                      const inCartQty = hasVariants
                        ? getStudentItemCartQuantity(cart, item)
                        : cart[baseCartKey]?.qty ?? 0
                      return (
                        <div
                          key={item.id}
                          className={inCart ? 'sd-item-card in-cart' : 'sd-item-card'}
                          onClick={embedded || !hasVariants ? undefined : () => openItemDetails(item)}
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

                          {embedded && inCart && !hasVariants ? (
                            <div className="sd-item-card-controls" onClick={(e) => e.stopPropagation()}>
                              <div className="sd-cart-qty-controls">
                                <button type="button" className="sd-cart-qty-btn" onClick={() => decreaseQty(cart[baseCartKey].item)}>
                                  <Minus size={14} strokeWidth={2.4} />
                                </button>
                                <span className="sd-cart-qty-num">{inCartQty}</span>
                                <button type="button" className="sd-cart-qty-btn" onClick={() => increaseQty(cart[baseCartKey].item)}>
                                  <Plus size={14} strokeWidth={2.4} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className={inCart ? 'sd-add-btn in-cart' : 'sd-add-btn'}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (hasVariants) {
                                  openItemDetails(item)
                                  return
                                }
                                addBaseMenuItemToCart(item, 1)
                              }}
                            >
                              {hasVariants ? (
                                <>
                                  <ShoppingCart size={16} strokeWidth={2.2} />
                                  <span>{inCartQty > 0 ? `View Item (${inCartQty})` : 'View Item'}</span>
                                </>
                              ) : inCart ? (
                                <>
                                  <CheckCircle2 size={16} strokeWidth={2.2} />
                                  <span>Add to Cart ({inCartQty})</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={16} strokeWidth={2.2} />
                                  <span>Add to Cart</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {!embedded && (
            <div className="sd-cart sd-cart-desktop">
              {renderCartPanel()}
            </div>
          )}
        </div>
      </div>

      {!suppressEmbeddedMobileCart && (showFloatingCartBar || (embedded && (cartEntries.length > 0 || hasPendingPackageOrder) && !showMobileCart && !selectedItem && !showOrderMethod && !showDelivery && !showTakeaway)) && (
        <button type="button" className="sd-mobile-cart-bar" onClick={() => setShowMobileCart(true)}>
          <span className="sd-mobile-cart-bar-main">
            <span className="sd-mobile-cart-bar-title">
              <ShoppingCart size={16} strokeWidth={2.2} />
              {floatingCartLabel}
            </span>
            <span className="sd-mobile-cart-bar-total">{floatingCartMeta}</span>
          </span>
          <span className="sd-mobile-cart-bar-cta">Review Cart</span>
        </button>
      )}

      {!suppressEmbeddedMobileCart && showMobileCart && createPortal(
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
          subtitle=""
          confirmLabel="Review Order"
          allowCurrentLocation
          requireFeeEstimate={true}
          autoEstimateFee
          onCancel={() => setShowDelivery(false)}
          onConfirm={({ delivery_address, phone_number, address_line_1, address_line_2, city_area, location_source, delivery_latitude, delivery_longitude, delivery_fee_label, delivery_fee_value }) => {
            setShowDelivery(false)
            void openCheckoutReview({
              deliveryType: 'delivery',
              phoneNumber: phone_number,
              detailsText: delivery_address,
              addressLine1: address_line_1,
              addressLine2: address_line_2,
              cityArea: city_area,
              locationSource: location_source,
              deliveryLatitude: delivery_latitude,
              deliveryLongitude: delivery_longitude,
              deliveryFeeLabel: delivery_fee_label,
              deliveryFeeValue: delivery_fee_value,
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
          confirmLabel="Review Order"
          onCancel={() => setShowTakeaway(false)}
          onConfirm={({ phone_number, pickup_note }) => {
            setShowTakeaway(false)
            void openCheckoutReview({
              deliveryType: 'takeaway',
              phoneNumber: phone_number,
              detailsText: pickup_note,
            })
          }}
        />
      )}

      {combinedOrderReview && (
        <CombinedOrderReviewModal
          review={combinedOrderReview}
          submitting={submitting}
          onConfirm={confirmCombinedOrder}
          onCancel={() => {
            if (submitting) return
            setCombinedOrderReview(null)
          }}
        />
      )}

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          initialQty={1}
          onClose={closeItemDetails}
          getVariantQty={getVariantQty}
          onAddVariant={(item, variant) => addVariantToCart(item, variant, 1)}
          onDecreaseVariant={(item, variant) => {
            const cartKey = getStudentCartLineKey(item, variant)
            const lineQty = cart[cartKey]?.qty ?? 0
            if (lineQty > 1) {
              decreaseQty(cart[cartKey].item)
              return
            }
            if (lineQty === 1) {
              setPendingRemoveItem(cart[cartKey].item)
            }
          }}
          onAdd={(item, qty) => {
            addBaseMenuItemToCart(item, qty)
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

      {pendingRemoveCartPackage && (
        <ConfirmDialog
          title="Remove package?"
          message={`Do you want to remove ${pendingRemoveCartPackage.name} from your cart?`}
          confirmLabel="Yes, Remove"
          cancelLabel="No, Keep"
          onConfirm={confirmRemovePendingPackage}
          onCancel={() => setPendingRemoveCartPackage(null)}
        />
      )}

      {showClearMenuPackagesConfirm && (
        <ConfirmDialog
          title="Clear packages?"
          message="Are you sure you want to remove all selected meal packages from this cart?"
          confirmLabel="Yes, Clear"
          cancelLabel="No, Keep"
          onConfirm={clearPendingPackagesOnly}
          onCancel={() => setShowClearMenuPackagesConfirm(false)}
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
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false)

  useBodyScrollLock(Boolean(selectedHistory) || showClearHistoryConfirm)

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

  const confirmClearHistory = async () => {
    setClearing(true)
    try {
      await clearOrderHistory()
      setSelectedHistory(null)
      setShowClearHistoryConfirm(false)
      onClear()
    } finally {
      setClearing(false)
    }
  }

  const handleClear = () => {
    if (clearing) return
    setShowClearHistoryConfirm(true)
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

      {showClearHistoryConfirm && (
        <ConfirmDialog
          title="Clear order history?"
          message="Are you sure you want to delete all your order history? This cannot be undone."
          confirmLabel={clearing ? 'Clearing...' : 'Yes, Clear'}
          cancelLabel="No, Keep"
          onConfirm={confirmClearHistory}
          onCancel={() => {
            if (clearing) return
            setShowClearHistoryConfirm(false)
          }}
        />
      )}
    </div>
  )
}

// ── Panel 4 - Food Analytics ─────────────────────────────────────────────────
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['breakfast', 'lunch', 'dinner']

function getAnalyticsOrderDate(order) {
  const rawValue = order?.order_date || order?.created_at
  if (!rawValue) return null
  const parsed = String(rawValue).includes('T')
    ? new Date(rawValue)
    : new Date(`${rawValue}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getAnalyticsSpend(order) {
  const quantity = Math.max(Number(order?.quantity) || 1, 1)
  const unitPrice = Number(order?.unit_price)
  if (Number.isFinite(unitPrice) && unitPrice > 0) return unitPrice * quantity

  const totalAmount = Number(order?.total_amount)
  return Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0
}

function getAnalyticsOrderLabel(order) {
  if (order?.order_type === 'item') return order?.item_name || order?.package_label || order?.meal_type_name || 'Cafe item'
  return order?.package_label || order?.meal_type_name || order?.item_name || 'Meal package'
}

function getAnalyticsMealBucket(order) {
  const source = `${order?.meal_type_name || ''} ${order?.package_label || ''} ${order?.item_name || ''}`
    .toLowerCase()
    .trim()

  if (source.includes('breakfast')) return 'breakfast'
  if (source.includes('lunch')) return 'lunch'
  if (source.includes('dinner')) return 'dinner'
  return ''
}

function formatAnalyticsMoney(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString('en-LK')}`
}

function formatAnalyticsMealLabel(value) {
  if (!value) return 'Any time'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

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
  items.forEach((o) => { if (o.item_name) nameFreq[o.item_name] = (nameFreq[o.item_name] || 0) + (Number(o.quantity) || 1) })
  const topItem = Object.entries(nameFreq).sort((a, b) => b[1] - a[1])[0]
  if (topItem && topItem[1] >= 3) tags.push({ label: `Loves ${topItem[0]}`, color: '#be185d', bg: 'rgba(190,24,93,0.08)', border: 'rgba(190,24,93,0.2)' })

  return tags
}

function SummaryCard({ label, value, CardIcon, helper }) {
  return (
    <div className="sd-analytics-stat-card">
      <div className="sd-analytics-stat-icon">
        <CardIcon size={18} strokeWidth={2.2} color={T.caramel} />
      </div>
      <div className="sd-analytics-stat-value">{value}</div>
      <div className="sd-analytics-stat-label">{label}</div>
      {helper && <div className="sd-analytics-stat-helper">{helper}</div>}
    </div>
  )
}

function FoodAnalyticsPanelLegacy({ orders }) {
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
function FoodAnalyticsPanel({ orders }) {
  const confirmed = orders.filter((o) => o.status === 'confirmed')
  const analyticsOrders = confirmed.map((order) => {
    const analyticsDate = getAnalyticsOrderDate(order)
    return {
      ...order,
      analyticsDate,
      analyticsSpend: getAnalyticsSpend(order),
      analyticsLabel: getAnalyticsOrderLabel(order),
      analyticsMeal: getAnalyticsMealBucket(order),
      analyticsDay: analyticsDate ? DAYS[(analyticsDate.getDay() + 6) % 7] : '',
      analyticsQuantity: Math.max(Number(order?.quantity) || 1, 1),
    }
  })

  const now = new Date()
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const last30Start = new Date(startOfToday)
  last30Start.setDate(last30Start.getDate() - 29)

  const thisWeekStart = new Date(startOfToday)
  thisWeekStart.setDate(thisWeekStart.getDate() - 6)

  const lastWeekStart = new Date(startOfToday)
  lastWeekStart.setDate(lastWeekStart.getDate() - 13)

  const sumSpend = (list) => list.reduce((sum, entry) => sum + Number(entry.analyticsSpend || 0), 0)

  const thisMonthOrders = analyticsOrders.filter((entry) => (
    entry.analyticsDate
    && entry.analyticsDate.getFullYear() === now.getFullYear()
    && entry.analyticsDate.getMonth() === now.getMonth()
  ))
  const last30Orders = analyticsOrders.filter((entry) => entry.analyticsDate && entry.analyticsDate >= last30Start)
  const thisWeekOrders = analyticsOrders.filter((entry) => entry.analyticsDate && entry.analyticsDate >= thisWeekStart)
  const lastWeekOrders = analyticsOrders.filter((entry) => (
    entry.analyticsDate
    && entry.analyticsDate >= lastWeekStart
    && entry.analyticsDate < thisWeekStart
  ))

  const totalOrders = analyticsOrders.length
  const totalSpend = sumSpend(analyticsOrders)
  const thisMonthSpend = sumSpend(thisMonthOrders)
  const last30Spend = sumSpend(last30Orders)
  const thisWeekSpend = sumSpend(thisWeekOrders)
  const lastWeekSpend = sumSpend(lastWeekOrders)
  const avgSpend = totalOrders > 0 ? totalSpend / totalOrders : 0
  const thisMonthAverage = thisMonthOrders.length > 0 ? thisMonthSpend / thisMonthOrders.length : 0
  const weekSpendDelta = thisWeekSpend - lastWeekSpend

  const favoriteCounts = {}
  analyticsOrders.forEach((entry) => {
    if (!entry.analyticsLabel) return
    favoriteCounts[entry.analyticsLabel] = (favoriteCounts[entry.analyticsLabel] || 0) + entry.analyticsQuantity
  })
  const topFavorites = Object.entries(favoriteCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const topFavorite = topFavorites[0]?.[0] || 'No favourite yet'
  const maxFavoriteCount = Math.max(...topFavorites.map(([, count]) => count), 1)

  const dayCounts = Object.fromEntries(DAYS.map((day) => [day, 0]))
  analyticsOrders.forEach((entry) => {
    if (entry.analyticsDay) dayCounts[entry.analyticsDay] += 1
  })
  const dayEntries = DAYS.map((day) => [day, dayCounts[day]])
  const maxDayCount = Math.max(...dayEntries.map(([, count]) => count), 1)
  const mostActiveDay = dayEntries.reduce((best, current) => (current[1] > best[1] ? current : best), ['', 0])[0] || '-'

  const mealCounts = Object.fromEntries(MEALS.map((meal) => [meal, 0]))
  analyticsOrders.forEach((entry) => {
    if (entry.analyticsMeal) mealCounts[entry.analyticsMeal] += 1
  })
  const mealEntries = MEALS.map((meal) => [meal, mealCounts[meal]])
  const maxMealCount = Math.max(...mealEntries.map(([, count]) => count), 1)
  const usualMeal = mealEntries.reduce((best, current) => (current[1] > best[1] ? current : best), ['', 0])[0] || ''

  const methodCounts = { takeaway: 0, delivery: 0 }
  analyticsOrders.forEach((entry) => {
    if (entry.delivery_type === 'delivery') methodCounts.delivery += 1
    else methodCounts.takeaway += 1
  })
  const preferredMethod = methodCounts.delivery > methodCounts.takeaway
    ? 'Delivery'
    : methodCounts.takeaway > 0
      ? 'Takeaway'
      : '-'

  const activeDays = new Set(
    analyticsOrders
      .filter((entry) => entry.analyticsDate)
      .map((entry) => entry.analyticsDate.toISOString().slice(0, 10))
  ).size
  const orderRate = activeDays > 0 ? (totalOrders / activeDays).toFixed(1) : '0.0'

  const insightCards = [
    {
      title: `${monthName} at a glance`,
      body: thisMonthOrders.length > 0
        ? `You placed ${thisMonthOrders.length} confirmed order${thisMonthOrders.length === 1 ? '' : 's'} and spent ${formatAnalyticsMoney(thisMonthSpend)} this month.`
        : `No confirmed orders yet in ${monthName}. Your overall order habits are still shown below.`,
    },
    {
      title: 'Your routine',
      body: mostActiveDay !== '-'
        ? `${mostActiveDay} is your busiest day${usualMeal ? `, and ${formatAnalyticsMealLabel(usualMeal).toLowerCase()} is your usual order time.` : '.'}`
        : 'Place a few more confirmed orders to reveal your weekly routine.',
    },
    {
      title: 'How you order',
      body: preferredMethod !== '-'
        ? `${preferredMethod} is your preferred method, and ${topFavorite} is the item you come back to the most.`
        : `Your top pick right now is ${topFavorite}.`,
    },
  ]

  const tips = []
  if (usualMeal) {
    tips.push(`You usually order ${formatAnalyticsMealLabel(usualMeal).toLowerCase()}. Pre-ordering it on busy days can save time.`)
  }
  if (weekSpendDelta > 0) {
    tips.push(`This week you spent ${formatAnalyticsMoney(weekSpendDelta)} more than last week. Meal packages may be worth checking if this becomes your pattern.`)
  } else if (weekSpendDelta < 0) {
    tips.push(`This week you spent ${formatAnalyticsMoney(Math.abs(weekSpendDelta))} less than last week. Your ordering has been lighter recently.`)
  }
  if (preferredMethod === 'Takeaway') {
    tips.push('Takeaway is your usual method. Ordering a little earlier can help you avoid the rush.')
  } else if (preferredMethod === 'Delivery') {
    tips.push('Delivery is your usual method. Keeping your saved address updated will make checkout even faster.')
  }

  const habitTags = generateHabitTags(confirmed)

  if (confirmed.length === 0) {
    return (
      <div className="sd-panel">
        <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="sd-panel-title">My Food Analytics</h2>
            <p className="sd-panel-subtitle">Useful insights will appear here after your confirmed orders start coming in.</p>
          </div>
          <TrendingUp size={22} strokeWidth={2.2} color={T.caramel} />
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMuted, fontSize: '13px' }}>
          <BarChart2 size={40} strokeWidth={1.5} color={T.textLight} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No confirmed order data yet. Once your meals are confirmed, this page will show your real spending and food habits.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sd-panel">
      <div className="sd-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="sd-panel-title">My Food Analytics</h2>
          <p className="sd-panel-subtitle">A student-friendly view of your real confirmed orders, spending, and habits.</p>
        </div>
        <TrendingUp size={22} strokeWidth={2.2} color={T.caramel} />
      </div>

      <div className="sd-analytics-intro">
        <div>
          <span className="sd-home-kicker">Based on confirmed orders</span>
          <h3 className="sd-analytics-intro-title">Useful patterns from your real food history</h3>
          <p className="sd-analytics-intro-copy">
            {thisMonthOrders.length > 0
              ? `You already have ${thisMonthOrders.length} confirmed order${thisMonthOrders.length === 1 ? '' : 's'} in ${monthName}.`
              : `You do not have confirmed orders in ${monthName} yet, so this view mixes your overall history with your latest 30-day activity.`}
          </p>
        </div>
        <div className="sd-analytics-intro-badge">
          <span>Active days</span>
          <strong>{activeDays}</strong>
          <small>{orderRate} orders on active days</small>
        </div>
      </div>

      <div className="sd-analytics-stat-grid">
        <SummaryCard
          label="Orders This Month"
          value={thisMonthOrders.length}
          CardIcon={Package2}
          helper={thisMonthOrders.length > 0 ? `${thisMonthOrders.length} confirmed` : 'No confirmed orders yet'}
        />
        <SummaryCard
          label="Spent This Month"
          value={formatAnalyticsMoney(thisMonthSpend)}
          CardIcon={ShoppingCart}
          helper={`Last 30 days: ${formatAnalyticsMoney(last30Spend)}`}
        />
        <SummaryCard
          label="Top Pick"
          value={topFavorite}
          CardIcon={UtensilsCrossed}
          helper={topFavorites[0] ? `${topFavorites[0][1]} orders` : 'Keep ordering to reveal it'}
        />
        <SummaryCard
          label="Usual Time"
          value={usualMeal ? formatAnalyticsMealLabel(usualMeal) : 'Still learning'}
          CardIcon={Clock3}
          helper={mostActiveDay !== '-' ? `${mostActiveDay} is your busiest day` : 'Need a few more orders'}
        />
      </div>

      <div className="sd-analytics-story-grid">
        {insightCards.map((item) => (
          <div key={item.title} className="sd-analytics-story-card">
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </div>
        ))}
      </div>

      <div className="sd-analytics-grid">
        <section className="sd-analytics-card">
          <div className="sd-analytics-card-head">
            <span className="sd-analytics-card-kicker">Top favorites</span>
            <strong>Your most ordered meals</strong>
          </div>
          {topFavorites.length > 0 ? (
            <div className="sd-analytics-favorites">
              {topFavorites.map(([name, count], index) => (
                <div key={name} className="sd-analytics-favorite-row">
                  <div className="sd-analytics-rank">#{index + 1}</div>
                  <div className="sd-analytics-favorite-copy">
                    <div className="sd-analytics-favorite-topline">
                      <span>{name}</span>
                      <strong>{count}x</strong>
                    </div>
                    <div className="sd-analytics-bar-track">
                      <div className="sd-analytics-bar-fill" style={{ width: `${(count / maxFavoriteCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sd-analytics-empty-copy">Your favourites will appear once you have a few confirmed orders.</p>
          )}
        </section>

        <section className="sd-analytics-card">
          <div className="sd-analytics-card-head">
            <span className="sd-analytics-card-kicker">Spending snapshot</span>
            <strong>Recent spending using real order totals</strong>
          </div>
          <div className="sd-analytics-spend-grid">
            <div className="sd-analytics-mini-stat">
              <span>This week</span>
              <strong>{formatAnalyticsMoney(thisWeekSpend)}</strong>
            </div>
            <div className="sd-analytics-mini-stat">
              <span>Last week</span>
              <strong>{formatAnalyticsMoney(lastWeekSpend)}</strong>
            </div>
            <div className="sd-analytics-mini-stat">
              <span>Average / order</span>
              <strong>{formatAnalyticsMoney(thisMonthOrders.length > 0 ? thisMonthAverage : avgSpend)}</strong>
            </div>
          </div>
          <div className="sd-analytics-highlight">
            <span className="sd-analytics-highlight-label">Weekly trend</span>
            <strong>
              {weekSpendDelta > 0
                ? `${formatAnalyticsMoney(weekSpendDelta)} more than last week`
                : weekSpendDelta < 0
                  ? `${formatAnalyticsMoney(Math.abs(weekSpendDelta))} less than last week`
                  : 'The same as last week'}
            </strong>
            <p>
              {thisWeekOrders.length > 0
                ? `${thisWeekOrders.length} confirmed order${thisWeekOrders.length === 1 ? '' : 's'} this week.`
                : 'No confirmed orders recorded this week.'}
            </p>
          </div>
        </section>
      </div>

      <div className="sd-analytics-grid">
        <section className="sd-analytics-card">
          <div className="sd-analytics-card-head">
            <span className="sd-analytics-card-kicker">Ordering rhythm</span>
            <strong>Which days are busiest for you</strong>
          </div>
          <div className="sd-analytics-pattern-list">
            {dayEntries.map(([day, count]) => (
              <div key={day} className="sd-analytics-pattern-row">
                <span className="sd-analytics-pattern-label">{day}</span>
                <div className="sd-analytics-bar-track">
                  <div className="sd-analytics-bar-fill muted" style={{ width: `${count > 0 ? (count / maxDayCount) * 100 : 0}%` }} />
                </div>
                <strong className="sd-analytics-pattern-value">{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="sd-analytics-card">
          <div className="sd-analytics-card-head">
            <span className="sd-analytics-card-kicker">Meal patterns</span>
            <strong>Your usual time and method</strong>
          </div>
          <div className="sd-analytics-pattern-list">
            {mealEntries.map(([meal, count]) => (
              <div key={meal} className="sd-analytics-pattern-row">
                <span className="sd-analytics-pattern-label">{formatAnalyticsMealLabel(meal)}</span>
                <div className="sd-analytics-bar-track">
                  <div className="sd-analytics-bar-fill" style={{ width: `${count > 0 ? (count / maxMealCount) * 100 : 0}%` }} />
                </div>
                <strong className="sd-analytics-pattern-value">{count}</strong>
              </div>
            ))}
          </div>
          <div className="sd-analytics-method-strip">
            <div className="sd-analytics-method-pill">
              <Truck size={14} strokeWidth={2.1} />
              <span>Delivery: {methodCounts.delivery}</span>
            </div>
            <div className="sd-analytics-method-pill">
              <Coffee size={14} strokeWidth={2.1} />
              <span>Takeaway: {methodCounts.takeaway}</span>
            </div>
          </div>
        </section>
      </div>

      {tips.length > 0 && (
        <div className="sd-analytics-card">
          <div className="sd-analytics-card-head">
            <span className="sd-analytics-card-kicker">Helpful for you</span>
            <strong>Suggestions based on your own pattern</strong>
          </div>
          <div className="sd-analytics-tip-list">
            {tips.slice(0, 3).map((tip) => (
              <div key={tip} className="sd-analytics-tip">
                <CheckCircle2 size={16} strokeWidth={2.1} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {habitTags.length > 0 && (
        <div className="sd-analytics-card">
          <div className="sd-analytics-card-head">
            <span className="sd-analytics-card-kicker">Your style</span>
            <strong>What your habits say about you</strong>
          </div>
          <div className="sd-analytics-tag-list">
            {habitTags.map(({ label, color, bg, border }) => (
              <span key={label} className="sd-analytics-tag" style={{ background: bg, color, borderColor: border }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
  { key: 'packages',    label: 'Meal Ordering',     Icon: Package2   },
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

function formatNotificationAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `Rs. ${amount.toFixed(2)}` : '-'
}

function hasNotificationValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function humanizeNotificationValue(value) {
  if (!hasNotificationValue(value)) return '-'
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function NotificationDetailModal({ notification, onClose, onDelete }) {
  useBodyScrollLock()

  const card = formatNotificationCard(notification)
  const detail = notification.order_detail
  const [showFullDetails, setShowFullDetails] = useState(false)
  const deliveryLabel = detail?.delivery_type === 'delivery' ? 'Delivery' : 'Takeaway'
  const fee = Number(detail?.delivery_fee || 0)
  const subtotalAmount = Number(detail?.subtotal_amount || 0)
  const totalAmount = Number(detail?.total_amount || 0)
  const sessionLines = Array.isArray(detail?.session_lines) ? detail.session_lines : []
  const quantityValue = Number(
    detail?.total_quantity ||
    detail?.quantity ||
    sessionLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0) ||
    1
  )
  const itemTitle = detail?.label || detail?.name || sessionLines[0]?.label || 'Your order'
  const statusLabel = humanizeNotificationValue(detail?.status || card.title.replace(/^Order\s+/i, ''))
  const readyTimeLabel = detail?.pickup_time || (detail?.delivery_type === 'delivery' ? 'Delivery time shared soon' : 'Ready soon')
  const summaryMessage = detail
    ? card.title === 'Order Ready'
      ? detail.delivery_type === 'delivery'
        ? 'Your order is ready for delivery.'
        : `Your order is ready for pickup${hasNotificationValue(detail.pickup_time) ? ` at ${detail.pickup_time}` : ''}.`
      : detail.delivery_type === 'delivery'
        ? 'Your order is confirmed and will be delivered soon.'
        : `Your order is confirmed and will be ready${hasNotificationValue(detail.pickup_time) ? ` by ${detail.pickup_time}` : ' soon'}.`
    : notification.message

  const primaryFacts = detail ? [
    ['Order No', detail.order_reference || '-'],
    ['Method', deliveryLabel],
    ['Order Date', detail.order_date || '-'],
    ['Ready Time', readyTimeLabel],
  ] : []

  const fullDetailRows = detail ? [
    ['Bill No', detail.bill_number || 'Not generated yet'],
    ['Status', statusLabel],
    ['Type', humanizeNotificationValue(detail.order_kind || detail.order_type)],
    ['Address / Note', detail.delivery_address || '-'],
    ['Phone', detail.phone_number || '-'],
    ['Email', detail.student_email || '-'],
    ['Delivery Fee', formatNotificationAmount(fee)],
    ['Food Total', detail.subtotal_amount !== '' ? formatNotificationAmount(subtotalAmount) : '-'],
  ] : []

  if (detail?.total_amount !== '') {
    fullDetailRows.push(['Total Amount', formatNotificationAmount(totalAmount)])
  }

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

        <div className="sd-notif-summary">
          <div className="sd-notif-summary-copy">
            <span className="sd-notif-status-badge">{statusLabel}</span>
            <h3 className="sd-notif-summary-title">
              {itemTitle}
              {quantityValue > 1 ? ` x${quantityValue}` : ''}
            </h3>
            <p className="sd-notif-summary-text">{summaryMessage}</p>
          </div>
          {detail?.total_amount !== '' && (
            <div className="sd-notif-total">
              <span className="sd-notif-total-label">Total</span>
              <strong className="sd-notif-total-value">{formatNotificationAmount(totalAmount)}</strong>
            </div>
          )}
        </div>

        {detail && (
          <>
            <div className="sd-notif-meta-strip">
              <span className="sd-notif-chip">{deliveryLabel}</span>
              {quantityValue > 0 && (
                <span className="sd-notif-chip">
                  {quantityValue} item{quantityValue === 1 ? '' : 's'}
                </span>
              )}
              <span className="sd-notif-chip">{readyTimeLabel}</span>
            </div>

            <div className="sd-notif-section">
              <div className="sd-notif-section-title">Order summary</div>
              <div className="sd-notif-fact-list">
                {primaryFacts.map(([label, value]) => (
                  <div key={label} className="sd-notif-fact">
                    <span className="sd-notif-fact-label">{label}</span>
                    <strong className="sd-notif-fact-value">{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {sessionLines.length > 0 && (
              <div className="sd-notif-section sd-notif-lines-card">
                <div className="sd-notif-section-title">Order items</div>
                <div className="sd-notif-lines-list">
                  {sessionLines.map((line, index) => (
                    <div key={`${line.id || line.label}-${index}`} className="sd-notif-line">
                      <div>
                        <strong>{line.label}</strong>
                        <span>{line.kind}</span>
                      </div>
                      <em>x{line.quantity || 0}</em>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="sd-notif-section">
              <button
                type="button"
                className="sd-notif-toggle"
                onClick={() => setShowFullDetails((prev) => !prev)}
              >
                {showFullDetails ? 'Hide full details' : 'View full details'}
              </button>

              {showFullDetails && (
                <div className="sd-notif-secondary-list">
                  {fullDetailRows.map(([label, value]) => (
                    <div key={label} className="sd-notif-fact">
                      <span className="sd-notif-fact-label">{label}</span>
                      <strong className="sd-notif-fact-value">{value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
  const cartDraftStorageKey = useMemo(() => getStudentCartDraftStorageKey(user), [user])
  const initialCartDraft = useMemo(() => readStudentCartDraft(cartDraftStorageKey), [cartDraftStorageKey])
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
  const [showMobileSharedCart, setShowMobileSharedCart] = useState(false)
  const [notificationConfirm, setNotificationConfirm] = useState(null)

  useBodyScrollLock(showMobileSidebar || showMobileSharedCart)

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
  const { data: studentMenuItems = [] } = useApi(getStudentItems)
  const orderSessionCount = useMemo(() => {
    const keys = new Set()
    orders.forEach((o) => keys.add(o.session_id || `single-${o.id}`))
    return keys.size
  }, [orders])

  const [weeklyPlan, setWeeklyPlan] = useState({})
  const [mobileMenuCartVisible, setMobileMenuCartVisible] = useState(false)
  const [savedSelectedDate, setSavedSelectedDate] = useState(() => initialCartDraft.selectedDate || toInputDate(new Date()))
  const [savedPackageCart, setSavedPackageCart] = useState(() => initialCartDraft.packageCart || {})
  const [pendingPackageOrder, setPendingPackageOrder] = useState(() => initialCartDraft.pendingPackageOrder ?? null)
  const [menuCart, setMenuCart] = useState(() => initialCartDraft.menuCart || {})
  const [cartDraftSyncToken, setCartDraftSyncToken] = useState(0)
  const [pendingEmbeddedCheckoutMode, setPendingEmbeddedCheckoutMode] = useState(null)
  const [embeddedCheckoutRequestToken, setEmbeddedCheckoutRequestToken] = useState(0)
  const [sharedCartSnapshot, setSharedCartSnapshot] = useState({
    selectedDateLabel: '',
    summaryPackageEntries: [],
    summaryMenuEntries: [],
    summaryTotal: 0,
    cartError: '',
    hasSummaryItems: false,
  })
  const [activeOrderShortcut, setActiveOrderShortcut] = useState('all')
  const menuExtrasRef = useRef(null)
  const sharedCartActionRef = useRef(null)
  const pendingPackageCount = normalizePackagePayloads(pendingPackageOrder).length
  const isMenuShortcutActive = activeOrderShortcut !== 'all' && activeOrderShortcut !== 'meal-packages'
  const mealPackagesPanelOrder = isMenuShortcutActive ? 2 : 1
  const menuItemsPanelOrder = isMenuShortcutActive ? 1 : 2
  const orderShortcuts = useMemo(() => {
    const menuSections = buildStudentMenuSections(studentMenuItems, 'all', '')
    return [
      ...BASE_ORDER_SHORTCUTS,
      ...menuSections.map((section) => ({
        key: section.key,
        label: section.label,
      })),
    ]
  }, [studentMenuItems])
  const handleSharedCartSnapshotChange = useCallback((nextSnapshot) => {
    setSharedCartSnapshot((prevSnapshot) => (
      areSharedCartSnapshotsEqual(prevSnapshot, nextSnapshot) ? prevSnapshot : nextSnapshot
    ))
  }, [])
  const handlePackageDraftStateChange = useCallback(({ selectedDate, packageCart }) => {
    setSavedSelectedDate((prev) => (prev === selectedDate ? prev : selectedDate))
    setSavedPackageCart((prev) => {
      const prevSerialized = JSON.stringify(prev || {})
      const nextSerialized = JSON.stringify(packageCart || {})
      return prevSerialized === nextSerialized ? prev : (packageCart || {})
    })
  }, [])
  const sharedCartItemCount = useMemo(() => (
    (sharedCartSnapshot.summaryPackageEntries || []).reduce((sum, entry) => sum + Number(entry.quantity || entry.qty || 0), 0)
    + (sharedCartSnapshot.summaryMenuEntries || []).reduce((sum, entry) => sum + Number(entry.qty || 0), 0)
  ), [sharedCartSnapshot.summaryMenuEntries, sharedCartSnapshot.summaryPackageEntries])
  const showMobileSharedCartBar = activeTab === 'packages'
    && sharedCartSnapshot.hasSummaryItems
    && !showMobileSidebar
    && !showMobileSharedCart

  const selectTab = useCallback((key) => {
    setActiveTab(key)
    setShowMobileSidebar(false)
    setShowMobileSharedCart(false)
    if (key !== 'packages') setMobileMenuCartVisible(false)
  }, [])

  useEffect(() => {
    if (sharedCartSnapshot.hasSummaryItems || !showMobileSharedCart) return
    setShowMobileSharedCart(false)
  }, [sharedCartSnapshot.hasSummaryItems, showMobileSharedCart])

  useEffect(() => {
    const nextDraft = readStudentCartDraft(cartDraftStorageKey)
    setSavedSelectedDate(nextDraft.selectedDate || toInputDate(new Date()))
    setSavedPackageCart(nextDraft.packageCart || {})
    setPendingPackageOrder(nextDraft.pendingPackageOrder ?? null)
    setMenuCart(nextDraft.menuCart || {})
    setCartDraftSyncToken((prev) => prev + 1)
  }, [cartDraftStorageKey])

  useEffect(() => {
    if (activeOrderShortcut === 'all' || activeOrderShortcut === 'meal-packages') return
    if (orderShortcuts.some((shortcut) => shortcut.key === activeOrderShortcut)) return
    setActiveOrderShortcut('all')
  }, [activeOrderShortcut, orderShortcuts])

  useEffect(() => {
    const hasPackageCart = Object.values(savedPackageCart || {}).some((entry) => Number(entry?.quantity || entry?.qty || 0) > 0)
    const hasPendingPackages = normalizePackagePayloads(pendingPackageOrder).length > 0
    const hasMenuCart = Object.values(menuCart || {}).some((entry) => Number(entry?.qty || 0) > 0)

    if (!hasPackageCart && !hasPendingPackages && !hasMenuCart) {
      removeStudentCartDraft(cartDraftStorageKey)
      return
    }

    writeStudentCartDraft(cartDraftStorageKey, {
      selectedDate: savedSelectedDate,
      packageCart: savedPackageCart,
      pendingPackageOrder,
      menuCart,
    })
  }, [cartDraftStorageKey, menuCart, pendingPackageOrder, savedPackageCart, savedSelectedDate])

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
    removeStudentCartDraft(cartDraftStorageKey)
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
          </div>
        </div>
      </div>

      <div className="sd-user">
        <div className="sd-avatar">
          {user?.username?.[0]?.toUpperCase() || 'S'}
        </div>
        <div>
          <div className="sd-username">{user?.username}</div>
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
              {key === 'packages' && pendingPackageCount > 0 && (
                <span className="sd-nav-badge" style={{ background: '#3D6B38', marginLeft: 'auto' }}>
                  Active
                </span>
              )}
              {key === 'history' && orderSessionCount > 0 && pendingPackageCount === 0 && (
                <span className="sd-nav-badge" style={{ marginLeft: 'auto' }}>
                  {orderSessionCount}
                </span>
              )}
              {key === 'history' && orderSessionCount > 0 && pendingPackageCount > 0 && (
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
    const packagePayloads = normalizePackagePayloads(payload)
    if (addMenuItems) {
      const hasQueuedMenuItems = Object.values(menuCart || {}).some((entry) => Number(entry?.qty || 0) > 0)
      if (hasQueuedMenuItems && !isMenuItemOrderOpen()) {
        showToast(MENU_ITEM_ORDER_HOURS_MESSAGE, 'error')
        return false
      }
      setPendingPackageOrder(packagePayloads)
      setActiveOrderShortcut('all')
      selectTab('packages')
      return true
    } else {
      try {
        const { data: createdOrders = [] } = await placeMealOrdersBatch(packagePayloads)
        const firstCreatedOrder = Array.isArray(createdOrders) ? createdOrders[0] : null
        const packageReadyText = getPackageReadyTextFromPayloads(packagePayloads, mealTypes)
        refetchOrders()
        setOrderSuccess({
          title: 'Order Placed Successfully',
          message: `Your meal package order has been sent to Cafe Lush. ${packageReadyText}`,
          method: packagePayloads[0]?.delivery_type,
          deliveryAddress: packagePayloads[0]?.delivery_type === 'delivery' ? packagePayloads[0]?.delivery_address : '',
          pickupDetails: packagePayloads[0]?.delivery_type === 'takeaway' ? packagePayloads[0]?.delivery_address : '',
          phoneNumber: packagePayloads[0]?.phone_number,
          deliveryFeeLabel: packagePayloads[0]?.delivery_type === 'delivery'
            ? formatDeliveryFeeLabel(firstCreatedOrder?.delivery_fee, 'Free')
            : '',
          lines: getPackageSummaryLines(packagePayloads, mealTypes),
        })
        return true
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to place order.', 'error')
        return false
      }
    }
  }

  useEffect(() => {
    if (activeTab !== 'packages' || pendingPackageCount === 0) return
    const timer = setTimeout(() => {
      menuExtrasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(timer)
  }, [activeTab, pendingPackageCount])

  useEffect(() => {
    if (!pendingEmbeddedCheckoutMode) return
    if (pendingEmbeddedCheckoutMode === 'wait-for-package' && pendingPackageCount === 0) return

    menuExtrasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setEmbeddedCheckoutRequestToken((prev) => prev + 1)
    setPendingEmbeddedCheckoutMode(null)
  }, [pendingEmbeddedCheckoutMode, pendingPackageCount])

  const menuItemsPanel = (
    <div ref={menuExtrasRef}>
      <MenuItemsPanel
        refetchOrders={refetchOrders}
        pendingPackageOrder={pendingPackageOrder}
        onPendingPackageOrderChange={setPendingPackageOrder}
        onPackageOrderSent={() => setPendingPackageOrder(null)}
        showToast={showToast}
        onOrderSuccess={setOrderSuccess}
        mealTypes={mealTypes}
        weeklyPlan={weeklyPlan}
        onFloatingCartBarChange={setMobileMenuCartVisible}
        embedded
        headerTitle="Add Menu Items"
        headerSubtitle={pendingPackageCount > 0
          ? 'All admin-added categories and menu items are shown below. Add any extras to the same shared cart.'
          : ''}
        sharedCart={menuCart}
        onSharedCartChange={setMenuCart}
        embeddedCheckoutRequestToken={embeddedCheckoutRequestToken}
        activeShortcut={activeOrderShortcut}
        suppressEmbeddedMobileCart
      />
    </div>
  )

  const mealPackagesPanel = (
    <MealPackagesViewerPanel
      mealTypes={mealTypes}
      loadingTypes={loadingTypes}
      onPackageReady={handlePackageReady}
      weeklyPlan={weeklyPlan}
      onOpenMenu={() => menuExtrasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      onContinuePendingOrder={({ waitForPendingPackage = false } = {}) => {
        setActiveOrderShortcut('all')
        setPendingEmbeddedCheckoutMode(waitForPendingPackage ? 'wait-for-package' : 'open-now')
      }}
      hasPendingPackageOrder={pendingPackageCount > 0}
      pendingPackageOrder={pendingPackageOrder}
      sharedMenuCart={menuCart}
      onSharedMenuCartChange={setMenuCart}
      onPendingPackageOrderChange={setPendingPackageOrder}
      onSharedCartSnapshotChange={handleSharedCartSnapshotChange}
      sharedCartActionRef={sharedCartActionRef}
      initialSelectedDate={savedSelectedDate}
      initialPackageCart={savedPackageCart}
      draftSyncToken={cartDraftSyncToken}
      onDraftStateChange={handlePackageDraftStateChange}
    />
  )

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
      <nav className={`sd-bottom-nav${mobileMenuCartVisible || showMobileSidebar || showMobileSharedCartBar || showMobileSharedCart ? ' sd-bottom-nav-hidden' : ''}`}>
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
              {key === 'packages' && pendingPackageCount > 0 && (
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

      {showMobileSharedCartBar && (
        <button type="button" className="sd-mobile-cart-bar" onClick={() => setShowMobileSharedCart(true)}>
          <span className="sd-mobile-cart-bar-main">
            <span className="sd-mobile-cart-bar-title">
              <ShoppingCart size={16} strokeWidth={2.2} />
              Your Cart {sharedCartItemCount > 0 ? `(${sharedCartItemCount})` : ''}
            </span>
            <span className="sd-mobile-cart-bar-total">LKR {Number(sharedCartSnapshot.summaryTotal || 0).toFixed(2)}</span>
          </span>
          <span className="sd-mobile-cart-bar-cta">View Cart</span>
        </button>
      )}

      {showMobileSharedCart && createPortal(
        <div className="sd-mobile-cart-overlay" onClick={() => setShowMobileSharedCart(false)}>
          <div className="sd-mobile-cart-sheet" onClick={(e) => e.stopPropagation()}>
            <SharedOrderCartSidebar
              snapshot={sharedCartSnapshot}
              actionsRef={sharedCartActionRef}
              mobile
              onClose={() => setShowMobileSharedCart(false)}
            />
          </div>
        </div>,
        document.body
      )}

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
            <div className="sd-topbar-copy">
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
          <div className="sd-topbar-actions">
            <div className="sd-topbar-welcome">
              Welcome back, <strong>{user?.username}</strong>
            </div>

            {/* Notification icon */}
            <div className="sd-topbar-action-shell">
              <button className="sd-topbar-icon-btn" onClick={handleOpenNotifs} aria-label="Open notifications">
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
                              className={`sd-notif-item ${card.tone} ${n.is_read ? 'read' : 'unread'}`}
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
            <div className="sd-topbar-action-shell">
              <button className="sd-topbar-icon-btn" onClick={() => setShowProfile((p) => !p)} aria-label="Open profile menu">
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
            <div className="sd-unified-order-shell">
              <div className="sd-unified-order-main">
                <div className="sd-order-shortcuts" aria-label="Meal ordering categories">
                  {orderShortcuts.map((shortcut) => (
                    <button
                      key={shortcut.key}
                      type="button"
                      className={`sd-order-shortcut-chip${activeOrderShortcut === shortcut.key ? ' active' : ''}`}
                      onClick={() => setActiveOrderShortcut(shortcut.key)}
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>

                <div className="sd-unified-order-flow">
                  <div style={{ order: mealPackagesPanelOrder }}>
                    {mealPackagesPanel}
                  </div>
                  <div style={{ order: menuItemsPanelOrder }}>
                    {menuItemsPanel}
                  </div>
                </div>
              </div>
              <aside className="sd-unified-order-sidebar">
                <SharedOrderCartSidebar snapshot={sharedCartSnapshot} actionsRef={sharedCartActionRef} />
              </aside>
            </div>
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


