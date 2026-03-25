import { useState, useMemo, useRef } from 'react'
import {
  getItems,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
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

const EMPTY_CAT = { name: '' }
const EMPTY_ITEM = {
  item_id: '',
  name: '',
  price: '',
  category: '',
  is_available: true,
}

function FormError({ msg }) {
  return msg ? (
    <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
      {msg}
    </p>
  ) : null
}

function ImagePicker({ currentUrl, onChange }) {
  const inputRef = useRef()
  const [preview, setPreview] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onChange(file)
  }

  const displayed = preview || currentUrl

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current.click()}
        className="flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 transition-colors hover:border-sky-400"
      >
        {displayed ? (
          <img
            src={displayed}
            alt="preview"
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="text-center text-slate-400">
            <div className="mb-1 text-3xl">📷</div>
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

      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="btn-secondary w-full text-xs"
      >
        {displayed ? '🔄 Change Image' : '📷 Upload Image'}
      </button>

      {displayed && (
        <button
          type="button"
          onClick={() => {
            setPreview(null)
            onChange(null)
          }}
          className="text-xs text-red-500 transition-colors hover:text-red-600"
        >
          Remove image
        </button>
      )}
    </div>
  )
}

export default function ItemsManagement() {
  const {
    data: items = [],
    loading: loadingItems,
    refetch: refetchItems,
  } = useApi(getItems)

  const {
    data: categories = [],
    loading: loadingCats,
    refetch: refetchCategories,
  } = useApi(getCategories)

  const [tab, setTab] = useState('categories')

  const [catModal, setCatModal] = useState(false)
  const [catForm, setCatForm] = useState(EMPTY_CAT)
  const [catEditId, setCatEditId] = useState(null)
  const [catDeleteId, setCatDeleteId] = useState(null)
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState('')

  const [itemModal, setItemModal] = useState(false)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [itemImage, setItemImage] = useState(null)
  const [itemEditId, setItemEditId] = useState(null)
  const [itemEditImg, setItemEditImg] = useState(null)
  const [itemDeleteId, setItemDeleteId] = useState(null)
  const [itemSaving, setItemSaving] = useState(false)
  const [itemError, setItemError] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const loading = loadingItems || loadingCats

  const groupedItems = useMemo(() => {
    const filtered =
      filterCat === 'all'
        ? items
        : items.filter((i) => i.category === Number(filterCat))

    return categories
      .map((cat) => ({
        cat,
        items: filtered.filter((i) => i.category === cat.id),
      }))
      .filter((g) => g.items.length > 0)
  }, [items, categories, filterCat])

  const openAddCat = () => {
    setCatForm(EMPTY_CAT)
    setCatEditId(null)
    setCatError('')
    setCatModal(true)
  }

  const openEditCat = (c) => {
    setCatForm({ name: c.name })
    setCatEditId(c.id)
    setCatError('')
    setCatModal(true)
  }

  const handleSaveCat = async (e) => {
    e.preventDefault()
    setCatSaving(true)
    setCatError('')

    try {
      if (catEditId) await updateCategory(catEditId, catForm)
      else await createCategory(catForm)

      setCatModal(false)
      refetchCategories()
      refetchItems()
    } catch (err) {
      setCatError(
        err.response?.data?.name?.[0] ||
          err.response?.data?.detail ||
          'Save failed.'
      )
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCat = async () => {
    try { await deleteCategory(catDeleteId) } catch {}
    setCatDeleteId(null)
    refetchCategories()
    refetchItems()
  }

  const openAddItem = (presetCatId = '') => {
    setItemForm({ ...EMPTY_ITEM, category: presetCatId, item_id: '' })
    setItemImage(null)
    setItemEditImg(null)
    setItemEditId(null)
    setItemError('')
    setItemModal(true)
  }

  const openEditItem = (item) => {
    setItemForm({
      item_id: item.item_id || '',
      name: item.name,
      price: item.price,
      category: item.category,
      is_available: item.is_available,
    })
    setItemImage(null)
    setItemEditImg(item.image_url || null)
    setItemEditId(item.id)
    setItemError('')
    setItemModal(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    setItemSaving(true)
    setItemError('')

    try {
      const fd = new FormData()
      if (itemForm.item_id) fd.append('item_id', itemForm.item_id)
      fd.append('name', itemForm.name)
      fd.append('price', itemForm.price)
      fd.append('category', itemForm.category)
      fd.append('is_available', itemForm.is_available)

      if (itemImage) fd.append('image', itemImage)
      else if (itemEditImg === null && itemEditId) fd.append('image', '')

      if (itemEditId) await updateItem(itemEditId, fd)
      else await createItem(fd)

      setItemModal(false)
      refetchItems()
    } catch (err) {
      const d = err.response?.data
      setItemError(
        d?.image?.[0] || d?.detail || (d ? JSON.stringify(d) : 'Save failed.')
      )
    } finally {
      setItemSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    try {
      await deleteItem(itemDeleteId)
    } catch {
      //
    }
    setItemDeleteId(null)
    refetchItems()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="🍽️ Menu Management" />

      <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--lavender-pale)', padding: '5px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', marginBottom: '24px' }}>
        {[
          { key: 'categories', label: 'Categories' },
          { key: 'items',      label: 'Menu Items' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={tab === key
              ? { background: 'var(--navy-dark)', color: 'var(--lavender)', borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Playfair Display', serif" }
              : { background: 'transparent', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {tab === 'categories' && (
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <span className="ad-stat-label">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Manage your menu categories</span>
                </div>
                <button onClick={openAddCat} className="ad-btn-primary">+ Add Category</button>
              </div>

              {categories.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white shadow-sm">
                  <EmptyState message="No categories yet. Create one to start adding menu items." />
                </div>
              ) : (
                <div className="ad-cat-grid">
                  {categories.map((cat) => {
                    const count = items.filter((i) => i.category === cat.id).length

                    return (
                      <div key={cat.id} className="ad-cat-card">
                        <div className="ad-cat-card-top">
                          <div className="ad-cat-card-icon">📁</div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="ad-cat-card-count">{count}</div>
                            <div className="ad-cat-card-count-label">items</div>
                          </div>
                        </div>
                        <div className="ad-cat-card-body">
                          <div className="ad-cat-card-name">{cat.name}</div>
                          <div className="ad-cat-card-footer">
                            <button className="ad-cat-btn-edit" onClick={() => openEditCat(cat)}>Edit</button>
                            <button className="ad-cat-btn-delete" onClick={() => setCatDeleteId(cat.id)}>Delete</button>
                            <button className="ad-cat-btn-view" onClick={() => { setTab('items'); setFilterCat(String(cat.id)) }}>View items →</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'items' && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCat('all')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      filterCat === 'all'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'border border-sky-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    All
                  </button>

                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFilterCat(String(c.id))}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        filterCat === String(c.id)
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-sky-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => openAddItem(filterCat !== 'all' ? filterCat : '')}
                  disabled={categories.length === 0}
                  className="ad-btn-primary whitespace-nowrap disabled:opacity-50"
                >
                  + Add Menu Item
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white py-10 text-center shadow-sm">
                  <p className="mb-3 text-sm text-slate-500">
                    Create a category first before adding menu items.
                  </p>
                  <button
                    onClick={() => setTab('categories')}
                    className="btn-primary text-sm"
                  >
                    Go to Categories →
                  </button>
                </div>
              ) : groupedItems.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white shadow-sm">
                  <EmptyState message="No items found. Add your first menu item." />
                </div>
              ) : (
                <div className="space-y-7">
                  {groupedItems.map(({ cat, items: catItems }) => (
                    <div key={cat.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📂</span>
                          <h3 className="font-bold text-slate-800">{cat.name}</h3>
                          <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs text-slate-500">
                            {catItems.length} item{catItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <button
                          onClick={() => openAddItem(String(cat.id))}
                          className="text-xs font-medium text-sky-600 transition-colors hover:text-sky-800 hover:underline"
                        >
                          + Add to {cat.name}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            className="ad-card"
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="flex items-center justify-center overflow-hidden" style={{ height: '140px', background: 'var(--lavender-pale)' }}>
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-4xl text-sky-300">🍽️</span>
                              )}
                            </div>

                            <div className="p-4">
                              <p className="text-sm font-semibold leading-tight text-slate-800">
                                {item.name}
                              </p>

                              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--gold)' }}>
                                ₱{parseFloat(item.price).toFixed(2)}
                              </p>

                              <div className="mt-3 flex items-center justify-between">
                                <Badge
                                  status={
                                    item.is_available ? 'confirmed' : 'cancelled'
                                  }
                                />

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditItem(item)}
                                    className="text-xs text-sky-600 transition-colors hover:text-sky-800 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setItemDeleteId(item.id)}
                                    className="text-xs text-red-500 transition-colors hover:text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {catModal && (
        <Modal
          title={catEditId ? 'Edit Category' : 'Add Category'}
          onClose={() => setCatModal(false)}
        >
          <FormError msg={catError} />

          <form onSubmit={handleSaveCat} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Category Name
              </label>
              <input
                className="input"
                placeholder="e.g. Main Course, Beverages…"
                value={catForm.name}
                onChange={(e) => setCatForm({ name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={catSaving}
                className="btn-primary flex flex-1 items-center justify-center gap-2"
              >
                {catSaving ? <Spinner size="sm" /> : null}
                Save Category
              </button>

              <button
                type="button"
                onClick={() => setCatModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {itemModal && (
        <Modal
          title={itemEditId ? 'Edit Menu Item' : 'Add Menu Item'}
          onClose={() => setItemModal(false)}
        >
          <FormError msg={itemError} />

          <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Item Image
              </label>
              <ImagePicker
                currentUrl={itemEditImg}
                onChange={(file) => {
                  setItemImage(file)
                  if (file === null) setItemEditImg(null)
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Category
              </label>
              <select
                className="input"
                value={itemForm.category}
                onChange={(e) =>
                  setItemForm({ ...itemForm, category: e.target.value })
                }
                required
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Item Name
              </label>
              <input
                className="input"
                placeholder="e.g. Grilled Chicken"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Item ID
              </label>
              <input
                className="input"
                placeholder="e.g. ITM-001"
                value={itemForm.item_id}
                onChange={(e) =>
                  setItemForm({ ...itemForm, item_id: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Price (₱)
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
              <input
                type="checkbox"
                id="avail"
                checked={itemForm.is_available}
                onChange={(e) =>
                  setItemForm({ ...itemForm, is_available: e.target.checked })
                }
                className="rounded border-sky-300 text-sky-500 focus:ring-sky-200"
              />
              <label htmlFor="avail" className="text-sm text-slate-600">
                Available for sale
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={itemSaving}
                className="btn-primary flex flex-1 items-center justify-center gap-2"
              >
                {itemSaving ? <Spinner size="sm" /> : null}
                Save Item
              </button>

              <button
                type="button"
                onClick={() => setItemModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {catDeleteId && (
        <ConfirmDialog
          message="Delete this category? All items inside it will also be deleted."
          onConfirm={handleDeleteCat}
          onCancel={() => setCatDeleteId(null)}
        />
      )}

      {itemDeleteId && (
        <ConfirmDialog
          message="Delete this menu item? This cannot be undone."
          onConfirm={handleDeleteItem}
          onCancel={() => setItemDeleteId(null)}
        />
      )}
    </div>
  )
}