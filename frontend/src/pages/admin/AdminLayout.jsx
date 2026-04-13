import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AdminDashboard.css'

const NAV = [
  { to: '/admin',                  label: 'Overview'         },
  { to: '/admin/items',            label: 'Items Management' },
  { to: '/admin/public-preview',   label: 'Public Preview'   },
  { to: '/admin/meal-packages',    label: 'Meal Packages'    },
  { to: '/admin/student-orders',   label: 'Student Orders'   },
  { to: '/admin/walk-in-orders',   label: 'Walk-in Orders'   },
  { to: '/admin/events',           label: 'Events'           },
  { to: '/admin/income-outcome',   label: 'Income & Outcome' },
  { to: '/admin/reports',          label: 'Monthly Report'   },
  { to: '/admin/suggestions',      label: 'Suggestions'      },
  { to: '/admin/users',            label: 'Student Management' },
  { to: '/admin/cashiers',         label: 'Staff Management' },
]

const navLinkClass = ({ isActive }) =>
  isActive ? 'ad-nav-item active' : 'ad-nav-item'

// ── Sidebar content — defined outside to avoid react-hooks/static-components ─
function SidebarContent({ user, onLogout, closeMobile }) {
  return (
    <div className="ad-sidebar-inner">

      {/* Logo + toggle */}
      <div className="ad-brand">
        <div className="ad-brand-logo">
          <img src="/image/image6.jpeg" alt="Shantha logo" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2.5px #C9A84C, 0 0 14px rgba(201,168,76,0.35)' }} />
          <div>
            <p className="ad-brand-name">Cafe Lush</p>
            <p className="ad-brand-sub">Admin Dashboard</p>
          </div>
        </div>

        {/* Close — mobile only */}
        {closeMobile && (
          <button onClick={closeMobile} className="lg:hidden text-cream/50 hover:text-gold text-xl leading-none">✕</button>
        )}
      </div>

      {/* User profile chip */}
      <div className="ad-user">
        <div className="ad-avatar">
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <div>
          <p className="ad-username">{user?.username || 'Admin'}</p>
          <p className="ad-userrole">Administrator</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="ad-nav">
        <div className="ad-nav-label">Main Menu</div>
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={closeMobile}
            className={navLinkClass}
          >
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="ad-sidebar-footer">
        <button onClick={onLogout} className="ad-logout-btn">
          Logout
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="ad-root">

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="ad-sidebar">
        <SidebarContent
          user={user}
          onLogout={handleLogout}
          closeMobile={null}
        />
      </aside>

      {/* ── Mobile overlay + drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(26, 26, 46, 0.6)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-60 bg-brown shadow-2xl border-r border-gold/20 lg:hidden flex flex-col">
            <SidebarContent
              user={user}
              onLogout={handleLogout}
              closeMobile={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="ad-main">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 shadow-md" style={{ background: 'var(--navy-dark)', borderBottom: '1px solid var(--border-soft)' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 transition-colors"
            style={{ color: 'rgba(155, 142, 196, 0.6)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--lavender)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(155, 142, 196, 0.6)'}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/image/image6.jpeg" alt="Shantha logo" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2.5px #C9A84C, 0 0 14px rgba(201,168,76,0.35)' }} />
          <p className="font-playfair font-bold text-gold text-base leading-none">Cafe Lush</p>
        </header>

        {/* Page content */}
        <main className="ad-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
