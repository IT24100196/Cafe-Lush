import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, FolderOpen } from 'lucide-react'
import {
  getCatalogCategories,
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
  getMenuGroups,
  createMenuGroup,
  updateMenuGroup,
  deleteMenuGroup,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getItemVariants,
  createItemVariant,
  updateItemVariant,
  deleteItemVariant,
} from '../../api/endpoints'
import { useApi } from '../../hooks/useApi'
import {
  Spinner,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '../../components/UI'
import { isPositiveNumber } from '../../api/validation'

const EMPTY_CATEGORY = { name: '', is_active: true }
const EMPTY_GROUP = { category: '', name: '', description: '', is_active: true }
const EMPTY_ITEM = { menu_group: '', item_id: '', name: '', price: '', is_available: true }
const EMPTY_VARIANT = { item: '', name: '', price: '', is_active: true }

const variantOrder = {
  standard: 10,
  regular: 10,
  plain: 10,
  single: 10,
  small: 10,
  'with cheese': 20,
  double: 20,
  big: 20,
  'with ice': 20,
  'with nuts': 30,
  'with fruit/nuts': 30,
}

function FormError({ msg }) {
  return msg ? (
    <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
      {msg}
    </p>
  ) : null
}

function ImagePicker({ currentUrl, onChange, height = 140 }) {
  const inputRef = useRef()
  const [preview, setPreview] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview({
      sourceUrl: currentUrl || '',
      url: URL.createObjectURL(file),
    })
    onChange(file)
  }

  const displayed = preview?.sourceUrl === (currentUrl || '') ? preview.url : currentUrl

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 transition-colors hover:border-sky-400"
        style={{ height: `${height}px` }}
      >
        {displayed ? (
          <img src={displayed} alt="preview" className="h-full w-full rounded-2xl object-cover" />
        ) : (
          <div className="text-center text-slate-400">
            <div className="mb-1 text-3xl">IMG</div>
            <p className="text-xs">Click to upload image</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-secondary w-full text-xs"
        >
          {displayed ? 'Change Image' : 'Upload Image'}
        </button>
        {displayed && (
          <button
            type="button"
            onClick={() => {
              setPreview(null)
              onChange(null)
            }}
            className="rounded-xl border border-red-200 px-3 text-xs text-red-500 transition-colors hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-[#252443] text-white shadow-[0_10px_24px_rgba(37,36,67,0.28)]'
          : 'text-[#7d74ab] hover:bg-white/70 hover:text-[#2a2748]'
      }`}
    >
      {children}
    </button>
  )
}

function FolderCard({
  label,
  count,
  title,
  subtitle,
  isSelected = false,
  onPrimaryClick,
  onEdit,
  onDelete,
  primaryLabel,
}) {
  return (
    <article
      className={`flex h-full min-h-[158px] flex-col overflow-hidden rounded-[22px] border bg-white shadow-[0_10px_22px_rgba(38,37,66,0.10)] transition-all ${
        isSelected ? 'border-[#8f84d8] ring-2 ring-[#dcd4ff]' : 'border-[#ece6fb] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(38,37,66,0.14)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4 bg-[#292744] px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#38355d] shadow-inner shadow-white/10">
            <FolderOpen size={20} className="text-[#ffc44d]" />
          </div>
          {label && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
              {label}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[30px] font-bold leading-none text-[#cfaa51]">{count}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-white/40">Items</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between bg-white px-4 py-4">
        <button
          type="button"
          onClick={onPrimaryClick}
          className="block w-full flex-1 text-left"
        >
          <div className="line-clamp-2 text-[15px] font-bold leading-snug text-[#2a2748]">{title}</div>
          {subtitle && <div className="mt-2 line-clamp-1 text-[13px] text-[#8a84ae]">{subtitle}</div>}
        </button>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#efebf9] pt-3">
          <div className="flex items-center gap-4 text-[13px] font-semibold">
            <button type="button" onClick={onEdit} className="text-[#b8acd8] hover:text-[#4d4684]">Edit</button>
            <button type="button" onClick={onDelete} className="text-[#ef7474] hover:text-[#df4f4f]">Delete</button>
          </div>
          <button
            type="button"
            onClick={onPrimaryClick}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4d4684]"
          >
            {primaryLabel} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function buildItemCodeRange(items) {
  const codes = sortItemsByCode(items).map((item) => (item.item_id || '').trim()).filter(Boolean)
  if (!codes.length) return ''
  if (codes.length === 1) return codes[0]
  return `${codes[0]} - ${codes[codes.length - 1]}`
}

function parseItemCode(code) {
  const cleaned = String(code || '').trim().toUpperCase()
  if (!cleaned) {
    return { hasCode: false, number: Number.MAX_SAFE_INTEGER, suffix: '', raw: '' }
  }
  const match = cleaned.match(/^(\d+)(.*)$/)
  if (!match) {
    return { hasCode: true, number: Number.MAX_SAFE_INTEGER - 1, suffix: cleaned, raw: cleaned }
  }
  return {
    hasCode: true,
    number: Number.parseInt(match[1], 10),
    suffix: (match[2] || '').trim(),
    raw: cleaned,
  }
}

function compareItemCodes(aCode, bCode) {
  const a = parseItemCode(aCode)
  const b = parseItemCode(bCode)

  if (a.hasCode !== b.hasCode) return a.hasCode ? -1 : 1
  if (a.number !== b.number) return a.number - b.number

  const suffixCompare = a.suffix.localeCompare(b.suffix, undefined, { sensitivity: 'base', numeric: true })
  if (suffixCompare !== 0) return suffixCompare

  return a.raw.localeCompare(b.raw, undefined, { sensitivity: 'base', numeric: true })
}

function formatMoney(value) {
  return `Rs.${Number(value || 0).toFixed(2)}`
}

function sortItemsByCode(items) {
  return [...items].sort((a, b) => {
    const codeCompare = compareItemCodes(a.item_id, b.item_id)
    if (codeCompare !== 0) return codeCompare
    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  })
}

function sortVariants(list) {
  return [...list].sort((a, b) => {
    const aRank = variantOrder[(a.name || '').trim().toLowerCase()] ?? 999
    const bRank = variantOrder[(b.name || '').trim().toLowerCase()] ?? 999
    if (aRank !== bRank) return aRank - bRank
    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  })
}

function preventNumberScrollChange(e) {
  e.currentTarget.blur()
}

function getApiErrorMessage(data, fallback) {
  if (!data) return fallback
  return (
    data.detail ||
    data.non_field_errors?.[0] ||
    data.name?.[0] ||
    data.item_id?.[0] ||
    data.price?.[0] ||
    data.menu_group?.[0] ||
    data.image?.[0] ||
    fallback
  )
}

export default function ItemsManagement() {
  const {
    data: categories = [],
    loading: loadingCategories,
    refetch: refetchCategories,
  } = useApi(getCatalogCategories)
  const {
    data: menuGroups = [],
    loading: loadingGroups,
    refetch: refetchGroups,
  } = useApi(() => getMenuGroups())
  const {
    data: menuItems = [],
    loading: loadingItems,
    refetch: refetchItems,
  } = useApi(() => getMenuItems())
  const {
    data: variants = [],
    loading: loadingVariants,
    refetch: refetchVariants,
  } = useApi(() => getItemVariants())

  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [activeTab, setActiveTab] = useState('categories')
  const [groupViewCategoryId, setGroupViewCategoryId] = useState('')

  const [categoryModal, setCategoryModal] = useState(false)
  const [groupModal, setGroupModal] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [variantModal, setVariantModal] = useState(false)

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY)
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT)

  const [itemImage, setItemImage] = useState(null)
  const [itemImageUrl, setItemImageUrl] = useState(null)
  const [itemImageRemoved, setItemImageRemoved] = useState(false)

  const [categoryEditId, setCategoryEditId] = useState(null)
  const [groupEditId, setGroupEditId] = useState(null)
  const [itemEditId, setItemEditId] = useState(null)
  const [variantEditId, setVariantEditId] = useState(null)

  const [dialogState, setDialogState] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyToggleKey, setBusyToggleKey] = useState('')

  const loading = loadingCategories || loadingGroups || loadingItems || loadingVariants

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategoryId('')
      setGroupViewCategoryId('')
      return
    }
    if (!selectedCategoryId || !categories.some((category) => String(category.id) === String(selectedCategoryId))) {
      setSelectedCategoryId(String(categories[0].id))
    }
  }, [categories, selectedCategoryId])

  useEffect(() => {
    if (!groupViewCategoryId) return
    if (!categories.some((category) => String(category.id) === String(groupViewCategoryId))) {
      setGroupViewCategoryId('')
    }
  }, [categories, groupViewCategoryId])

  useEffect(() => {
    if (!menuGroups.length) {
      setSelectedGroupId('')
      return
    }
    if (selectedGroupId !== 'all' && menuGroups.some((group) => String(group.id) === String(selectedGroupId))) {
      return
    }
    setSelectedGroupId('all')
  }, [menuGroups, selectedGroupId])

  const itemModalVariants = useMemo(
    () => sortVariants(variants.filter((variant) => String(variant.item) === String(itemEditId))),
    [variants, itemEditId]
  )

  const selectedCategory = categories.find((category) => String(category.id) === String(selectedCategoryId))
  const selectedGroup = menuGroups.find((group) => String(group.id) === String(selectedGroupId))
  const editingItem = menuItems.find((item) => String(item.id) === String(itemEditId))
  const groupViewCategory = categories.find((category) => String(category.id) === String(groupViewCategoryId))

  const categoryStats = useMemo(() => {
    const stats = {}
    categories.forEach((category) => {
      const groups = menuGroups.filter((group) => String(group.category) === String(category.id))
      const groupIds = new Set(groups.map((group) => group.id))
      const items = menuItems.filter((item) => groupIds.has(item.menu_group))
      stats[category.id] = {
        groupCount: groups.length,
        itemCount: items.length,
        codeRange: buildItemCodeRange(items),
      }
    })
    return stats
  }, [categories, menuGroups, menuItems])

  const groupStats = useMemo(() => {
    const stats = {}
    menuGroups.forEach((group) => {
      const items = menuItems.filter((item) => String(item.menu_group) === String(group.id))
      stats[group.id] = {
        itemCount: items.length,
        codeRange: buildItemCodeRange(items),
        firstCode: sortItemsByCode(items)[0]?.item_id || '',
      }
    })
    return stats
  }, [menuGroups, menuItems])

  const sortedMenuGroups = useMemo(
    () => [...menuGroups].sort((a, b) => {
      const firstCodeCompare = compareItemCodes(groupStats[a.id]?.firstCode, groupStats[b.id]?.firstCode)
      if (firstCodeCompare !== 0) return firstCodeCompare
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true })
    }),
    [menuGroups, groupStats]
  )

  const sortedFilteredGroups = useMemo(
    () => sortedMenuGroups.filter((group) => String(group.category) === String(selectedCategoryId)),
    [sortedMenuGroups, selectedCategoryId]
  )

  const filteredItems = useMemo(() => {
    if (selectedGroupId === 'all') {
      return sortedMenuGroups.flatMap((group) =>
        sortItemsByCode(menuItems.filter((item) => String(item.menu_group) === String(group.id)))
      )
    }
    return sortItemsByCode(menuItems.filter((item) => String(item.menu_group) === String(selectedGroupId)))
  }, [menuItems, selectedGroupId, sortedMenuGroups])

  const refetchAll = async () => {
    await Promise.all([refetchCategories(), refetchGroups(), refetchItems(), refetchVariants()])
  }

  const closeCategoryModal = () => {
    setCategoryModal(false)
    setCategoryEditId(null)
    setCategoryForm(EMPTY_CATEGORY)
    setFormError('')
  }

  const closeGroupModal = () => {
    setGroupModal(false)
    setGroupEditId(null)
    setGroupForm(EMPTY_GROUP)
    setFormError('')
  }

  const closeVariantModal = () => {
    setVariantModal(false)
    setVariantEditId(null)
    setVariantForm(EMPTY_VARIANT)
    setFormError('')
  }

  const closeItemModal = () => {
    setItemModal(false)
    setItemEditId(null)
    setItemForm(EMPTY_ITEM)
    setItemImage(null)
    setItemImageUrl(null)
    setItemImageRemoved(false)
    closeVariantModal()
    setFormError('')
  }

  const openCategoryModal = (category = null) => {
    setFormError('')
    if (category) {
      setCategoryEditId(category.id)
      setCategoryForm({
        name: category.name,
        is_active: category.is_active,
      })
    } else {
      setCategoryEditId(null)
      setCategoryForm(EMPTY_CATEGORY)
    }
    setCategoryModal(true)
  }

  const openGroupModal = (group = null) => {
    setFormError('')
    if (group) {
      setGroupEditId(group.id)
      setGroupForm({
        category: group.category,
        name: group.name,
        description: group.description || '',
        is_active: group.is_active,
      })
    } else {
      setGroupEditId(null)
      setGroupForm({ ...EMPTY_GROUP, category: selectedCategoryId || '' })
    }
    setGroupModal(true)
  }

  const openItemModal = (item = null) => {
    setFormError('')
    closeVariantModal()
    if (item) {
      setItemEditId(item.id)
      setItemForm({
        menu_group: item.menu_group,
        item_id: item.item_id || '',
        name: item.name,
        price: item.price ?? '',
        is_available: item.is_available,
      })
      setItemImage(null)
      setItemImageUrl(item.image_url || null)
      setItemImageRemoved(false)
    } else {
      setItemEditId(null)
      setItemForm({ ...EMPTY_ITEM, menu_group: selectedGroupId && selectedGroupId !== 'all' ? selectedGroupId : '' })
      setItemImage(null)
      setItemImageUrl(null)
      setItemImageRemoved(false)
    }
    setItemModal(true)
  }

  const openVariantModal = (variant = null) => {
    if (!itemEditId) return
    setFormError('')
    if (variant) {
      setVariantEditId(variant.id)
      setVariantForm({
        item: variant.item,
        name: variant.name,
        price: variant.price,
        is_active: variant.is_active,
      })
    } else {
      setVariantEditId(null)
      setVariantForm({ ...EMPTY_VARIANT, item: itemEditId })
    }
    setVariantModal(true)
  }

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(String(categoryId))
    setActiveTab('categories')
  }

  const handleManageGroups = (categoryId) => {
    setSelectedCategoryId(String(categoryId))
    setGroupViewCategoryId(String(categoryId))
    setActiveTab('categories')
  }

  const handleBackToCategories = () => {
    setGroupViewCategoryId('')
  }

  const handleViewGroupItems = (group) => {
    setSelectedCategoryId(String(group.category))
    setSelectedGroupId(String(group.id))
    setActiveTab('menu-items')
  }

  const requestDeleteConfirmation = ({ kind, name, action }) => {
    setDialogState({
      title: `Delete ${kind}?`,
      message: `Delete "${name}"? This action cannot be undone from the admin catalog panel.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await action()
          setDialogState(null)
        } catch (err) {
          setDialogState(null)
          setActionError(err.response?.data?.detail || `Failed to delete ${kind}.`)
        }
      },
    })
  }

  const requestSaveConfirmation = ({ label, name, action }) => {
    setDialogState({
      title: `Save ${label} changes?`,
      message: `Save changes for "${name}"?`,
      confirmLabel: 'Save',
      onConfirm: async () => {
        try {
          await action()
          setDialogState(null)
        } catch (err) {
          setDialogState(null)
          setFormError(getApiErrorMessage(err.response?.data, `Failed to save ${label}.`))
        }
      },
    })
  }

  const performCategorySave = async (payload) => {
    if (categoryEditId) await updateCatalogCategory(categoryEditId, payload)
    else await createCatalogCategory(payload)
    await refetchAll()
    closeCategoryModal()
  }

  const performGroupSave = async (payload) => {
    if (groupEditId) await updateMenuGroup(groupEditId, payload)
    else await createMenuGroup(payload)
    await refetchAll()
    closeGroupModal()
  }

  const performItemSave = async (payload) => {
    const response = itemEditId
      ? await updateMenuItem(itemEditId, payload)
      : await createMenuItem(payload)

    await refetchAll()
    syncSavedItem(response?.data)
  }

  const performVariantSave = async (payload) => {
    if (variantEditId) await updateItemVariant(variantEditId, payload)
    else await createItemVariant(payload)
    await refetchAll()
    closeVariantModal()
  }

  const submitCategory = async (e) => {
    e.preventDefault()
    const payload = {
      name: categoryForm.name.trim(),
      is_active: categoryForm.is_active,
    }
    if (!payload.name) {
      setFormError('Category name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (categoryEditId) {
        requestSaveConfirmation({
          label: 'category',
          name: payload.name,
          action: () => performCategorySave(payload),
        })
      } else {
        await performCategorySave(payload)
      }
    } catch (err) {
      setFormError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to save category.')
    } finally {
      setSaving(false)
    }
  }

  const submitGroup = async (e) => {
    e.preventDefault()
    const payload = {
      category: Number(groupForm.category),
      name: groupForm.name.trim(),
      description: groupForm.description.trim(),
      is_active: groupForm.is_active,
    }
    if (!payload.category) {
      setFormError('Please select a category.')
      return
    }
    if (!payload.name) {
      setFormError('Menu group name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (groupEditId) {
        requestSaveConfirmation({
          label: 'menu group',
          name: payload.name,
          action: () => performGroupSave(payload),
        })
      } else {
        await performGroupSave(payload)
      }
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save menu group.')
    } finally {
      setSaving(false)
    }
  }

  const syncSavedItem = (savedItem) => {
    if (!savedItem) return
    setItemEditId(savedItem.id)
    setItemForm({
      menu_group: savedItem.menu_group,
      item_id: savedItem.item_id || '',
      name: savedItem.name || '',
      price: savedItem.price ?? '',
      is_available: savedItem.is_available,
    })
    setItemImage(null)
    setItemImageUrl(savedItem.image_url || null)
    setItemImageRemoved(false)
  }

  const submitItem = async (e) => {
    e.preventDefault()
    const price = Number(itemForm.price)
    if (!itemForm.menu_group) {
      setFormError('Please select a menu group.')
      return
    }
    if (!itemForm.item_id.trim()) {
      setFormError('Item code is required.')
      return
    }
    if (!itemForm.name.trim()) {
      setFormError('Item name is required.')
      return
    }
    if (!isPositiveNumber(price)) {
      setFormError('Base price must be greater than 0.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const basePayload = {
        menu_group: String(itemForm.menu_group),
        item_id: itemForm.item_id.trim(),
        name: itemForm.name.trim(),
        price: String(price),
        is_available: itemForm.is_available,
      }

      let payload = basePayload
      if (itemImage || (itemEditId && itemImageRemoved)) {
        payload = new FormData()
        Object.entries(basePayload).forEach(([key, value]) => {
          payload.append(key, typeof value === 'boolean' ? (value ? 'true' : 'false') : value)
        })
        if (itemImage) payload.append('image', itemImage)
        else payload.append('image', '')
      }

      if (itemEditId) {
        requestSaveConfirmation({
          label: 'item',
          name: itemForm.name.trim(),
          action: () => performItemSave(payload),
        })
      } else {
        await performItemSave(payload)
      }
    } catch (err) {
      const data = err.response?.data
      setFormError(getApiErrorMessage(data, 'Failed to save item.'))
    } finally {
      setSaving(false)
    }
  }

  const submitVariant = async (e) => {
    e.preventDefault()
    const price = Number(variantForm.price)
    const itemId = Number(variantForm.item || itemEditId)
    if (!itemId) {
      setFormError('Save the item first, then add variants.')
      return
    }
    if (!variantForm.name.trim()) {
      setFormError('Variant name is required.')
      return
    }
    if (!isPositiveNumber(price)) {
      setFormError('Variant price must be greater than 0.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        item: itemId,
        name: variantForm.name.trim(),
        price,
        is_active: variantForm.is_active,
      }
      if (variantEditId) {
        requestSaveConfirmation({
          label: 'variant',
          name: payload.name,
          action: () => performVariantSave(payload),
        })
      } else {
        await performVariantSave(payload)
      }
    } catch (err) {
      const data = err.response?.data
      setFormError(data?.name?.[0] || data?.price?.[0] || data?.detail || 'Failed to save variant.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (kind, row) => {
    setActionError('')
    setBusyToggleKey(`${kind}-${row.id}`)
    try {
      if (kind === 'category') {
        await updateCatalogCategory(row.id, { is_active: !row.is_active })
      } else if (kind === 'group') {
        await updateMenuGroup(row.id, { is_active: !row.is_active })
      } else if (kind === 'item') {
        await updateMenuItem(row.id, { is_available: !row.is_available })
      } else if (kind === 'variant') {
        await updateItemVariant(row.id, { is_active: !row.is_active })
      }
      await refetchAll()
    } catch (err) {
      setActionError(getApiErrorMessage(err.response?.data, `Failed to update ${kind} status.`))
    } finally {
      setBusyToggleKey('')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Menu Management"
        action={
          activeTab === 'categories' ? (
            groupViewCategoryId ? (
              <button onClick={() => openGroupModal()} disabled={!groupViewCategory} className="ad-btn-primary disabled:opacity-50">
                + Add Menu Group
              </button>
            ) : (
              <button onClick={() => openCategoryModal()} className="ad-btn-primary">
                + Add Category
              </button>
            )
          ) : (
            <button onClick={() => openItemModal()} disabled={!menuGroups.length} className="ad-btn-primary disabled:opacity-50">
              + Add Menu Item
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <FormError msg={actionError} />

          <section className="space-y-6 rounded-[32px] border border-[#e2dcfa] bg-[#f5f1ff] p-5 shadow-[0_16px_40px_rgba(44,36,92,0.08)] md:p-7">
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#8a84ae]">Manage your menu categories, menu groups, and menu items.</p>
              <div className="inline-flex rounded-[20px] bg-[#ede7ff] p-1.5 shadow-inner shadow-[#d7cdf8]">
                <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>Categories</TabButton>
                <TabButton active={activeTab === 'menu-items'} onClick={() => setActiveTab('menu-items')}>Menu Items</TabButton>
              </div>
            </div>

            {activeTab === 'categories' ? (
              <div className="space-y-8">
                {!groupViewCategoryId ? (
                  <section className="space-y-4">
                    <SectionHeader
                      title="Categories"
                      subtitle="Create, edit, delete, and open categories in the same card style."
                    />
                    {categories.length === 0 ? (
                      <EmptyState message="No catalog categories yet." />
                    ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {categories.map((category) => {
                          const stats = categoryStats[category.id] || { groupCount: 0, itemCount: 0, codeRange: '' }
                          return (
                            <FolderCard
                              key={category.id}
                              label="Category"
                              count={stats.itemCount}
                              title={category.name}
                              subtitle={`${stats.groupCount} groups${stats.codeRange ? ` (${stats.codeRange})` : ''}`}
                              isSelected={String(category.id) === String(selectedCategoryId)}
                              onPrimaryClick={() => handleManageGroups(category.id)}
                              onEdit={() => openCategoryModal(category)}
                              onDelete={() => requestDeleteConfirmation({
                                kind: 'category',
                                name: category.name,
                                action: async () => {
                                  await deleteCatalogCategory(category.id)
                                  await refetchAll()
                                },
                              })}
                              primaryLabel="Manage groups"
                            />
                          )
                        })}
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="space-y-4">
                    <SectionHeader
                      title={groupViewCategory ? `${groupViewCategory.name} Menu Groups` : 'Menu Groups'}
                      subtitle={groupViewCategory ? `Create, edit, delete, and open the menu groups inside ${groupViewCategory.name}.` : 'Select a category first.'}
                      action={
                        <div className="flex gap-3">
                          <button type="button" onClick={handleBackToCategories} className="btn-secondary">
                            Back
                          </button>
                          <button onClick={() => openGroupModal()} disabled={!groupViewCategory} className="ad-btn-primary disabled:opacity-50">
                            + Add Menu Group
                          </button>
                        </div>
                      }
                    />

                    {!groupViewCategory ? (
                      <EmptyState message="Select a category to manage its menu groups." />
                    ) : sortedFilteredGroups.length === 0 ? (
                      <EmptyState message="No menu groups in this category yet." />
                    ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {sortedFilteredGroups.map((group) => {
                          const stats = groupStats[group.id] || { itemCount: 0, codeRange: '' }
                          return (
                            <FolderCard
                              key={group.id}
                              label="Menu Group"
                              count={stats.itemCount}
                              title={`${group.name}${stats.codeRange ? ` (${stats.codeRange})` : ''}`}
                              subtitle={group.description || group.category_name}
                              isSelected={String(group.id) === String(selectedGroupId)}
                              onPrimaryClick={() => handleViewGroupItems(group)}
                              onEdit={() => openGroupModal(group)}
                              onDelete={() => requestDeleteConfirmation({
                                kind: 'group',
                                name: group.name,
                                action: async () => {
                                  await deleteMenuGroup(group.id)
                                  await refetchAll()
                                },
                              })}
                              primaryLabel="View items"
                            />
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}
              </div>
            ) : (
              <section className="space-y-5">
                <SectionHeader
                  title="Menu Items"
                  subtitle={
                    selectedGroup
                      ? `Showing the items inside ${selectedGroup.name}.`
                      : 'Showing all menu items across every menu group.'
                  }
                  action={
                    <button onClick={() => openItemModal()} disabled={!menuGroups.length} className="ad-btn-primary disabled:opacity-50">
                      + Add Menu Item
                    </button>
                  }
                />

                {!menuGroups.length ? (
                  <EmptyState message="Create a category and a menu group first." />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setSelectedGroupId('all')}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                          selectedGroupId === 'all'
                            ? 'border-[#2ca6e8] bg-[#2ca6e8] text-white shadow-[0_8px_20px_rgba(44,166,232,0.32)]'
                            : 'border-[#d8e7f3] bg-white text-[#7384a6] hover:border-[#9ecfeb] hover:text-[#2ca6e8]'
                        }`}
                      >
                        All
                      </button>
                      {sortedMenuGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(String(group.category))
                            setSelectedGroupId(String(group.id))
                          }}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                            String(selectedGroupId) === String(group.id)
                              ? 'border-[#2ca6e8] bg-[#2ca6e8] text-white shadow-[0_8px_20px_rgba(44,166,232,0.32)]'
                              : 'border-[#d8e7f3] bg-white text-[#7384a6] hover:border-[#9ecfeb] hover:text-[#2ca6e8]'
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>

                    {selectedGroup && (
                      <div className="flex flex-col gap-4 rounded-[24px] border border-white/70 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#262542] text-[#f6c357] shadow-[0_10px_24px_rgba(38,37,66,0.18)]">
                            <FolderOpen size={24} />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[#2a2748]">{selectedGroup.name}</div>
                            <div className="mt-1 text-sm text-[#8a84ae]">
                              {selectedGroup.category_name} / {(groupStats[selectedGroup.id]?.itemCount || 0)} items
                            </div>
                          </div>
                        </div>
                        <button onClick={() => openItemModal()} className="ad-btn-primary">
                          + Add to {selectedGroup.name}
                        </button>
                      </div>
                    )}

                    {filteredItems.length === 0 ? (
                      <EmptyState message={selectedGroup ? 'No items in this menu group yet.' : 'No menu items available yet.'} />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredItems.map((item) => {
                          const isEditingCurrent = itemModal && String(item.id) === String(itemEditId)
                          return (
                            <div
                              key={item.id}
                              className={`w-full overflow-hidden rounded-[18px] border transition-all ${
                                isEditingCurrent
                                  ? 'border-emerald-300 bg-emerald-50/40 shadow-md shadow-emerald-100/70'
                                  : 'border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => openItemModal(item)}
                                className="block w-full text-left"
                              >
                                <div className="relative overflow-hidden bg-slate-100" style={{ height: '110px' }}>
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="block h-[110px] w-full object-cover object-center"
                                    />
                                  ) : (
                                    <div className="flex h-[110px] items-center justify-center text-xs font-semibold text-slate-400">
                                      No Image
                                    </div>
                                  )}
                                  <div className="absolute right-2 top-2 scale-90">
                                    <Badge
                                      status={item.is_available ? 'available' : 'unavailable'}
                                      label={item.is_available ? 'Available' : 'Unavailable'}
                                    />
                                  </div>
                                </div>
                                <div className="bg-white px-4 pb-3 pt-3">
                                  <div className="mb-1 text-[13px] font-bold uppercase tracking-[0.16em] text-slate-500/80">
                                    {item.item_id}
                                  </div>
                                  <div className="truncate text-[14px] font-semibold text-slate-800">
                                    {item.name}
                                  </div>
                                  <div className="mt-1 text-[14px] font-bold text-amber-500">
                                    {formatMoney(item.price)}
                                  </div>
                                  <div className="pt-2 text-[12px] font-medium text-slate-500">
                                    {item.variant_count || 0} variants
                                  </div>
                                </div>
                              </button>
                              <div className="grid gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggle('item', item)}
                                  disabled={busyToggleKey === `item-${item.id}`}
                                  className="w-full rounded-full border border-sky-200 bg-white px-3 py-1 text-[12px] font-semibold text-sky-700"
                                >
                                  {busyToggleKey === `item-${item.id}` ? 'Saving...' : item.is_available ? 'Set Unavailable' : 'Set Available'}
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                  <button type="button" onClick={() => openItemModal(item)} className="w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-100">Edit</button>
                                  <button
                                    type="button"
                                    onClick={() => requestDeleteConfirmation({
                                      kind: 'item',
                                      name: item.name,
                                      action: async () => {
                                        await deleteMenuItem(item.id)
                                        if (String(itemEditId) === String(item.id)) closeItemModal()
                                        await refetchAll()
                                      },
                                    })}
                                    className="w-full rounded-full border border-red-200 bg-white px-3 py-1 text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </section>
        </>
      )}

      {categoryModal && (
        <Modal title={categoryEditId ? 'Edit Category' : 'Add Category'} onClose={closeCategoryModal}>
          <FormError msg={formError} />
          <form onSubmit={submitCategory} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Category Name</label>
              <input className="input" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} autoFocus />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />
              Active category
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-2">{saving ? <Spinner size="sm" /> : null}Save Category</button>
              <button type="button" onClick={closeCategoryModal} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {groupModal && (
        <Modal title={groupEditId ? 'Edit Menu Group' : 'Add Menu Group'} onClose={closeGroupModal}>
          <FormError msg={formError} />
          <form onSubmit={submitGroup} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Category</label>
              <select className="input" value={groupForm.category} onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}>
                <option value="">Select category...</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Menu Group Name</label>
              <input className="input" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
              <textarea className="input min-h-[96px]" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={groupForm.is_active} onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })} />
              Active menu group
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-2">{saving ? <Spinner size="sm" /> : null}Save Menu Group</button>
              <button type="button" onClick={closeGroupModal} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {itemModal && (
        <Modal
          title={itemEditId ? `Edit Item${editingItem ? ` - ${editingItem.name}` : ''}` : 'Add Item'}
          onClose={closeItemModal}
          maxWidthClass="max-w-3xl"
          maxWidth="980px"
        >
          <FormError msg={formError} />
          <form onSubmit={submitItem} className="space-y-5">
            <div className="grid items-start gap-5 md:grid-cols-[220px,1fr]">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Item Image</label>
                <ImagePicker
                  currentUrl={itemImageUrl}
                  height={160}
                  onChange={(file) => {
                    setItemImage(file)
                    if (file === null) {
                      setItemImageUrl(null)
                      setItemImageRemoved(true)
                    } else {
                      setItemImageRemoved(false)
                    }
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Menu Group</label>
                    <select className="input" value={itemForm.menu_group} onChange={(e) => setItemForm({ ...itemForm, menu_group: e.target.value })}>
                      <option value="">Select menu group...</option>
                      {sortedMenuGroups.map((group) => <option key={group.id} value={group.id}>{group.category_name} / {group.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Item Code</label>
                    <input className="input" value={itemForm.item_id} onChange={(e) => setItemForm({ ...itemForm, item_id: e.target.value })} placeholder="e.g. 001A" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Item Name</label>
                    <input className="input" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Vanilla" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Base Price (LKR)</label>
                    <input className="input" type="number" step="0.01" min="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} onWheel={preventNumberScrollChange} />
                  </div>
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-slate-600">
                  <input type="checkbox" checked={itemForm.is_available} onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })} />
                  Available for sale
                </label>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-2">{saving ? <Spinner size="sm" /> : null}{itemEditId ? 'Save Changes' : 'Save Item'}</button>
                  <button type="button" onClick={closeItemModal} className="btn-secondary flex-1">Close</button>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <SectionHeader
              title="Variants"
              subtitle={itemEditId ? 'Optional price choices like Single, Double, With Nuts, or With Ice.' : 'Save the item first, then manage its variants here.'}
              action={
                <button onClick={() => openVariantModal()} disabled={!itemEditId} className="ad-btn-primary disabled:opacity-50">
                  + Add Variant
                </button>
              }
            />

            {!itemEditId ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Base price is ready now. Once you save this item, you can add optional variants inside the same item window.
              </div>
            ) : itemModalVariants.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No variants yet for this item. Add one if this product needs optional prices like Single, Double, or With Nuts.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {itemModalVariants.map((variant) => (
                  <div key={variant.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-base font-semibold text-slate-800">{variant.name}</div>
                        <div className="mt-1 text-sm font-bold text-amber-500">{formatMoney(variant.price)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          status={variant.is_active ? 'available' : 'unavailable'}
                          label={variant.is_active ? 'Active' : 'Inactive'}
                        />
                        <button
                          type="button"
                          onClick={() => handleToggle('variant', variant)}
                          disabled={busyToggleKey === `variant-${variant.id}`}
                          className="rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700"
                        >
                          {busyToggleKey === `variant-${variant.id}` ? 'Saving...' : variant.is_active ? 'Set Inactive' : 'Set Active'}
                        </button>
                        <button type="button" onClick={() => openVariantModal(variant)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                        <button
                          type="button"
                          onClick={() => requestDeleteConfirmation({
                            kind: 'variant',
                            name: variant.name,
                            action: async () => {
                              await deleteItemVariant(variant.id)
                              await refetchAll()
                            },
                          })}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {variantModal && (
        <Modal
          title={variantEditId ? 'Edit Variant' : 'Add Variant'}
          onClose={closeVariantModal}
          maxWidthClass="max-w-lg"
          maxWidth="680px"
        >
          <FormError msg={formError} />
          <form onSubmit={submitVariant} className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Item: <span className="font-semibold text-slate-800">{editingItem?.name || 'Selected item'}</span>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Variant Name</label>
              <input className="input" value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} placeholder="e.g. Single, Double, With Nuts" autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Variant Price (LKR)</label>
              <input className="input" type="number" step="0.01" min="0.01" value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} onWheel={preventNumberScrollChange} />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={variantForm.is_active} onChange={(e) => setVariantForm({ ...variantForm, is_active: e.target.checked })} />
              Active variant
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-2">{saving ? <Spinner size="sm" /> : null}Save Variant</button>
              <button type="button" onClick={closeVariantModal} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {dialogState && (
        <ConfirmDialog
          title={dialogState.title}
          message={dialogState.message}
          confirmLabel={dialogState.confirmLabel}
          onConfirm={dialogState.onConfirm}
          onCancel={() => setDialogState(null)}
        />
      )}
    </div>
  )
}
