import { useEffect, useState } from 'react'
import { getItems, updateItem, getFeaturedItems, setFeaturedItem, removeFeaturedItem } from '../../api/endpoints'
import { Spinner, PageHeader } from '../../components/UI'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

const FEATURED_SLOT_COUNT = 5

export default function PublicPreview() {
  const [featuredItems, setFeaturedItems] = useState(Array(FEATURED_SLOT_COUNT).fill(null))
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showPicker, setShowPicker] = useState(null)
  const [pickerSearch, setPickerSearch] = useState('')

  useBodyScrollLock(showPicker !== null)

  async function fetchFeatured() {
    try {
      const res = await getFeaturedItems()
      const slots = Array(FEATURED_SLOT_COUNT).fill(null)
      res.data.forEach((featuredItem) => {
        if (featuredItem.position >= 1 && featuredItem.position <= FEATURED_SLOT_COUNT) {
          slots[featuredItem.position - 1] = featuredItem
        }
      })
      setFeaturedItems(slots)
    } catch {
      // Keep the previous featured slots if the refresh fails.
    }
  }

  useEffect(() => {
    Promise.all([
      fetchFeatured(),
      getItems()
        .then((res) => setAllItems(res.data))
        .catch(() => {
          // Keep the item picker empty if menu items cannot be loaded.
        }),
    ]).finally(() => setLoading(false))
  }, [])

  async function handleImageChange(position, file) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be smaller than 2MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG and WebP images are allowed')
      return
    }

    setUploadError('')
    setUploadSuccess('')
    setUploadingId(position)

    try {
      const featured = featuredItems[position - 1]
      const formData = new FormData()
      formData.append('image', file)
      await updateItem(featured.item.id, formData)
      setUploadSuccess(`Image updated for slot ${position}`)
      await fetchFeatured()
    } catch {
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setUploadingId(null)
    }
  }

  async function handleSetFeaturedItem(position, itemId) {
    setSaving(position)

    try {
      await setFeaturedItem(position, itemId)
      setUploadSuccess(`Slot ${position} updated`)
      await fetchFeatured()
      setShowPicker(null)
      setPickerSearch('')
    } catch {
      setUploadError('Failed to update slot.')
    } finally {
      setSaving(null)
    }
  }

  async function handleRemoveSlot(position) {
    if (!window.confirm('Remove this item from the featured slot?')) return

    try {
      await removeFeaturedItem(position)
      setUploadSuccess('Slot cleared')
      await fetchFeatured()
    } catch {
      setUploadError('Failed to remove slot.')
    }
  }

  const pickerFiltered = allItems.filter((item) =>
    item.name.toLowerCase().includes(pickerSearch.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Public Menu Preview" />

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-brown to-brown-light px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-playfair font-bold text-gold text-base">Featured Menu - 5 Slots</p>
          <p className="text-cream/50 text-sm mt-1">
            These 5 items appear on your public website. The home page rotates through them automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-cream/60 text-sm">Live on public page</span>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError('')} className="text-red-400 hover:text-red-600 font-bold text-lg">
            &times;
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center justify-between">
          <span>{uploadSuccess}</span>
          <button
            onClick={() => setUploadSuccess('')}
            className="text-emerald-400 hover:text-emerald-600 font-bold text-lg"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        {Array.from({ length: FEATURED_SLOT_COUNT }, (_, index) => index + 1).map((position) => {
          const featured = featuredItems[position - 1]
          const fileRef = { current: null }

          return (
            <div key={position} className="ad-card overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3 pb-0">
                <span className="text-xs font-bold text-brown/40 uppercase tracking-widest">Slot {position}</span>
                <div className={`w-2 h-2 rounded-full ${featured ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>

              {featured ? (
                <div className="relative h-48 overflow-hidden bg-cream-dark group">
                  {featured.item.image_url ? (
                    <img src={featured.item.image_url} alt={featured.item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="text-sm text-brown/35 font-inter uppercase tracking-[0.2em]">No image</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-brown/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3">
                    {uploadingId === position ? (
                      <>
                        <Spinner size="sm" />
                        <p className="text-cream text-xs font-inter">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-cream text-xs font-inter font-semibold transition-colors"
                        >
                          Change Image
                        </button>
                        <button
                          onClick={() => setShowPicker(position)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-cream text-xs font-inter font-semibold transition-colors"
                        >
                          Change Item
                        </button>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleImageChange(position, e.target.files[0])}
                  />
                </div>
              ) : (
                <div
                  className="h-48 bg-cream-dark flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-cream transition-colors"
                  onClick={() => setShowPicker(position)}
                >
                  <div className="w-12 h-12 rounded-full bg-brown/10 flex items-center justify-center text-2xl">+</div>
                  <p className="text-sm text-brown/30 font-inter">Click to add item</p>
                </div>
              )}

              {featured ? (
                <div className="p-4">
                  <p className="text-xs text-brown/40 font-inter uppercase tracking-wide mb-1">
                    {featured.item.category_name}
                  </p>
                  <p className="font-playfair font-bold text-brown text-sm leading-tight mb-1 truncate">
                    {featured.item.name}
                  </p>
                  <p className="font-inter font-bold text-gold text-sm">
                    Rs. {parseFloat(featured.item.price).toFixed(2)}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-dark">
                    <span
                      className={
                        featured.item.is_available
                          ? 'text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700'
                          : 'text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600'
                      }
                    >
                      {featured.item.is_available ? 'Live' : 'Hidden'}
                    </span>
                    <button
                      onClick={() => handleRemoveSlot(position)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-brown/30 font-inter">Empty slot - not shown on public page</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showPicker !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => {
            setShowPicker(null)
            setPickerSearch('')
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair font-bold text-brown text-lg">Select Item for Slot {showPicker}</h3>
              <button
                onClick={() => {
                  setShowPicker(null)
                  setPickerSearch('')
                }}
                className="w-8 h-8 rounded-full bg-cream-dark flex items-center justify-center text-brown/50 hover:text-brown transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            <input
              type="text"
              placeholder="Search items..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm font-inter text-brown placeholder-brown/30 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-4"
            />

            <div className="space-y-1">
              {pickerFiltered.map((item) => {
                const isActive = featuredItems[showPicker - 1]?.item?.id === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetFeaturedItem(showPicker, item.id)}
                    disabled={saving === showPicker}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-cream-dark ${
                      isActive ? 'border-l-4 border-gold bg-gold/5' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-dark flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-inter uppercase tracking-[0.18em] text-brown/35">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter font-semibold text-brown text-sm truncate">{item.name}</p>
                      <p className="text-xs text-brown/40 font-inter">{item.category_name}</p>
                    </div>
                    <span className="font-inter font-bold text-gold text-sm flex-shrink-0">
                      Rs. {parseFloat(item.price).toFixed(2)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gold/20 bg-cream p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-xs text-gold font-bold flex-shrink-0">
          i
        </div>
        <div>
          <p className="text-sm font-bold text-brown font-inter">How this works</p>
          <ul className="space-y-2 mt-2">
            {[
              'Changes you make here appear on the public website instantly - no page refresh needed by visitors.',
              'Use Change Item to swap which menu item appears in each slot.',
              'The public home page shows one item in front and rotates through all 5 slots automatically.',
              'Use Change Image to update the photo of the item currently in that slot - this also updates the image in Items Management.',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2 text-xs text-brown/60 font-inter">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
