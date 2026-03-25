import { useState, useEffect, useCallback } from 'react'
import { getBranches, createBranch, updateBranch, deleteBranch, getTransactions } from '../../api/endpoints'
import { Spinner, Badge, Modal, ConfirmDialog, EmptyState, PageHeader } from '../../components/UI'

const EMPTY = { name: '', address: '', contact: '', is_partner: false, commission_rate: '0' }

export default function PartnerHotels() {
  const [branches,  setBranches]  = useState([])
  const [txns,      setTxns]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editId,    setEditId]    = useState(null)
  const [deleteId,  setDeleteId]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [tab,       setTab]       = useState('branches')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [br, tx] = await Promise.all([getBranches(), getTransactions()])
      setBranches(br.data); setTxns(tx.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setError(''); setModal(true) }
  const openEdit = (b) => {
    setForm({ name: b.name, address: b.address, contact: b.contact, is_partner: b.is_partner, commission_rate: b.commission_rate })
    setEditId(b.id); setError(''); setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) await updateBranch(editId, form)
      else        await createBranch(form)
      setModal(false); fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await deleteBranch(deleteId) } catch {}
    setDeleteId(null); fetchAll()
  }

  const totalCommissions = txns
    .filter((t) => t.status === 'paid')
    .reduce((s, t) => s + parseFloat(t.commission_amount), 0)

  return (
    <div>
      <PageHeader
        title="🤝 Partner Hotels"
        action={<button onClick={openAdd} className="ad-btn-primary">+ Add Branch</button>}
      />

      {/* Tabs */}
      <div className="ad-card" style={{ padding: '6px', display: 'inline-flex', gap: '4px', marginBottom: '20px' }}>
        {['branches', 'commissions'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tab === t
              ? { background: 'var(--navy-dark)', color: 'var(--lavender)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }
              : { background: 'transparent', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }
            }
          >
            {t === 'branches' ? '🏨 Branches' : '💰 Commission History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'branches' ? (
        branches.length === 0 ? <EmptyState message="No branches added yet." /> : (
          <div className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead style={{ background: 'var(--lavender-pale)' }}>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th>Partner</th>
                    <th>Commission</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id}>
                      <td className="font-semibold text-brown">{b.name}</td>
                      <td className="text-brown/50 max-w-xs truncate">{b.address || '—'}</td>
                      <td className="text-brown/50">{b.contact || '—'}</td>
                      <td>
                        <Badge status={b.is_partner ? 'confirmed' : 'open'} />
                      </td>
                      <td className="font-semibold text-gold-dark">{b.is_partner ? `${b.commission_rate}%` : '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(b)} className="text-xs font-medium hover:underline" style={{ color: 'var(--lavender)' }}>Edit</button>
                          <button onClick={() => setDeleteId(b.id)} className="text-xs font-medium hover:underline" style={{ color: '#DC2626' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div>
          <div className="ad-stat-card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="ad-stat-label">Total Commissions Paid</p>
              <p className="ad-stat-value" style={{ color: '#059669' }}>₱{totalCommissions.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          {txns.length === 0 ? <EmptyState message="No commission transactions yet." /> : (
            <div className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead style={{ background: 'var(--lavender-pale)' }}>
                    <tr>
                      <th>Branch</th>
                      <th>Event</th>
                      <th>Commission</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id}>
                        <td className="font-semibold text-brown">{t.branch_name}</td>
                        <td className="text-brown/60">{t.event_name}</td>
                        <td className="font-semibold text-gold-dark">₱{parseFloat(t.commission_amount).toFixed(2)}</td>
                        <td><Badge status={t.status} /></td>
                        <td className="text-brown/40 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={editId ? 'Edit Branch' : 'Add Branch'} onClose={() => setModal(false)}>
          {error && <p className="ad-alert-error">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="ad-field-label">Branch Name</label>
              <input className="ad-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="ad-field-label">Address</label>
              <textarea className="ad-input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="ad-field-label">Contact</label>
              <input className="ad-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="isPartner"
                checked={form.is_partner}
                onChange={(e) => setForm({ ...form, is_partner: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isPartner" className="text-sm text-brown/70">Is a partner hotel</label>
            </div>
            {form.is_partner && (
              <div>
                <label className="ad-field-label">Commission Rate (%)</label>
                <input
                  className="ad-input" type="number" step="0.01" min="0" max="100"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="ad-btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : null} Save
              </button>
              <button type="button" onClick={() => setModal(false)} className="ad-btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog
          message="Delete this branch? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
