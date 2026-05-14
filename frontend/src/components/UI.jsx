import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

// Spinner
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <div className={`${s} animate-spin rounded-full border-2 border-gold/30 border-t-gold`} />
  )
}

// Status Badge
const badgeColors = {
  pending:   'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  available: 'bg-emerald-100 text-emerald-800',
  unavailable: 'bg-red-100 text-red-700',
  paid:      'bg-emerald-100 text-emerald-800',
  open:      'bg-cream-dark text-brown/70',
  voided:    'bg-red-100 text-red-700',
  inquiry:   'bg-violet-100 text-violet-800',
}

export function Badge({ status, label }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-inter ${badgeColors[status] || 'bg-cream-dark text-brown/70'}`}>
      {label || status}
    </span>
  )
}

// Modal
export function Modal({ title, onClose, children, maxWidthClass = 'max-w-lg', maxWidth }) {
  useBodyScrollLock()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brown-dark/50 p-4 pt-10 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto border border-cream-dark`}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <h3 className="font-playfair font-bold text-brown text-lg">{title}</h3>
          <button onClick={onClose} className="text-brown/40 hover:text-brown text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// Confirm Dialog
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useBodyScrollLock()

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brown-dark/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-cream-dark">
        {title && (
          <h3 className="font-playfair font-bold text-brown text-lg mb-2">{title}</h3>
        )}
        <p className="font-inter text-brown/80 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          {cancelLabel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-cream-dark text-brown/70 text-sm font-medium hover:bg-cream transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Empty state
export function EmptyState({ message = 'No records found.' }) {
  return (
    <div className="text-center py-14 text-brown/40">
      <div className="text-5xl mb-3">📭</div>
      <p className="font-inter text-sm">{message}</p>
    </div>
  )
}

// Page header
export function PageHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gold/20">
      <h2 className="font-playfair font-bold text-brown text-2xl">{title}</h2>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}

// Toast
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: { bg: 'linear-gradient(135deg, #2C1A0E, #3D2314)', border: 'rgba(196,149,106,0.35)', color: '#F0E6D3', accent: '#C4956A' },
    error:   { bg: 'linear-gradient(135deg, #3D1A1A, #5C2020)', border: 'rgba(226,75,74,0.35)',   color: '#FFE4E4', accent: '#E07070' },
  }[type]

  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, minWidth: '320px', maxWidth: '500px',
      background: styles.bg,
      border: `1.5px solid ${styles.border}`,
      borderRadius: '16px', padding: '14px 18px',
      boxShadow: '0 8px 40px rgba(44,26,14,0.32), 0 2px 8px rgba(44,26,14,0.18)',
      display: 'flex', alignItems: 'center', gap: '12px',
      animation: 'toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Icon */}
      <div style={{
        width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
        background: `rgba(${type === 'success' ? '196,149,106' : '226,75,74'},0.18)`,
        border: `1px solid ${styles.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {type === 'success'
          ? <CheckCircle2 size={18} strokeWidth={2.2} color={styles.accent} />
          : <XCircle     size={18} strokeWidth={2.2} color={styles.accent} />
        }
      </div>

      {/* Message */}
      <span style={{
        flex: 1, fontSize: '13px', fontWeight: 600,
        color: styles.color, fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.4,
      }}>
        {message}
      </span>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.07)', border: `1px solid ${styles.border}`,
          borderRadius: '8px', cursor: 'pointer',
          color: styles.accent, width: '26px', height: '26px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s',
        }}
      >
        <XCircle size={14} strokeWidth={2.2} />
      </button>
    </div>
  )
}
