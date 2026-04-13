import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'
import {
  Clock, TrendingUp, Hourglass, CalendarDays,
  ShoppingBag, Timer, Building2,
  Plus, ClipboardList, PartyPopper, BarChart2, ChevronRight,
} from 'lucide-react'
import { getAdminOverview } from '../../api/endpoints'
import { Spinner } from '../../components/UI'

const ACTION_ICONS = { Plus, ClipboardList, PartyPopper, BarChart2 }

const ACTIONS = [
  { label: 'Add Item',        icon: 'Plus',          to: 'items'          },
  { label: 'New Order',       icon: 'ClipboardList', to: 'student-orders' },
  { label: 'Create Event',    icon: 'PartyPopper',   to: 'events'         },
  { label: 'Generate Report', icon: 'BarChart2',     to: 'reports'        },
]

const BAR_COLORS = [
  { barClass: 'bg-gold',        textClass: 'text-gold'        },
  { barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
  { barClass: 'bg-amber-500',   textClass: 'text-amber-600'   },
  { barClass: 'bg-violet-500',  textClass: 'text-violet-600'  },
]

const COLOR_STYLES = {
  gold:    { box: 'bg-gold/10',     icon: 'text-gold',        line: 'bg-gold'        },
  emerald: { box: 'bg-emerald-100', icon: 'text-emerald-600', line: 'bg-emerald-500' },
  amber:   { box: 'bg-amber-100',   icon: 'text-amber-600',   line: 'bg-amber-500'   },
  violet:  { box: 'bg-violet-100',  icon: 'text-violet-600',  line: 'bg-violet-500'  },
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`ad-card ${className}`}>
      <div className="ad-card-header">
        <h2 className="ad-card-title">{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function DashboardOverview() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminOverview()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Spinner /></div>
  }

  const stats = data ? [
    { label: 'Total Orders This Month', value: data.total_orders,                          color: 'gold',    icon: <Clock size={18} />      },
    { label: 'Revenue This Month',      value: `Rs.${parseFloat(data.month_revenue).toFixed(2)}`, color: 'emerald', icon: <TrendingUp size={18} /> },
    { label: 'Pending Orders',          value: data.pending_orders,                        color: 'amber',   icon: <Hourglass size={18} />  },
    { label: 'Active Events',           value: data.active_events,                         color: 'violet',  icon: <CalendarDays size={18} />},
  ] : []

  const summary = data ? [
    { label: 'New orders this month',   value: data.total_orders,   tag: 'This Month',  color: 'gold',    icon: <ShoppingBag size={18} /> },
    { label: 'Avg delivery time',     value: '~30 min',           tag: 'Estimated',   color: 'amber',   icon: <Timer size={18} />       },
    { label: 'Partner hotels active', value: data.partner_count,  tag: 'All online',  color: 'violet',  icon: <Building2 size={18} />   },
  ] : []

  return (
    <div className="space-y-6 font-inter">

      {/* Header */}
      <div className="ad-card ad-panel-anim" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 className="ad-topbar-title" style={{ fontSize: '22px' }}>Dashboard Overview</h1>
            <p className="ad-topbar-date" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Monitor orders, events, reports, and daily activity in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('student-orders')} className="ad-btn-secondary">
              <ClipboardList size={16} /> View Orders
            </button>
            <button onClick={() => navigate('reports')} className="ad-btn-primary">
              <BarChart2 size={16} /> Reports
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="ad-stats-grid">
        {stats.map(({ label, value, color, icon }) => {
          const c = COLOR_STYLES[color]
          return (
            <div key={label} className="ad-stat-card">
              <div className={`ad-stat-line ${c.line}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="ad-stat-label">{label}</p>
                  <p className="ad-stat-value">{value}</p>
                </div>
                <div className={`ad-stat-icon ${c.box}`}>
                  <span className={c.icon}>{icon}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

        {/* Recent Orders */}
        <SectionCard
          title="Recent Orders"
          className="xl:col-span-3"
          action={
            <button onClick={() => navigate('student-orders')} className="ad-section-link">
              View all <ChevronRight size={16} />
            </button>
          }
        >
          {!data?.recent_orders?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
            </div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table" style={{ minWidth: '580px' }}>
                <thead style={{ background: 'var(--lavender-pale)' }}>
                  <tr>
                    {['Student', 'Order', 'Time', 'Status'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((o) => {
                    const initials = o.student_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                    return (
                      <tr key={o.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-brown">{initials}</div>
                            <p className="truncate text-sm font-semibold text-brown">{o.student_name}</p>
                          </div>
                        </td>
                        <td className="text-sm text-brown/70">{o.package || '—'}</td>
                        <td className="text-sm text-brown/40">{o.time}</td>
                        <td>
                          <span className={`ad-badge ${o.status}`}>
                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Today's Summary */}
        <SectionCard title="Today's Summary" className="xl:col-span-2">
          <div className="space-y-1 p-3">
            {summary.map(({ label, value, tag, color, icon }) => {
              const c = COLOR_STYLES[color]
              return (
                <div key={label} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream/60">
                  <div className={`ad-stat-icon ${c.box}`}>
                    <span className={c.icon}>{icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-brown/50">{label}</p>
                    <p className="text-sm font-bold text-brown">{value}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-dark">{tag}</span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Meal Package Popularity */}
        <SectionCard title="Meal Package Popularity">
          {!data?.meal_popularity?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No order data yet</p>
            </div>
          ) : (
            <div className="space-y-5 p-5">
              {data.meal_popularity.map(({ name, pct }, i) => {
                const { barClass, textClass } = BAR_COLORS[i % BAR_COLORS.length]
                return (
                  <div key={name}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-brown/80">{name}</span>
                      <span className={`text-sm font-semibold ${textClass}`}>{pct}%</span>
                    </div>
                    <div className="ad-progress-bar-wrap">
                      <div className={`ad-progress-bar ${barClass}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Upcoming Events */}
        <SectionCard
          title="Upcoming Events"
          action={
            <button onClick={() => navigate('events')} className="ad-section-link">
              Open <ChevronRight size={16} />
            </button>
          }
        >
          {!data?.upcoming_events?.length ? (
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
              <div className="ad-stat-icon mb-3" style={{ background: 'var(--lavender-pale)', width: '56px', height: '56px' }}>
                <CalendarDays size={24} style={{ color: 'var(--lavender)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3 p-5">
              {data.upcoming_events.map((ev) => (
                <div key={ev.title} className="ad-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--lavender-pale)', borderRadius: 'var(--radius-md)', padding: '8px', textAlign: 'center', flexShrink: 0, minWidth: '48px' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', display: 'block' }}>{ev.date.split(' ')[0]}</span>
                    <span className="text-base font-bold leading-none" style={{ color: 'var(--navy-dark)', display: 'block' }}>{ev.date.split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brown">{ev.title}</p>
                    <p className="mt-1 text-xs text-brown/40">Scheduled event</p>
                  </div>
                  <span className={`ad-badge ${ev.status}`}>
                    {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-3 p-5">
            {ACTIONS.map(({ label, icon, to }) => {
              const IconComp = ACTION_ICONS[icon]
              return (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="ad-card"
                  style={{ padding: '20px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: 'none', width: '100%' }}
                >
                  <div className="ad-stat-icon bg-gold/10">
                    <IconComp size={18} className="text-gold-dark" />
                  </div>
                  <span className="text-sm font-medium text-brown/80">{label}</span>
                </button>
              )
            })}
          </div>
        </SectionCard>

      </div>
    </div>
  )
}
