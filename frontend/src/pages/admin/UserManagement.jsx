import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStudents, deactivateStudent, activateStudent } from '../../api/endpoints'
import { EmptyState, PageHeader, Spinner } from '../../components/UI'

function DeactivateModal({ student, onConfirm, onCancel }) {
  const [reason,  setReason]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) { setError('Please enter a reason.'); return }
    setSaving(true)
    try {
      await onConfirm(reason.trim())
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(26,26,46,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'var(--white)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 40px rgba(26,26,46,0.22)', border: '1px solid var(--border-soft)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🚫
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '16px', color: 'var(--navy-dark)', margin: 0 }}>Deactivate Account</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{student.username}</p>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            This user will be blocked from logging in. They will see your reason when they attempt to sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="ad-field-label">Reason for deactivation <span style={{ color: '#DC2626' }}>*</span></label>
            <textarea
              className="ad-input"
              rows={4}
              placeholder="e.g. Violation of terms of service, suspicious activity…"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError('') }}
              style={{ resize: 'vertical', minHeight: '100px' }}
              autoFocus
            />
            {error && <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px' }}>{error}</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="ad-btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !reason.trim()}
              style={{ flex: 1, padding: '10px 20px', borderRadius: '8px', border: 'none', background: saving || !reason.trim() ? 'rgba(220,38,38,0.3)' : '#DC2626', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving || !reason.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.18s' }}
            >
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function UserManagement() {
  const [students,        setStudents]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState(null) // student to deactivate
  const [activating,      setActivating]      = useState(null)  // id being activated

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getStudents()
      setStudents(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const handleDeactivateConfirm = async (reason) => {
    const { data } = await deactivateStudent(deactivateTarget.id, reason)
    setStudents((prev) => prev.map((s) => (s.id === data.id ? data : s)))
    setDeactivateTarget(null)
  }

  const handleActivate = async (id) => {
    setActivating(id)
    try {
      const { data } = await activateStudent(id)
      setStudents((prev) => prev.map((s) => (s.id === data.id ? data : s)))
    } finally {
      setActivating(null)
    }
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.username.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.contact || '').toLowerCase().includes(q)
    )
  })

  const activeCount   = students.filter((s) => s.is_active).length
  const inactiveCount = students.length - activeCount

  return (
    <div>
      <PageHeader title="👥 User Management" />

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Students',    value: students.length, color: 'var(--lavender)' },
          { label: 'Active',            value: activeCount,     color: '#059669' },
          { label: 'Inactive / Banned', value: inactiveCount,   color: '#DC2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="ad-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          className="ad-input"
          style={{ maxWidth: '340px' }}
          placeholder="Search by name, username, email or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'No students match your search.' : 'No students registered yet.'} />
      ) : (
        <div className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead style={{ background: 'var(--lavender-pale)' }}>
                <tr>
                  {['#', 'Username', 'Full Name', 'Email', 'Contact', 'Registered', 'Status', 'Reason', 'Action'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.username}</td>
                    <td>{s.full_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.contact || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span className={`ad-badge ${s.is_active ? 'confirmed' : 'cancelled'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      {s.deactivation_reason
                        ? <span style={{ fontSize: '12px', color: '#DC2626', fontStyle: 'italic' }}>{s.deactivation_reason}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {s.is_active ? (
                        <button
                          onClick={() => setDeactivateTarget(s)}
                          style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', border: '1.5px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', cursor: 'pointer', transition: 'all 0.18s' }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(s.id)}
                          disabled={activating === s.id}
                          style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', border: '1.5px solid rgba(5,150,105,0.3)', background: 'rgba(5,150,105,0.06)', color: '#059669', cursor: activating === s.id ? 'not-allowed' : 'pointer', opacity: activating === s.id ? 0.5 : 1, transition: 'all 0.18s' }}
                        >
                          {activating === s.id ? '…' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deactivateTarget && (
        <DeactivateModal
          student={deactivateTarget}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  )
}
