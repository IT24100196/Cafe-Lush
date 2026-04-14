import { useState, useEffect, useCallback } from 'react'
import { getEvents, createEvent, updateEvent, updateEventStatus, getBranches } from '../../api/endpoints'
import { Spinner, Badge, Modal, EmptyState, PageHeader } from '../../components/UI'
import { isValidSriLankanMobile, normalizePhone } from '../../api/validation'

const STATUSES  = ['inquiry', 'confirmed', 'completed', 'cancelled']
const EMPTY_FORM = {
  name: '', customer_name: '', customer_contact: '',
  event_date: '', venue: '', assigned_branch: '', total_amount: '',
}

export default function EventsManagement() {
  const [events,   setEvents]   = useState([])
  const [branches, setBranches] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   // null | 'form' | 'status'
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [editId,   setEditId]   = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ev, br] = await Promise.all([getEvents(), getBranches()])
      setEvents(ev.data); setBranches(br.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setError(''); setModal('form') }
  const openEdit = (ev) => {
    setForm({
      name: ev.name, customer_name: ev.customer_name,
      customer_contact: ev.customer_contact || '',
      event_date: ev.event_date, venue: ev.venue || '',
      assigned_branch: ev.assigned_branch || '',
      total_amount: ev.total_amount,
    })
    setEditId(ev.id); setError(''); setModal('form')
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    const customerContact = form.customer_contact.trim()
    if (customerContact && !isValidSriLankanMobile(customerContact)) {
      setSaving(false)
      setError('Customer contact must contain exactly 10 numbers and start with 07 (example: 0771234567).')
      return
    }
    const payload = {
      ...form,
      customer_contact: customerContact ? normalizePhone(customerContact) : '',
      assigned_branch: form.assigned_branch || null,
    }
    try {
      if (editId) await updateEvent(editId, payload)
      else        await createEvent(payload)
      setModal(null); fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleStatusChange = async (newStatus) => {
    try { await updateEventStatus(statusTarget.id, newStatus) } catch { /* ignore */ }
    setStatusTarget(null); setModal(null); fetchAll()
  }

  return (
    <div>
      <PageHeader
        title="🎉 Events Management"
        action={<button onClick={openAdd} className="ad-btn-primary">+ New Event</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : events.length === 0 ? (
        <EmptyState message="No events created yet." />
      ) : (
        <div className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead style={{ background: 'var(--lavender-pale)' }}>
                <tr>
                  <th>Event</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(155,142,196,0.07)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(155,142,196,0.04)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                    <td className="table-td font-semibold text-brown">{ev.name}</td>
                    <td className="table-td">
                      <p className="text-brown/80">{ev.customer_name}</p>
                      <p className="text-xs text-brown/40">{ev.customer_contact}</p>
                    </td>
                    <td className="table-td">{ev.event_date}</td>
                    <td className="table-td text-brown/60">{ev.branch_name || '—'}</td>
                    <td className="table-td font-semibold text-gold-dark">₱{parseFloat(ev.total_amount).toFixed(2)}</td>
                    <td className="table-td"><span className={`ad-badge ${ev.status}`}>{ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}</span></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(ev)} className="text-xs font-medium hover:underline" style={{ color: 'var(--lavender)' }}>Edit</button>
                        <button
                          onClick={() => { setStatusTarget(ev); setModal('status') }}
                          className="text-xs font-medium hover:underline"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Event' : 'New Event'} onClose={() => setModal(null)}>
          {error && <p className="ad-alert-error">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="ad-field-label">Event Name</label>
                <input className="ad-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="ad-field-label">Customer Name</label>
                <input className="ad-input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
              </div>
              <div>
                <label className="ad-field-label">Customer Contact</label>
                <input
                  className="ad-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]*"
                  value={form.customer_contact}
                  onChange={(e) => setForm({ ...form, customer_contact: normalizePhone(e.target.value) })}
                />
              </div>
              <div>
                <label className="ad-field-label">Event Date</label>
                <input className="ad-input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
              </div>
              <div>
                <label className="ad-field-label">Total Amount (₱)</label>
                <input className="ad-input" type="number" step="0.01" min="0" value={form.total_amount} onWheel={(e) => e.currentTarget.blur()} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <label className="ad-field-label">Venue</label>
                <input className="ad-input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="ad-field-label">Assign Branch (optional)</label>
                <select className="ad-select" value={form.assigned_branch} onChange={(e) => setForm({ ...form, assigned_branch: e.target.value })}>
                  <option value="">No branch assigned</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.is_partner ? `(Partner – ${b.commission_rate}%)` : '(Local)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="ad-btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : null} Save Event
              </button>
              <button type="button" onClick={() => setModal(null)} className="ad-btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Modal */}
      {modal === 'status' && statusTarget && (
        <Modal title={`Update Status — ${statusTarget.name}`} onClose={() => { setModal(null); setStatusTarget(null) }}>
          <p className="text-sm text-gray-500 mb-4">
            Current: <Badge status={statusTarget.status} />
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={s === statusTarget.status}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  s === statusTarget.status
                    ? 'bg-cream text-brown/30 cursor-not-allowed border-cream-dark'
                    : 'border-gold/30 hover:bg-gold/10 hover:border-gold hover:text-brown'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
