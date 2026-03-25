import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ── Inject CSS keyframe once ──────────────────────────────────────────────────
const STYLE_ID = 'auto-scroll-gallery-style'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes gallery-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .gallery-track {
      animation: gallery-scroll 30s linear infinite;
      will-change: transform;
    }
    .gallery-track.paused {
      animation-play-state: paused;
    }
  `
  document.head.appendChild(style)
}

// ── AutoScrollGallery ─────────────────────────────────────────────────────────
// Props:
//   items — array of featured item objects from getFeaturedItems() API
//           each item: { image_url, name, category_name }
export default function AutoScrollGallery({ items = [] }) {
  const trackRef = useRef(null)
  const [paused, setPaused] = useState(false)

  // Need at least 1 item to render
  if (!items.length) return null

  // Duplicate for seamless infinite loop
  const doubled = [...items, ...items]

  const nudge = (direction) => {
    const track = trackRef.current
    if (!track) return
    const cardW = track.firstChild?.offsetWidth ?? 300
    const gap = 16
    const shift = (cardW + gap) * direction
    const matrix = window.getComputedStyle(track).transform
    let currentX = 0
    if (matrix && matrix !== 'none') {
      currentX = parseFloat(matrix.split(',')[4]) || 0
    }
    track.style.animation = 'none'
    track.style.transform = `translateX(${currentX + shift}px)`
    track.style.transition = 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)'
    setTimeout(() => {
      if (track) {
        track.style.transition = 'none'
        track.style.transform  = ''
        track.style.animation  = ''
      }
    }, 480)
  }

  return (
    <div className="relative w-full">
      {/* Left fade edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #FAF7F2, transparent)' }}
      />
      {/* Right fade edge */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #FAF7F2, transparent)' }}
      />

      {/* Left arrow */}
      <button
        onClick={() => nudge(-1)}
        aria-label="Previous"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-200"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(201,168,76,0.3)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#C9A84C' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)' }}
      >
        <ChevronLeft className="w-5 h-5" style={{ color: '#2C1A0E' }} strokeWidth={2} />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => nudge(1)}
        aria-label="Next"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-200"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(201,168,76,0.3)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#C9A84C' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)' }}
      >
        <ChevronRight className="w-5 h-5" style={{ color: '#2C1A0E' }} strokeWidth={2} />
      </button>

      {/* Scrolling track */}
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className={`gallery-track flex${paused ? ' paused' : ''}`}
          style={{ gap: '0px' }}
        >
          {doubled.map((item, idx) => (
            <GalleryCard key={idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────────────────────
function GalleryCard({ item }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: 'clamp(220px, 22vw, 310px)',
        height: '240px',
      }}
    >
      {/* Shimmer while loading */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse" style={{ background: '#F0EAE0' }} />
      )}

      {/* Image */}
      <img
        src={item.image_url}
        alt={item.name}
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
