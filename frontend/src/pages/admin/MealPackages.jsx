import { useState, useEffect, useCallback } from 'react'
import { Sun, MoonStar } from 'lucide-react'
import { getWeeklyMealPlan, updateMealSlot, getItems } from '../../api/endpoints'
import { Spinner, PageHeader, Modal } from '../../components/UI'

const DAYS = [
  { key: 0, short: 'Mon', full: 'Monday',    special: false },
  { key: 1, short: 'Tue', full: 'Tuesday',   special: false },
  { key: 2, short: 'Wed', full: 'Wednesday', special: false },
  { key: 3, short: 'Thu', full: 'Thursday',  special: false },
  { key: 4, short: 'Fri', full: 'Friday',    special: false },
  { key: 5, short: 'Sat', full: 'Saturday',  special: true  },
  { key: 6, short: 'Sun', full: 'Sunday',    special: true  },
]

const SLOTS = [
  { meal_time: 'breakfast', meal_category: 'veg',    label: 'Veg Breakfast',     short: 'Veg B',     icon: Sun,     color: '#059669', price: 200 },
  { meal_time: 'breakfast', meal_category: 'nonveg', label: 'Non-Veg Breakfast', short: 'Non-Veg B', icon: Sun,     color: '#dc2626', price: 200 },
  { meal_time: 'dinner',    meal_category: 'veg',    label: 'Veg Dinner',        short: 'Veg D',     icon: MoonStar, color: '#1D4ED8', price: 200 },
  { meal_time: 'dinner',    meal_category: 'nonveg', label: 'Non-Veg Dinner',    short: 'Non-Veg D', icon: MoonStar, color: '#7C3AED', price: 400 },
]

// Shared Sat+Sun lunch package (stored under day 5 in DB)
const WEEKEND_LUNCH = { meal_time: 'lunch', meal_category: 'nonveg', label: 'Sat/Sun Special Lunch (Non-Veg)', short: 'Special Lunch', icon: Sun, color: '#EA580C', price: 300 }

const DAY_HEAD_COLORS = {
  0: '#1C2B1A',
  1: '#1C2B1A',
  2: '#1C2B1A',
  3: '#1C2B1A',
  4: '#1C2B1A',
  5: 'linear-gradient(135deg, #7a4f00, #c9a84c)',
  6: 'linear-gradient(135deg, #4a2000, #c9a84c)',
}

export default function MealPackages() {
  const [plan,        setPlan]        = useState({})
  const [allItems,    setAllItems]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editingSlot, setEditingSlot] = useState(null)
  const [editDishes,  setEditDishes]  = useState([])
  const [editPrice,   setEditPrice]   = useState(0)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [itemSearch,  setItemSearch]  = useState('')

  const fetchPlan = useCallback(async () => {
    try {
      const res = await getWeeklyMealPlan()
      const obj = {}
      res.data.forEach(slot => {
        obj[`${slot.day_of_week}_${slot.meal_time}_${slot.meal_category}`] = slot
      })
      setPlan(obj)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    Promise.all([
      fetchPlan(),
      getItems().then(res => setAllItems(res.data)).catch(() => { /* ignore */ }),
    ]).finally(() => setLoading(false))
  }, [fetchPlan])

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleOpenEdit(slot) {
    setEditingSlot(slot)
    setEditDishes([...slot.dishes])
    setEditPrice(slot.price)
    setItemSearch('')
    setError('')
    setSuccess('')
  }

  function handleAddDish() {
    setEditDishes(prev => [...prev, ''])
  }

  function handleDishChange(index, value) {
    setEditDishes(prev => prev.map((d, i) => i === index ? value : d))
  }

  function handleRemoveDish(index) {
    if (editDishes.length <= 1) return
    setEditDishes(prev => prev.filter((_, i) => i !== index))
  }

  function handleSelectItem(item) {
    if (editDishes.includes(item.name)) {
      setError('This item is already in the list.')
      return
    }
    setEditDishes(prev => [...prev, item.name])
  }

  async function handleSaveSlot() {
    if (!editingSlot?.id) { setError('Slot not loaded yet. Please refresh and try again.'); return }
    const filtered = editDishes.filter(d => d.trim() !== '')
    if (filtered.length < 1) { setError('At least one dish is required.'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateMealSlot(editingSlot.id, { dishes: filtered, price: editPrice })
      setSuccess('Slot updated successfully')
      await fetchPlan()
      setTimeout(() => setEditingSlot(null), 1200)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const dayFull = editingSlot ? (DAYS.find(d => d.key === editingSlot.day_of_week)?.full ?? '') : ''
  const slotDef = editingSlot?.slotDef ?? {}
  const filteredItems = allItems.filter(it =>
    it.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Meal Planner" subtitle="Mon–Fri: 4 packages · Sat–Sun: 5 packages (shared lunch) · 31 total" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="ad-stat-card">
          <p className="ad-stat-value">31</p>
          <p className="ad-stat-label">Total packages this week</p>
        </div>
        <div className="ad-stat-card">
          <p className="ad-stat-value" style={{ color: '#059669' }}>16</p>
          <p className="ad-stat-label">Veg packages</p>
        </div>
        <div className="ad-stat-card">
          <p className="ad-stat-value" style={{ color: '#dc2626' }}>16</p>
          <p className="ad-stat-label">Non-Veg packages</p>
        </div>
        <div className="ad-stat-card">
          <p className="ad-stat-value" style={{ color: '#c9a84c' }}>Rs.200 / 400</p>
          <p className="ad-stat-label">Fixed prices</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[...SLOTS, WEEKEND_LUNCH].map(slot => {
          const LegendIcon = slot.icon
          return (
          <div key={slot.label} className="flex items-center gap-2 text-sm font-inter">
            <LegendIcon size={14} strokeWidth={2.2} style={{ color: slot.color, flexShrink: 0 }} />
            <span className="text-brown/60">{slot.label} — Rs.{slot.price}</span>
          </div>
          )
        })}
      </div>

      {/* Weekly Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map(day => (
            <div
              key={day.key}
              className={`ad-card overflow-hidden${day.special ? ' border border-yellow-400/30' : ''}`}
            >
              {/* Day header */}
              <div
                className="px-3 py-2.5 flex items-center justify-between"
                style={{ background: DAY_HEAD_COLORS[day.key] }}
              >
                <span className="font-playfair font-bold text-white text-sm">{day.short}</span>
                {day.special && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400/30 text-yellow-400">
                    Special
                  </span>
                )}
              </div>

              {/* Slots */}
              {SLOTS.map((slot, si) => {
                const entry = plan[`${day.key}_${slot.meal_time}_${slot.meal_category}`] || { dishes: [], price: slot.price }
                return (
                  <div
                    key={slot.label}
                    className={`px-3 py-2.5${si < SLOTS.length - 1 ? ' border-b border-gray-200/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: slot.color }}>
                        {(() => { const SlotIcon = slot.icon; return <SlotIcon size={13} strokeWidth={2.2} /> })()}
                        {slot.short}
                      </span>
                      {entry.id ? (
                        <span
                          className="text-xs font-semibold cursor-pointer"
                          style={{ color: 'var(--lavender)' }}
                          onClick={() => handleOpenEdit({ ...entry, day_of_week: day.key, meal_time: slot.meal_time, meal_category: slot.meal_category, slotDef: slot })}
                        >
                          Edit
                        </span>
                      ) : (
                        <span className="text-xs text-brown/30 italic">loading…</span>
                      )}
                    </div>

                    {entry.dishes.map((dish, di) => (
                      <div key={di} className="flex items-center gap-1.5 text-xs text-brown/60 font-inter">
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: slot.color, flexShrink: 0 }} />
                        <span className="truncate">{dish}</span>
                      </div>
                    ))}

                    <div className="text-xs font-bold mt-1.5" style={{ color: '#C9A84C' }}>
                      Rs. {entry.price ?? slot.price}
                    </div>
                  </div>
                )
              })}

              {/* Weekend shared lunch slot (Sat & Sun both show the same day-5 record) */}
              {(day.key === 5 || day.key === 6) && (() => {
                const entry = plan[`5_${WEEKEND_LUNCH.meal_time}_${WEEKEND_LUNCH.meal_category}`] || { dishes: [], price: WEEKEND_LUNCH.price }
                return (
                  <div className="px-3 py-2.5 border-t border-yellow-400/30 bg-yellow-400/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: WEEKEND_LUNCH.color }}>
                        {(() => { const LunchIcon = WEEKEND_LUNCH.icon; return <LunchIcon size={13} strokeWidth={2.2} /> })()}
                        {WEEKEND_LUNCH.short}
                      </span>
                      {day.key === 5 ? (
                        entry.id ? (
                          <span
                            className="text-xs font-semibold cursor-pointer"
                            style={{ color: 'var(--lavender)' }}
                            onClick={() => handleOpenEdit({ ...entry, day_of_week: 5, meal_time: WEEKEND_LUNCH.meal_time, meal_category: WEEKEND_LUNCH.meal_category, slotDef: WEEKEND_LUNCH })}
                          >
                            Edit
                          </span>
                        ) : (
                          <span className="text-xs text-brown/30 italic">loading…</span>
                        )
                      ) : (
                        <span className="text-xs text-yellow-600/70 italic">shared</span>
                      )}
                    </div>

                    {entry.dishes.map((dish, di) => (
                      <div key={di} className="flex items-center gap-1.5 text-xs text-brown/60 font-inter">
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: WEEKEND_LUNCH.color, flexShrink: 0 }} />
                        <span className="truncate">{dish}</span>
                      </div>
                    ))}

                    <div className="text-xs font-bold mt-1.5" style={{ color: '#C9A84C' }}>
                      Rs. {entry.price ?? WEEKEND_LUNCH.price}
                    </div>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingSlot && (
        <Modal
          title={`${dayFull} — ${slotDef.label ?? ''}`}
          onClose={() => setEditingSlot(null)}
        >
          <div className="space-y-4">

            {/* Info banner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gold/10">
              {(() => { const ModalIcon = slotDef.icon; return ModalIcon ? <ModalIcon size={22} strokeWidth={2.2} style={{ color: slotDef.color, flexShrink: 0 }} /> : null })()}
              <div>
                <p className="font-semibold text-sm" style={{ color: '#C9A84C' }}>{slotDef.label}</p>
                <p className="text-xs text-brown/60">Fixed price: Rs. {slotDef.price}</p>
              </div>
            </div>

            {error   && <div className="ad-alert-error">{error}</div>}
            {success && <div className="ad-alert-success">{success}</div>}

            {/* Dishes */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brown/50 mb-2">Dishes</p>
              <div className="space-y-2">
                {editDishes.map((dish, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="ad-input flex-1"
                      value={dish}
                      onChange={e => handleDishChange(idx, e.target.value)}
                      placeholder="Dish name"
                    />
                    <button
                      className="ad-btn-secondary"
                      style={editDishes.length <= 1 ? { color: '#dc2626', opacity: 0.4 } : { color: '#dc2626' }}
                      onClick={() => handleRemoveDish(idx)}
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
              <button className="ad-btn-secondary mt-2 text-sm" onClick={handleAddDish}>
                + Add Dish
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-gray-200" />
              <span className="mx-3 text-xs text-brown/40">or pick from menu items</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Item picker */}
            <div>
              <input
                className="ad-input mb-2"
                placeholder="Search menu items…"
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto border border-lavender-pale rounded-xl divide-y divide-lavender-pale">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-lavender-pale transition-colors text-left"
                    onClick={() => handleSelectItem(item)}
                  >
                    <span className="text-sm text-brown">{item.name}</span>
                    <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>Rs. {item.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price field */}
            <div>
              <label className="ad-field-label">Price (Rs.)</label>
              <input
                className="ad-input"
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(Number(e.target.value))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                className="ad-btn-primary flex-1"
                onClick={handleSaveSlot}
                disabled={saving}
              >
                {saving ? <Spinner /> : 'Save Changes'}
              </button>
              <button className="ad-btn-secondary" onClick={() => setEditingSlot(null)}>
                Cancel
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}
