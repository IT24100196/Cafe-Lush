import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createCashier, getCashiers, updateCashier } from '../../api/endpoints'
import { EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH, isValidEmail, isValidPassword, isValidUsername } from '../../api/validation'
import { useAuth } from '../../context/authContextCore'
import { EmptyState, PageHeader, Spinner, Toast } from '../../components/UI'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'


function getErrorMessage(err, priority = []) {
  const data = err?.response?.data
  if (!data) return 'Something went wrong.'
  if (typeof data === 'string' && data.trim()) return data
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail

  for (const key of priority) {
    const value = data?.[key]
    if (Array.isArray(value) && value.length) return String(value[0])
    if (typeof value === 'string' && value.trim()) return value
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length) return String(value[0])
    if (typeof value === 'string' && value.trim()) return value
  }

  return 'Something went wrong.'
}

function getRoleName(account) {
  return account?.role?.name || account?.role || ''
}

function getRoleLabel(account) {
  const role = getRoleName(account)
  if (role === 'admin') return 'Admin'
  if (role === 'cashier') return 'Cashier'
  return 'Staff'
}


function CashierFormModal({ title, submitLabel, initialValues, onSubmit, onClose, mode }) {
  useBodyScrollLock()

  const isEditMode = mode === 'edit'
  const accountLabel = getRoleLabel(initialValues).toLowerCase()
  const [form, setForm] = useState(initialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCredentialEditor, setShowCredentialEditor] = useState(!isEditMode)
  const blockPasswordTransfer = (e) => {
    e.preventDefault()
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleCredentialToggle = () => {
    if (showCredentialEditor) {
      setForm((prev) => ({
        ...prev,
        username: initialValues.username || '',
        password: '',
        confirm_password: '',
      }))
    }
    setError('')
    setShowCredentialEditor((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = form.email.trim()
    const username = form.username.trim()
    const password = form.password
    const confirmPassword = form.confirm_password
    const payload = {}

    if (email && !isValidEmail(email)) {
      setError('Enter a valid email address (example: user@example.com).')
      return
    }

    if (!isEditMode) {
      if (!username) {
        setError('Username is required.')
        return
      }
      if (!isValidUsername(username)) {
        setError('Username must be 3-30 characters, include at least one letter, and use only letters, numbers, dot, underscore, or hyphen.')
        return
      }
      if (!password) {
        setError('Password is required.')
        return
      }
      if (!isValidPassword(password)) {
        setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters and cannot be only numbers.`)
        return
      }
      if (!confirmPassword) {
        setError('Please confirm the password.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      payload.username = username
      payload.email = email
      payload.password = password
      payload.confirm_password = confirmPassword
    } else {
      if (email !== (initialValues.email || '')) {
        payload.email = email
      }

      if (showCredentialEditor) {
        if (!username) {
          setError('New username is required.')
          return
        }
        if (!isValidUsername(username)) {
          setError('Username must be 3-30 characters, include at least one letter, and use only letters, numbers, dot, underscore, or hyphen.')
          return
        }
        if (username !== (initialValues.username || '')) {
          payload.username = username
        }

        if (password || confirmPassword) {
          if (!password) {
            setError('Enter the new password.')
            return
          }
          if (!isValidPassword(password)) {
            setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters and cannot be only numbers.`)
            return
          }
          if (!confirmPassword) {
            setError('Please confirm the new password.')
            return
          }
          if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
          }
          payload.password = password
          payload.confirm_password = confirmPassword
        }
      }

      if (Object.keys(payload).length === 0) {
        setError('No changes were provided.')
        return
      }
    }

    setSaving(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      setError(getErrorMessage(err, ['username', 'email', 'password', 'confirm_password', 'detail', 'non_field_errors']))
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(26,26,46,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--white)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 40px rgba(26,26,46,0.22)', border: '1px solid var(--border-soft)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '18px', color: 'var(--navy-dark)', margin: 0 }}>{title}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {isEditMode
              ? `Update this ${accountLabel} account while keeping existing history connected.`
              : 'Create a new cashier account for POS access.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label className="ad-field-label">Email</label>
              <input
                className="ad-input"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Optional"
                maxLength={EMAIL_MAX_LENGTH}
                autoFocus={!isEditMode}
              />
            </div>

            {isEditMode ? (
              <>
                <div style={{
                  display: 'grid',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(155, 142, 196, 0.08)',
                  border: '1px solid rgba(155, 142, 196, 0.18)',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Username</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-dark)', marginTop: '4px' }}>{initialValues.username || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Password</div>
                    <div style={{ fontSize: '14px', color: 'var(--navy-dark)', marginTop: '4px' }}>Current password cannot be viewed. Set a new password instead.</div>
                  </div>
                </div>

                {!showCredentialEditor ? (
                  <button
                    type="button"
                    className="ad-btn-primary"
                    style={{ padding: '10px 16px', justifySelf: 'start' }}
                    onClick={handleCredentialToggle}
                  >
                    Change Username / Password
                  </button>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(44,26,14,0.12)',
                    background: '#fffaf3',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-dark)' }}>Credential Change</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Save here to replace the old login and force this staff member to sign in with the new details.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ad-btn-secondary"
                        onClick={handleCredentialToggle}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Cancel Change
                      </button>
                    </div>

                    <div>
                      <label className="ad-field-label">New Username</label>
                      <input
                        className="ad-input"
                        value={form.username}
                        onChange={(e) => handleChange('username', e.target.value.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30))}
                        autoFocus
                        maxLength={30}
                        pattern="(?=.*[A-Za-z])[-A-Za-z0-9._]{3,30}"
                      />
                    </div>

                    <div>
                      <label className="ad-field-label">New Password</label>
                      <input
                        className="ad-input"
                        type="password"
                        value={form.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="Leave blank if only changing username"
                        onCopy={blockPasswordTransfer}
                        onCut={blockPasswordTransfer}
                        minLength={PASSWORD_MIN_LENGTH}
                      />
                    </div>

                    <div>
                      <label className="ad-field-label">Confirm Password</label>
                      <input
                        className="ad-input"
                        type="password"
                        value={form.confirm_password}
                        onChange={(e) => handleChange('confirm_password', e.target.value)}
                        placeholder="Re-enter the new password"
                        onPaste={blockPasswordTransfer}
                        onDrop={blockPasswordTransfer}
                        minLength={PASSWORD_MIN_LENGTH}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="ad-field-label">Username</label>
                  <input
                    className="ad-input"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30))}
                    maxLength={30}
                    pattern="(?=.*[A-Za-z])[-A-Za-z0-9._]{3,30}"
                  />
                </div>

                <div>
                  <label className="ad-field-label">Password</label>
                  <input
                    className="ad-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    onCopy={blockPasswordTransfer}
                    onCut={blockPasswordTransfer}
                    minLength={PASSWORD_MIN_LENGTH}
                  />
                </div>

                <div>
                  <label className="ad-field-label">Confirm Password</label>
                  <input
                    className="ad-input"
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                    placeholder="Re-enter the password"
                    onPaste={blockPasswordTransfer}
                    onDrop={blockPasswordTransfer}
                    minLength={PASSWORD_MIN_LENGTH}
                  />
                </div>
              </>
            )}
          </div>

          {error && <p style={{ fontSize: '12px', color: '#DC2626', margin: '14px 0 0' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button type="button" className="ad-btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2C1A0E', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}


export default function CashierManagement() {
  const { user } = useAuth()
  const [cashiers, setCashiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [toast, setToast] = useState(null)

  const loadCashiers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCashiers()
      setCashiers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCashiers()
  }, [loadCashiers])

  const filteredCashiers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cashiers
    return cashiers.filter((cashier) => (
      (cashier.username || '').toLowerCase().includes(q) ||
      (cashier.email || '').toLowerCase().includes(q) ||
      getRoleLabel(cashier).toLowerCase().includes(q)
    ))
  }, [cashiers, search])

  const activeCount = cashiers.filter((cashier) => cashier.is_active).length
  const inactiveCount = cashiers.length - activeCount
  const adminCount = cashiers.filter((cashier) => getRoleName(cashier) === 'admin').length
  const cashierCount = cashiers.filter((cashier) => getRoleName(cashier) === 'cashier').length

  const handleCreate = async (payload) => {
    const { data } = await createCashier(payload)
    setCashiers((prev) => [data, ...prev])
    setShowCreate(false)
    setToast({ type: 'success', message: `Cashier ${data.username} created.` })
  }

  const handleEdit = async (payload) => {
    const credentialsChanged = Object.prototype.hasOwnProperty.call(payload, 'username') ||
      Object.prototype.hasOwnProperty.call(payload, 'password')
    const editingCurrentAdmin = Number(user?.id) === Number(editTarget.id)
    const { data } = await updateCashier(editTarget.id, payload)
    setCashiers((prev) => prev.map((cashier) => (cashier.id === data.id ? data : cashier)))
    setEditTarget(null)
    setToast({
      type: 'success',
      message: editingCurrentAdmin && credentialsChanged
        ? 'Your login was updated. Please sign in again with the new details.'
        : `${getRoleLabel(data)} ${data.username} updated.`,
    })

    if (editingCurrentAdmin && credentialsChanged) {
      setTimeout(() => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }, 900)
    }
  }

  const handleToggleStatus = async (cashier) => {
    if (getRoleName(cashier) === 'admin') {
      setToast({ type: 'error', message: 'Admin accounts cannot be activated or deactivated here.' })
      return
    }
    setTogglingId(cashier.id)
    try {
      const { data } = await updateCashier(cashier.id, { is_active: !cashier.is_active })
      setCashiers((prev) => prev.map((item) => (item.id === data.id ? data : item)))
      setToast({
        type: 'success',
        message: data.is_active
          ? `${data.username} can log in again.`
          : `${data.username} has been deactivated.`,
      })
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, ['detail']) })
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff Management"
        action={(
          <button
            className="ad-btn-primary"
            onClick={() => setShowCreate(true)}
            style={{ padding: '10px 16px' }}
          >
            Add Cashier
          </button>
        )}
      />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Staff', value: cashiers.length, color: 'var(--lavender)' },
          { label: 'Admins', value: adminCount, color: 'var(--navy-dark)' },
          { label: 'Cashiers', value: cashierCount, color: 'var(--gold)' },
          { label: 'Active', value: activeCount, color: '#059669' },
          { label: 'Inactive', value: inactiveCount, color: '#DC2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="ad-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          className="ad-input"
          style={{ maxWidth: '340px' }}
          placeholder="Search by username, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filteredCashiers.length === 0 ? (
        <EmptyState message={search ? 'No staff accounts match your search.' : 'No staff accounts found.'} />
      ) : (
        <div className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead style={{ background: 'var(--lavender-pale)' }}>
                <tr>
                  {['#', 'Username', 'Email', 'Role', 'Created', 'Status', 'Actions'].map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCashiers.map((cashier, index) => {
                  const isAdminAccount = getRoleName(cashier) === 'admin'
                  return (
                  <tr key={cashier.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{cashier.username}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{cashier.email || '—'}</td>
                    <td>
                      <span className={`ad-badge ${isAdminAccount ? 'pending' : 'confirmed'}`}>
                        {getRoleLabel(cashier)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(cashier.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span className={`ad-badge ${cashier.is_active ? 'confirmed' : 'cancelled'}`}>
                        {cashier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setEditTarget(cashier)}
                          style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', border: '1.5px solid rgba(44,26,14,0.16)', background: 'rgba(44,26,14,0.05)', color: '#2C1A0E', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        {isAdminAccount ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', border: '1.5px solid rgba(155,142,196,0.3)', background: 'rgba(155,142,196,0.08)', color: 'var(--text-muted)' }}>
                            Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(cashier)}
                            disabled={togglingId === cashier.id}
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: cashier.is_active ? '1.5px solid rgba(220,38,38,0.3)' : '1.5px solid rgba(5,150,105,0.3)',
                              background: cashier.is_active ? 'rgba(220,38,38,0.06)' : 'rgba(5,150,105,0.06)',
                              color: cashier.is_active ? '#DC2626' : '#059669',
                              cursor: togglingId === cashier.id ? 'not-allowed' : 'pointer',
                              opacity: togglingId === cashier.id ? 0.5 : 1,
                            }}
                          >
                            {togglingId === cashier.id ? '...' : cashier.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <CashierFormModal
          title="Add Cashier"
          submitLabel="Create Cashier"
          initialValues={{ username: '', email: '', password: '', confirm_password: '' }}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          mode="create"
        />
      )}

      {editTarget && (
        <CashierFormModal
          title={`Edit ${getRoleLabel(editTarget)} ${editTarget.username}`}
          submitLabel="Save Changes"
          initialValues={{ username: editTarget.username || '', email: editTarget.email || '', password: '', confirm_password: '', role: editTarget.role }}
          onSubmit={handleEdit}
          onClose={() => setEditTarget(null)}
          mode="edit"
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
