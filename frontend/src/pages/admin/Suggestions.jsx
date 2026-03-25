import { useEffect, useState, useCallback } from 'react'
import { getSuggestions, markSuggestionsRead } from '../../api/endpoints'
import { Spinner, EmptyState, PageHeader } from '../../components/UI'

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]         = useState(true)

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getSuggestions()
      setSuggestions(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const handleMarkRead = async () => {
    await markSuggestionsRead()
    setSuggestions((prev) => prev.map((s) => ({ ...s, is_read: true })))
  }

  const unread = suggestions.filter((s) => !s.is_read).length

  return (
    <div>
      <PageHeader title="💬 Student Suggestions" />

      {/* Stats + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="ad-stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', margin: 0 }}>
          <div className="ad-stat-card" style={{ textAlign: 'center' }}>
            <p className="ad-stat-value">{suggestions.length}</p>
            <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>Total</p>
          </div>
          <div className="ad-stat-card" style={{ textAlign: 'center' }}>
            <p className="ad-stat-value" style={{ color: unread > 0 ? '#d97706' : undefined }}>{unread}</p>
            <p className="ad-stat-label" style={{ marginBottom: 0, marginTop: '4px' }}>Unread</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {unread > 0 && (
            <button onClick={handleMarkRead} style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#2C1A0E', color: '#fff' }}>
              ✓ Mark all as read
            </button>
          )}
          <button onClick={fetchSuggestions} style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size="lg" /></div>
      ) : suggestions.length === 0 ? (
        <EmptyState message="No suggestions yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {suggestions.map((s) => (
            <div key={s.id} className="ad-card" style={{ padding: '14px 18px', borderLeft: `4px solid ${s.is_read ? '#d1d5db' : '#f59e0b'}`, opacity: s.is_read ? 0.75 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#2C1A0E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {s.student_name}
                    {!s.is_read && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{s.message}</p>
                </div>
                <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  🕐 {new Date(s.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
