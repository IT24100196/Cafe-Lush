import { useState, useEffect, useCallback } from 'react'
import { getIncomeOutcome, createIncomeOutcome, deleteIncomeOutcome } from '../../api/endpoints'
import { Spinner, PageHeader, ConfirmDialog } from '../../components/UI'

const todayStr = () => new Date().toISOString().split('T')[0]

const EMPTY_INCOME  = { amount: '', description: '', entry_date: todayStr() }
const EMPTY_OUTCOME = { amount: '', description: '', entry_date: todayStr() }

export default function IncomeOutcome() {
  const [entries,     setEntries]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [incomeForm,  setIncomeForm]  = useState(EMPTY_INCOME)
  const [outcomeForm, setOutcomeForm] = useState(EMPTY_OUTCOME)
  const [savingIncome,  setSavingIncome]  = useState(false)
  const [savingOutcome, setSavingOutcome] = useState(false)
  const [incomeError,   setIncomeError]   = useState('')
  const [outcomeError,  setOutcomeError]  = useState('')
  const [deleteId,    setDeleteId]    = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getIncomeOutcome()
      setEntries(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSubmit = async (type) => {
    const form = type === 'income' ? incomeForm : outcomeForm
    const setError  = type === 'income' ? setIncomeError  : setOutcomeError
    const setSaving = type === 'income' ? setSavingIncome : setSavingOutcome
    const resetForm = type === 'income'
      ? () => setIncomeForm(EMPTY_INCOME)
      : () => setOutcomeForm(EMPTY_OUTCOME)

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    setError(''); setSaving(true)
    try {
      await createIncomeOutcome({ ...form, entry_type: type })
      resetForm()
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await deleteIncomeOutcome(deleteId) } catch {
      // Keep the list refresh below so the UI stays in sync if the item was already removed.
    }
    setDeleteId(null)
    fetchAll()
  }

  const now = new Date()
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.entry_date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const totalIncome  = thisMonth.filter(e => e.entry_type === 'income') .reduce((s, e) => s + parseFloat(e.amount), 0)
  const totalOutcome = thisMonth.filter(e => e.entry_type === 'outcome').reduce((s, e) => s + parseFloat(e.amount), 0)
  const net = totalIncome - totalOutcome

  const displayEntries = showHistory ? entries : thisMonth

  return (
    <div>
      <PageHeader
        title="💰 Income & Outcome"
        action={
          <button onClick={() => setShowHistory(h => !h)} className="ad-btn-secondary">
            {showHistory ? '📅 This Month' : '🕓 History'}
          </button>
        }
      />

      {/* ── Summary Cards ── */}
      <div className="ad-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-label">This Month Income</p>
          <p className="ad-stat-value" style={{ color: '#059669' }}>Rs.{totalIncome.toFixed(2)}</p>
        </div>
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-label">This Month Outcome</p>
          <p className="ad-stat-value" style={{ color: '#DC2626' }}>Rs.{totalOutcome.toFixed(2)}</p>
        </div>
        <div className="ad-stat-card" style={{ textAlign: 'center' }}>
          <p className="ad-stat-label">Net (This Month)</p>
          <p className="ad-stat-value" style={{ color: net >= 0 ? '#059669' : '#DC2626' }}>
            Rs.{net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── Inline Entry Forms ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>

        {/* Income Entry */}
        <div className="ad-card" style={{ padding: '22px', borderTop: '3px solid #059669' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px', color: '#065F46', marginBottom: '16px' }}>
            ▲ Add Income
          </p>
          {incomeError && <p className="ad-alert-error">{incomeError}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="ad-field-label">Amount (Rs.)</label>
              <input
                className="ad-input"
                type="number" step="0.01" min="0.01"
                placeholder="0.00"
                value={incomeForm.amount}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="ad-field-label">Description</label>
              <input
                className="ad-input"
                placeholder="e.g. Catering payment, Event fee..."
                value={incomeForm.description}
                onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="ad-field-label">Date</label>
              <input
                className="ad-input"
                type="date"
                value={incomeForm.entry_date}
                onChange={e => setIncomeForm({ ...incomeForm, entry_date: e.target.value })}
              />
            </div>
            <button
              onClick={() => handleSubmit('income')}
              disabled={savingIncome}
              style={{
                padding: '11px', borderRadius: '8px', border: 'none',
                background: '#059669', color: '#fff',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                opacity: savingIncome ? 0.6 : 1,
              }}
            >
              {savingIncome ? <Spinner size="sm" /> : '+ Add Income'}
            </button>
          </div>
        </div>

        {/* Outcome Entry */}
        <div className="ad-card" style={{ padding: '22px', borderTop: '3px solid #DC2626' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px', color: '#991B1B', marginBottom: '16px' }}>
            ▼ Add Outcome
          </p>
          {outcomeError && <p className="ad-alert-error">{outcomeError}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="ad-field-label">Amount (Rs.)</label>
              <input
                className="ad-input"
                type="number" step="0.01" min="0.01"
                placeholder="0.00"
                value={outcomeForm.amount}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={e => setOutcomeForm({ ...outcomeForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="ad-field-label">Description</label>
              <input
                className="ad-input"
                placeholder="e.g. Electricity bill, Supplier payment..."
                value={outcomeForm.description}
                onChange={e => setOutcomeForm({ ...outcomeForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="ad-field-label">Date</label>
              <input
                className="ad-input"
                type="date"
                value={outcomeForm.entry_date}
                onChange={e => setOutcomeForm({ ...outcomeForm, entry_date: e.target.value })}
              />
            </div>
            <button
              onClick={() => handleSubmit('outcome')}
              disabled={savingOutcome}
              style={{
                padding: '11px', borderRadius: '8px', border: 'none',
                background: '#DC2626', color: '#fff',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                opacity: savingOutcome ? 0.6 : 1,
              }}
            >
              {savingOutcome ? <Spinner size="sm" /> : '+ Add Outcome'}
            </button>
          </div>
        </div>
      </div>

      {/* ── History Table ── */}
      <div className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="ad-card-title">
            {showHistory ? '🕓 All Entries' : '📅 This Month Entries'}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{displayEntries.length} record{displayEntries.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : displayEntries.length === 0 ? (
          <div className="text-center py-12 text-brown/30">
            <div className="text-4xl mb-2">💸</div>
            <p className="font-inter text-sm">No entries {showHistory ? 'found' : 'for this month'}.</p>
          </div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead style={{ background: 'var(--lavender-pale)' }}>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="text-brown/60 text-xs">{e.entry_date}</td>
                    <td>
                      <span style={{
                        padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        background: e.entry_type === 'income' ? '#D1FAE5' : '#FEE2E2',
                        color:      e.entry_type === 'income' ? '#065F46' : '#991B1B',
                      }}>
                        {e.entry_type === 'income' ? '▲ Income' : '▼ Outcome'}
                      </span>
                    </td>
                    <td className="text-brown/70">{e.description || '—'}</td>
                    <td className="font-semibold" style={{
                      textAlign: 'right',
                      color: e.entry_type === 'income' ? '#059669' : '#DC2626',
                    }}>
                      {e.entry_type === 'outcome' ? '−' : '+'}Rs.{parseFloat(e.amount).toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => setDeleteId(e.id)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#DC2626' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog
          message="Delete this entry? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
