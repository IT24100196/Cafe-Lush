import { useEffect, useState } from 'react'

const AUTO_ROTATE_MS = 4200
const MAX_FEATURED_ITEMS = 5
const TRANSITION_MS = 950
const CARD_RADIUS = '2rem'

const CARD_POSITIONS = {
  '-2': {
    x: 'calc(-1 * clamp(220px, 32vw, 340px))',
    y: 28,
    rotate: -2,
    scale: 0.72,
    opacity: 0.08,
    zIndex: 5,
    shade: 'rgba(44, 26, 14, 0.82)',
    filter: 'blur(1px) saturate(0.55) brightness(0.42)',
  },
  '-1': {
    x: 'calc(-1 * clamp(150px, 21vw, 240px))',
    y: 18,
    rotate: -2,
    scale: 0.84,
    opacity: 0.34,
    zIndex: 15,
    shade: 'rgba(44, 26, 14, 0.60)',
    filter: 'saturate(0.68) brightness(0.58)',
  },
  '0': {
    x: '0px',
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    zIndex: 30,
    shade: 'rgba(44, 26, 14, 0.18)',
    filter: 'none',
  },
  '1': {
    x: 'clamp(150px, 21vw, 240px)',
    y: 18,
    rotate: 2,
    scale: 0.84,
    opacity: 0.34,
    zIndex: 15,
    shade: 'rgba(44, 26, 14, 0.60)',
    filter: 'saturate(0.68) brightness(0.58)',
  },
  '2': {
    x: 'clamp(220px, 32vw, 340px)',
    y: 28,
    rotate: 2,
    scale: 0.72,
    opacity: 0.08,
    zIndex: 5,
    shade: 'rgba(44, 26, 14, 0.82)',
    filter: 'blur(1px) saturate(0.55) brightness(0.42)',
  },
}

function formatPrice(price) {
  const numericPrice = Number(price)
  if (Number.isNaN(numericPrice)) return price
  return numericPrice.toFixed(2)
}

function getRelativeOffset(index, activeIndex, total) {
  let offset = index - activeIndex
  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total
  return offset
}

function getCardPresentation(relativeOffset, total) {
  if (total <= 1) return CARD_POSITIONS['0']
  return CARD_POSITIONS[String(relativeOffset)] || CARD_POSITIONS['2']
}

function shouldRenderCard(relativeOffset) {
  return Math.abs(relativeOffset) <= 1
}

function PlaceholderCard() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-cream-dark to-cream flex items-center justify-center">
      <span className="font-inter text-sm text-brown/45 uppercase tracking-[0.2em]">No image</span>
    </div>
  )
}

export default function AutoScrollGallery({ items = [] }) {
  const featuredItems = items.filter(Boolean).slice(0, MAX_FEATURED_ITEMS)
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [animationsReady, setAnimationsReady] = useState(false)

  useEffect(() => {
    if (activeIndex >= featuredItems.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, featuredItems.length])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAnimationsReady(true)
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (paused || featuredItems.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredItems.length)
    }, AUTO_ROTATE_MS)

    return () => window.clearInterval(intervalId)
  }, [paused, featuredItems.length])

  if (!featuredItems.length) return null

  return (
    <div className="w-full">
      <div
        className="relative mx-auto max-w-5xl h-[300px] sm:h-[360px] lg:h-[420px] overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="absolute inset-x-6 top-6 bottom-10 rounded-[2.25rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(255,255,255,0.72)_45%,_rgba(250,247,242,0.3)_100%)] shadow-[0_28px_70px_rgba(201,168,76,0.12)] pointer-events-none" />
        <div className="absolute inset-x-24 bottom-6 h-10 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        {featuredItems.map((item, index) => {
          const isActive = index === activeIndex
          const relativeOffset = getRelativeOffset(index, activeIndex, featuredItems.length)
          const presentation = getCardPresentation(relativeOffset, featuredItems.length)
          const renderAsCard = shouldRenderCard(relativeOffset)

          return (
            <article
              key={`${item.id ?? item.position ?? 'item'}-${index}`}
              className="absolute top-1/2 left-1/2 overflow-hidden rounded-[2rem] shadow-[0_28px_60px_rgba(44,26,14,0.18)] transition-[transform,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: 'clamp(220px, 48vw, 450px)',
                height: 'clamp(250px, 35vw, 350px)',
                zIndex: presentation.zIndex,
                opacity: presentation.opacity,
                transform: `translate(-50%, -50%) translateX(${presentation.x}) translateY(${presentation.y}px) rotate(${presentation.rotate}deg) scale(${presentation.scale})`,
                pointerEvents: isActive ? 'auto' : 'none',
                transitionDuration: animationsReady ? `${TRANSITION_MS}ms` : '0ms',
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                borderRadius: CARD_RADIUS,
                clipPath: `inset(0 round ${CARD_RADIUS})`,
                WebkitClipPath: `inset(0 round ${CARD_RADIUS})`,
                isolation: 'isolate',
                contain: 'paint',
              }}
            >
              {renderAsCard ? (
                <>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-[transform,filter] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        filter: presentation.filter,
                        transform: isActive ? 'scale(1.03)' : 'scale(1)',
                        transitionDuration: animationsReady ? `${TRANSITION_MS}ms` : '0ms',
                        willChange: 'transform, filter',
                        backfaceVisibility: 'hidden',
                        borderRadius: CARD_RADIUS,
                      }}
                    />
                  ) : (
                    <PlaceholderCard />
                  )}

                  <div
                    className="absolute inset-0 transition-[background,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      background: presentation.shade,
                      transitionDuration: animationsReady ? `${TRANSITION_MS}ms` : '0ms',
                      borderRadius: CARD_RADIUS,
                    }}
                  />

                  <div
                    className={`absolute inset-0 ${
                      isActive
                        ? 'bg-gradient-to-t from-brown/90 via-brown/28 to-transparent'
                        : 'bg-gradient-to-t from-brown/78 via-brown/40 to-brown/10'
                    }`}
                    style={{ borderRadius: CARD_RADIUS }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-brown/12 backdrop-blur-[1px]" style={{ borderRadius: CARD_RADIUS }} />
              )}

              {isActive && (
                <div className="absolute inset-x-2 bottom-2 z-10 rounded-[1rem] border border-white/12 bg-[linear-gradient(180deg,rgba(44,26,14,0.04),rgba(44,26,14,0.58))] px-3 py-2.5 text-cream backdrop-blur-sm shadow-[0_12px_24px_rgba(44,26,14,0.18)] sm:inset-x-4 sm:bottom-4 sm:rounded-[1.6rem] sm:bg-[linear-gradient(180deg,rgba(44,26,14,0.08),rgba(44,26,14,0.68))] sm:px-5 sm:py-4 sm:backdrop-blur-md sm:shadow-[0_18px_35px_rgba(44,26,14,0.24)]">
                  <p className="font-inter text-[8px] uppercase tracking-[0.18em] text-gold/90 sm:text-[10px] sm:tracking-[0.28em]">
                    {item.category_name || 'Featured Dish'}
                  </p>
                  <div className="mt-1.5 flex items-end justify-between gap-2 sm:mt-2 sm:flex-col sm:items-start sm:gap-2.5 md:flex-row md:items-end md:justify-between md:gap-4">
                    <h3
                      className="min-w-0 flex-1 font-playfair text-[1.15rem] font-bold leading-[0.92] drop-shadow-sm sm:text-3xl"
                      style={{
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                      }}
                    >
                      {item.name}
                    </h3>
                    <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-inter text-[10px] font-semibold text-cream sm:self-auto sm:px-4 sm:py-2 sm:text-sm">
                      Rs. {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {featuredItems.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {featuredItems.map((item, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={`${item.id ?? item.position ?? 'indicator'}-${index}`}
                type="button"
                aria-label={`Show ${item.name}`}
                onClick={() => setActiveIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  isActive ? 'w-10 h-1.5 bg-gold' : 'w-3 h-1.5 bg-brown/20 hover:bg-brown/35'
                }`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
