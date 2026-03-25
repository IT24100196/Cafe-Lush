import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChefHat,
  CalendarClock,
  PartyPopper,
  Sunrise,
  MoonStar,
  UtensilsCrossed,
  Package,
  PhoneCall,
  Facebook,
  Instagram,
  MessageCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import { getFeaturedItems } from '../api/endpoints'
import AutoScrollGallery from '../components/FoodGallery'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Menu', href: '#menu' },
  { label: 'Events', href: '#events' },
  { label: 'About', href: '#about' },
]

const FEATURES = [
  {
    icon: ChefHat,
    title: 'Fresh Daily Meals',
    desc: 'Breakfast & dinner prepared fresh every single day using quality local ingredients.',
  },
  {
    icon: CalendarClock,
    title: 'Easy Pre-ordering',
    desc: 'Order your meals in advance through our portal — stress-free and convenient.',
  },
  {
    icon: PartyPopper,
    title: 'Event Excellence',
    desc: 'Weddings, parties, and corporate events handled with precision and elegance.',
  },
]

const PACKAGES = [
  {
    icon: Sunrise,
    title: 'Breakfast Package',
    desc: 'Start your day right with a freshly prepared breakfast. Includes a full Sri Lankan or continental spread.',
    badge: 'Order before 8:00 PM previous day',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    icon: MoonStar,
    title: 'Dinner Package',
    desc: 'End your day with a satisfying dinner crafted by our experienced kitchen team.',
    badge: 'Order before 12:00 PM same day',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
]

const EVENT_HIGHLIGHTS = [
  {
    icon: UtensilsCrossed,
    text: 'Custom food menus tailored to your event size, theme, and guest dietary preferences',
  },
  {
    icon: Package,
    text: 'Bulk orders accepted for weddings, parties, corporate lunches, and private gatherings',
  },
  {
    icon: PhoneCall,
    text: 'Contact us in advance to discuss your menu, quantity, and delivery or pickup options',
  },
]

const STATS = [
  { value: '500+', label: 'Students Served' },
  { value: '100+', label: 'Events Catered' },
  { value: '2', label: 'Partner Hotels' },
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brown/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16 lg:h-20">
        <button onClick={() => scrollTo('home')} className="flex items-center gap-2 text-left">
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
          <div className="leading-tight">
            <p className="font-playfair font-bold text-gold text-lg leading-none">Cafe Lush</p>
            <p className="text-cream/60 text-xs font-inter">Fine Dining & Events</p>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => scrollTo(href.slice(1))}
              className="px-4 py-2 text-sm font-inter font-medium text-cream/80 hover:text-gold transition-colors rounded-lg hover:bg-white/5"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center px-5 py-2 rounded-full bg-gold text-brown font-inter font-semibold text-sm hover:bg-gold-light transition-colors shadow-md"
          >
            Order Now
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-cream hover:text-gold transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 space-y-1">
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-brown/98 backdrop-blur-md border-t border-gold/20 px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => {
                scrollTo(href.slice(1))
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 text-cream/80 hover:text-gold hover:bg-white/5 rounded-lg font-inter text-sm transition-colors"
            >
              {label}
            </button>
          ))}
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="block mt-2 text-center px-5 py-3 rounded-full bg-gold text-brown font-inter font-semibold text-sm hover:bg-gold-light transition-colors"
          >
            Order Now
          </Link>
        </div>
      )}
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/image/image4.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          filter: 'brightness(1.3)',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 100%)' }} />

      <div className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="font-inter text-gold text-sm font-medium tracking-[0.3em] uppercase mb-4" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
          Welcome to Cafe Lush
        </p>
        <h1 className="font-playfair font-black text-cream text-4xl sm:text-5xl lg:text-7xl leading-tight mb-6" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          Experience Fine Dining
          <br />
          <span className="text-gold">&amp; Memorable Events</span>
        </h1>
        <p className="font-inter text-cream/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
          Fresh meals, seamless ordering, and world-class event management — all in the heart of Jaffna.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-4 rounded-full bg-gold text-brown font-inter font-bold text-base hover:bg-gold-light transition-all shadow-lg hover:shadow-gold/30 hover:-translate-y-0.5"
          >
            Order Your Meal
          </Link>
          <button
            onClick={() => scrollTo('events')}
            className="px-8 py-4 rounded-full border-2 border-gold/60 text-gold font-inter font-bold text-base hover:bg-gold/10 transition-all hover:-translate-y-0.5"
          >
            Order Food for Your Event
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/40">
        <span className="font-inter text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/40 to-transparent animate-pulse" />
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="bg-cream py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-inter text-gold text-sm font-medium tracking-[0.25em] uppercase mb-3">Why Choose Us</p>
          <h2 className="font-playfair font-bold text-brown text-3xl sm:text-4xl">The Cafe Lush Difference</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon, title, desc }) => {
            const FeatureIcon = icon
            return (
            <div
              key={title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-cream-dark hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-gold/20 transition-colors">
                <FeatureIcon className="w-8 h-8 text-gold" strokeWidth={2.2} />
              </div>
              <h3 className="font-playfair font-bold text-brown text-xl mb-3">{title}</h3>
              <p className="font-inter text-brown/60 text-sm leading-relaxed">{desc}</p>
            </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Meal Packages ─────────────────────────────────────────────────────────────
function MealPackages() {
  return (
    <section id="packages" className="bg-cream-dark py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-inter text-gold text-sm font-medium tracking-[0.25em] uppercase mb-3">Daily Offerings</p>
          <h2 className="font-playfair font-bold text-brown text-3xl sm:text-4xl">Our Meal Packages</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {PACKAGES.map(({ icon, title, desc, badge, badgeColor }) => {
            const PackageIcon = icon
            return (
            <div key={title} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-cream-dark hover:shadow-xl transition-all duration-300 group">
              <div className="h-1.5 bg-gradient-to-r from-gold to-gold-light" />
              <div className="p-8">
                <div className="mb-5">
                  <PackageIcon className="w-12 h-12 text-gold" strokeWidth={2.2} />
                </div>
                <h3 className="font-playfair font-bold text-brown text-2xl mb-3">{title}</h3>
                <p className="font-inter text-brown/60 text-sm leading-relaxed mb-5">{desc}</p>
                <span className={`inline-block text-xs font-inter font-semibold px-3 py-1.5 rounded-full mb-6 ${badgeColor}`}>
                  ⏰ {badge}
                </span>
                <div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brown text-gold font-inter font-semibold text-sm hover:bg-brown-light transition-colors group-hover:bg-gold group-hover:text-brown"
                  >
                    Order Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            )
          })}
        </div>

        <p className="text-center font-inter text-brown/50 text-sm">
          🔒 Login required to place orders — <Link to="/login" className="text-gold hover:underline font-medium">Sign in here</Link>
        </p>
      </div>
    </section>
  )
}

const PAST_EVENTS = [
  { type: 'Wedding', name: 'Krishnan & Thivya Wedding', guests: 320, date: 'March 2024', location: 'Jaffna Town Hall' },
  { type: 'Corporate', name: 'Jaffna District Chamber Annual Dinner', guests: 180, date: 'November 2023', location: 'Jetwing Jaffna' },
  { type: 'Birthday', name: "Sureka's 50th Birthday Celebration", guests: 95, date: 'August 2023', location: 'Private Residence, Nallur' },
  { type: 'School Event', name: 'Thirunalveli MV Prize Giving', guests: 450, date: 'January 2024', location: 'Thirunalveli, Jaffna' },
  { type: 'Private Dinner', name: 'Rajasingham Family Reunion', guests: 60, date: 'December 2023', location: 'Palaly Road, Jaffna' },
  { type: 'Wedding', name: 'Arjun & Nithya Reception', guests: 280, date: 'February 2024', location: 'Nallur Cultural Hall' },
]

const EVENT_TYPE_COLORS = {
  Wedding: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Corporate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Birthday: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'School Event': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Private Dinner': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

// ── Events ────────────────────────────────────────────────────────────────────
function Events() {
  const [showDetails, setShowDetails] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setModalVisible(showDetails), showDetails ? 10 : 0)
    return () => clearTimeout(t)
  }, [showDetails])

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', showDetails)
    return () => document.body.classList.remove('overflow-hidden')
  }, [showDetails])

  return (
    <section id="events" className="bg-brown py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#C9A84C12,_transparent_70%)]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <p className="font-inter text-gold text-sm font-medium tracking-[0.25em] uppercase mb-4">Food for Your Events</p>
        <h2 className="font-playfair font-black text-cream text-3xl sm:text-5xl mb-4 leading-tight">
          We Feed Your Event
          <br />
          You Enjoy the Moment
        </h2>
        <p className="font-inter text-cream/50 text-base mb-14 tracking-wide">
          Weddings &nbsp;•&nbsp; Corporate Events &nbsp;•&nbsp; Birthday Parties &nbsp;•&nbsp; Private Dinners &nbsp;•&nbsp; Bulk Food Orders Welcome
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {EVENT_HIGHLIGHTS.map(({ icon, text }) => {
            const EventIcon = icon
            return (
              <div key={text} className="bg-white/5 border border-gold/20 rounded-2xl p-7 hover:bg-white/10 hover:border-gold/40 transition-all duration-300">
                <div className="mb-4 flex justify-center">
                  <EventIcon className="w-10 h-10 text-gold" strokeWidth={2.2} />
                </div>
                <p className="font-inter text-cream/80 text-sm leading-relaxed">{text}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setShowDetails(true)}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gold text-brown font-inter font-bold text-base hover:bg-gold-light transition-all shadow-lg hover:shadow-gold/30 hover:-translate-y-0.5"
        >
          Details <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {showDetails && (
        <div
          className="font-inter backdrop-blur-sm"
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowDetails(false)}
        >
          <div
            className={`relative bg-brown rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gold/20 transition-all duration-300 ${modalVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gold/20">
              <div>
                <h3 className="font-playfair font-bold text-gold text-xl">Event Catering Services</h3>
                <p className="text-cream/50 text-sm mt-1">Shantha Enterprice — Jaffna, Sri Lanka</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-cream/60 hover:text-cream transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-7">
              <div className="space-y-3">
                <p className="font-playfair font-bold text-gold text-lg">Your event. Our food. Unforgettable.</p>
                <p className="font-inter text-cream/70 text-sm leading-relaxed">
                  From intimate family dinners to grand weddings — we deliver fresh, flavourful Sri Lankan cuisine straight to your venue.
                  Custom menus, bulk orders, veg &amp; non-veg options. We handle the food, you enjoy the moment.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Weddings', 'Corporate Events', 'Birthdays', 'School Events', 'Private Dinners'].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/25">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-gold/20 rounded-xl p-5 space-y-3">
                <p className="font-semibold text-cream text-sm uppercase tracking-widest mb-3">Get in Touch</p>
                <a
                  href="https://wa.me/94767228485"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-gold/70 shrink-0" strokeWidth={2} />
                  WhatsApp: 076 722 8485
                </a>
                <a
                  href="mailto:shanthaenterprise2026@gmail.com"
                  className="flex items-center gap-3 text-sm text-cream/60 hover:text-gold transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-gold/70 shrink-0" strokeWidth={2} />
                  shanthaenterprise2026@gmail.com
                </a>
                <div className="flex items-start gap-3 text-sm text-cream/60">
                  <MapPin className="w-4 h-4 text-gold/70 shrink-0 mt-0.5" strokeWidth={2} />
                  No 173, Palaly Road, Thirunalveli, Jaffna
                </div>
              </div>

              <div>
                <p className="font-semibold text-cream text-sm uppercase tracking-widest mb-4">Events We've Catered</p>
                <div className="space-y-3">
                  {PAST_EVENTS.map((ev) => {
                    const colorClass = EVENT_TYPE_COLORS[ev.type] || 'bg-gold/20 text-gold border-gold/30'
                    return (
                      <div key={ev.name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3">
                        <div className="min-w-0">
                          <p className="font-inter font-semibold text-cream text-sm truncate">{ev.name}</p>
                          <p className="font-inter text-cream/40 text-xs mt-0.5">{ev.location} · {ev.date}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-inter text-xs text-cream/50">{ev.guests} guests</span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorClass}`}>
                            {ev.type}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <a
                href="https://wa.me/94767228485?text=Hello%20Cafe%20Lush!%20I%20would%20like%20to%20inquire%20about%20food%20catering%20for%20my%20event."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gold text-brown font-inter font-bold text-sm hover:bg-gold-light transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ── Menu Section ─────────────────────────────────────────────────────────────
function MenuSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedItems()
      .then((res) => setItems(res.data.map((fi) => ({ ...fi.item, position: fi.position }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="menu" className="bg-cream py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-inter text-gold text-sm font-medium tracking-[0.25em] uppercase mb-3">Our Menu</p>
          <h2 className="font-playfair font-bold text-brown text-3xl sm:text-4xl mb-4">Fresh Food, Every Day</h2>
          <p className="font-inter text-brown/50 text-base max-w-2xl mx-auto">Explore what we prepare daily — order through the portal or call us for event catering.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {loading && (
          <div className="text-center py-16">
            <p className="font-inter text-brown/40">Loading menu…</p>
          </div>
        )}

        {!loading && (
          <>
            <AutoScrollGallery items={items} />
            <div className="text-center mt-8">
              <p className="font-inter text-brown/40 text-sm">
                🔒 Login to place an order · <Link to="/login" className="text-gold hover:underline font-medium">Sign in here</Link> · Call us for event catering.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" className="bg-cream py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-inter text-gold text-sm font-medium tracking-[0.25em] uppercase mb-4">Our Story</p>
            <h2 className="font-playfair font-bold text-brown text-3xl sm:text-4xl mb-6 leading-tight">
              Born in Jaffna,
              <br />
              Built on Good Food
            </h2>
            <p className="font-inter text-brown/65 text-base leading-relaxed mb-5">
              Cafe Lush started with one simple belief — that good food should be clean, fresh, and affordable for everyone. From our kitchen in Jaffna, we prepare every meal with care, using quality ingredients and keeping our prices honest so that students, families, and working people can eat well without worry.
            </p>
            <p className="font-inter text-brown/65 text-base leading-relaxed mb-10">
              We are proud to serve the Jaffna community and beyond. Whether it's a daily student meal, a shop snack, or a food order for your next event — every plate that leaves our kitchen carries our commitment to taste, hygiene, and value.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center bg-white rounded-2xl p-5 shadow-sm border border-cream-dark">
                  <p className="font-playfair font-black text-gold text-3xl">{value}</p>
                  <p className="font-inter text-brown/60 text-xs mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-3 h-96">
              <div className="row-span-2 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&q=80"
                  alt="Cafe Lush food"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80"
                  alt="Cafe Lush dish"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"
                  alt="Cafe Lush meal"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-center">
              <div className="bg-gold rounded-2xl px-5 py-3 shadow-xl">
                <p className="font-playfair font-bold text-brown text-sm">Fresh · Clean · Affordable</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-brown-dark text-cream/70 font-inter">
      <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <img
              src="/image/image6.jpeg"
              alt="Cafe Lush logo"
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
              <p className="font-playfair font-bold text-gold text-lg leading-none">Cafe Lush</p>
              <p className="text-cream/40 text-xs">Fine Dining & Events</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-cream/50">
            Bringing warmth, flavour, and elegance to every meal and event in Jaffna, Sri Lanka.
          </p>
        </div>

        {/* Contact */}
        <div>
          <p className="font-semibold text-cream text-sm uppercase tracking-widest mb-5">Contact Us</p>
          <ul className="space-y-3">
            <li>
              <a
                href="tel:+94767228485"
                className="flex items-center gap-2.5 text-sm text-cream/50 hover:text-gold transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0 text-gold/70" strokeWidth={2} />
                076 722 8485
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/94767228485"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-cream/50 hover:text-gold transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-gold/70" strokeWidth={2} />
                076 722 8485
              </a>
            </li>
            <li>
              <a
                href="mailto:shanthaenterprise2026@gmail.com"
                className="flex items-center gap-2.5 text-sm text-cream/50 hover:text-gold transition-colors break-all"
              >
                <Mail className="w-4 h-4 shrink-0 text-gold/70" strokeWidth={2} />
                shanthaenterprise2026@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-cream/50">
              <MapPin className="w-4 h-4 shrink-0 text-gold/70 mt-0.5" strokeWidth={2} />
              No 173, Palaly Road, Thirunalveli, Jaffna
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <p className="font-semibold text-cream text-sm uppercase tracking-widest mb-5">Follow Us</p>
          <div className="flex flex-col gap-3 mb-6">
            <a
              href="https://www.facebook.com/ShanthaEnterprice"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-cream/50 hover:text-gold transition-colors group"
            >
              <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                <Facebook className="w-4 h-4" strokeWidth={2} />
              </span>
              Shantha Enterprice
            </a>
            <a
              href="https://www.instagram.com/ShanthaEnterprice"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-cream/50 hover:text-gold transition-colors group"
            >
              <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                <Instagram className="w-4 h-4" strokeWidth={2} />
              </span>
              Shantha Enterprice
            </a>
          </div>

        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/30">
          <p>© 2025 AxionSoft. All rights reserved. | Privacy Policy | Terms of Use</p>
          <p>Jaffna, Sri Lanka 🇱🇰</p>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PublicLandingPage() {
  return (
    <div className="font-inter scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <MealPackages />
      <MenuSection />
      <Events />
      <About />
      <Footer />
    </div>
  )
}