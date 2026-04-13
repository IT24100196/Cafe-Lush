import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { forgotPassword, requestStudentRegistrationOtp, resetPassword, verifyResetOtp, verifyStudentRegistrationOtp } from '../api/authService'
import { isValidEmail, isValidSriLankanMobile, normalizePhone } from '../api/validation'
import { Spinner } from '../components/UI'
import { useGoogleLogin } from '@react-oauth/google'

function GoogleLoginButton({ onSuccess, onError }) {
  const googleLogin = useGoogleLogin({
    onSuccess,
    onError,
    flow: 'implicit',
  })
  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        padding: '13px 20px', borderRadius: '16px', cursor: 'pointer',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(236,206,145,0.28)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        color: '#fff7ea', fontSize: '14px', fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.5l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
      </svg>
      Sign in with Google
    </button>
  )
}

const ROLE_ROUTES = { student: '/student', cashier: '/cashier', admin: '/admin' }

const EMPTY_REG = {
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  full_name: '',
  contact: '',
}

const EMPTY_RESET = {
  identifier: '',
  otp: '',
  password: '',
  confirm_password: '',
}

if (typeof document !== 'undefined' && !document.getElementById('cafe-lush-fonts')) {
  const link = document.createElement('link')
  link.id = 'cafe-lush-fonts'
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap'
  document.head.appendChild(link)
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/>
    </svg>
  )
}

function IconId() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 12a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm7 4H7v-.5C7 14 8 13 9 13s2 1 2 2.5V16h5v-1c0-1.1-.9-2-2-2h-1v-1h1a3 3 0 0 1 3 3v1z"/>
    </svg>
  )
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5C21.3 7.6 17 4.5 12 4.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 7c2.8 0 5 2.2 5 5 0 .6-.1 1.2-.4 1.8l2.9 2.9c1.5-1.3 2.7-3 3.4-4.7C21.3 7.6 17 4.5 12 4.5c-1.4 0-2.7.3-3.9.7l2.1 2.1c.6-.2 1.2-.3 1.8-.3zM2 4.3l2.3 2.3C2.7 7.9 1.4 9.8.7 12 2.4 16.4 6.7 19.5 12 19.5c1.7 0 3.3-.4 4.7-1l2.7 2.7 1.4-1.4L3.4 2.9 2 4.3zm7.5 7.5 1.6 1.6c-.1.2-.1.4-.1.6a2 2 0 0 0 2 2c.2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5a5 5 0 0 1-5-5c0-.8.2-1.5.5-2.2zm4.3-.8 3.3 3.3V14a5 5 0 0 0-5-5h.1l3.3 3.3-1.7-1.3z"/>
    </svg>
  )
}

function FeaturePill({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '10px 16px', borderRadius: '999px',
      border: '1px solid rgba(255,255,255,0.16)',
      background: 'rgba(255,255,255,0.08)',
      color: '#f8e8c9', fontSize: '13px', fontWeight: 600,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 10px 24px rgba(0,0,0,0.16)', letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  )
}

function InputField({ label, icon, type = 'text', placeholder, value, onChange, required, autoFocus, rightElement, minLength, compact }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: compact ? '8px' : '1rem' }}>
      <label style={{
        display: 'block', marginBottom: compact ? '4px' : '8px',
        color: 'rgba(247,229,196,0.88)', fontSize: compact ? '10px' : '12px',
        fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {label}
        {required ? <span style={{ color: '#ff9d82', marginLeft: 4 }}>*</span> : null}
      </label>
      <div style={{
        position: 'relative', borderRadius: compact ? '10px' : '16px',
        background: focused ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.09)',
        border: focused ? '1px solid rgba(230,190,115,0.72)' : '1px solid rgba(236,206,145,0.18)',
        boxShadow: focused ? '0 0 0 3px rgba(201,133,58,0.14)' : 'none',
        transition: 'all 0.22s ease',
      }}>
        <span style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          color: focused ? '#f5c842' : 'rgba(247,229,196,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </span>
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          required={required} autoFocus={autoFocus} minLength={minLength}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: compact ? '9px 36px 9px 38px' : '15px 48px 15px 44px',
            border: 'none', outline: 'none', background: 'transparent',
            color: '#fff7ea', fontSize: compact ? '13px' : '14px', fontWeight: 500,
            boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
          }}
        />
        {rightElement && (
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login, loading, setUser } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError,      setLoginError]      = useState('')
  const [loginInfo,       setLoginInfo]       = useState('')
  const [deactivatedMsg,  setDeactivatedMsg]  = useState('')
  const [regForm, setRegForm] = useState(EMPTY_REG)
  const [regError, setRegError] = useState('')
  const [regMessage, setRegMessage] = useState('')
  const [regBusy, setRegBusy] = useState(false)
  const [regStep, setRegStep] = useState('form')
  const [regOtp, setRegOtp] = useState('')
  const [resetForm, setResetForm] = useState(EMPTY_RESET)
  const [resetStep, setResetStep] = useState('request')
  const [resetToken, setResetToken] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)
  const [showResetPass, setShowResetPass] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 980)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pageStyle = useMemo(() => ({
    minHeight: '100vh', position: 'relative', overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
    backgroundImage: "url('/image/image7.png')",
    backgroundSize: 'cover', backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed',
    display: 'flex', alignItems: 'stretch', justifyContent: 'center',
  }), [])

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginInfo('')
    setDeactivatedMsg('')
    try {
      const user = await login(loginForm.username, loginForm.password)
      navigate(ROLE_ROUTES[user.role?.name] || '/login', { replace: true })
    } catch (err) {
      const data = err.response?.data
      const raw  = Array.isArray(data?.detail) ? data.detail[0] : (data?.detail || 'Invalid username or password.')
      const msg  = typeof raw === 'string' ? raw : 'Invalid username or password.'
      if (msg.startsWith('DEACTIVATED:')) {
        setDeactivatedMsg(msg.replace('DEACTIVATED:', '').trim())
      } else {
        setLoginError(msg)
      }
    }
  }

  // ── Google Login ─────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (tokenResponse) => {
    setLoginError('')
    try {
      const res = await fetch('/api/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tokenResponse.access_token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google login failed.')
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      navigate(ROLE_ROUTES[data.user?.role?.name] || '/student', { replace: true })
    } catch (err) {
      setLoginError(err.message || 'Google sign-in failed. Please try again.')
    }
  }

  const handleGoogleError = () => {
    setLoginError('Google sign-in was cancelled or failed. Please try again.')
  }

  // ── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegMessage('')

    const username = regForm.username.trim()
    const fullName = regForm.full_name.trim()
    const email = regForm.email.trim()
    const contact = regForm.contact.trim()

    if (!username) {
      setRegError('Username is required.')
      return
    }
    if (!fullName) {
      setRegError('Full name is required.')
      return
    }
    if (!email) {
      setRegError('Email is required for OTP verification.')
      return
    }
    if (!isValidEmail(email)) {
      setRegError('Enter a valid email address (example: user@example.com).')
      return
    }
    if (contact && !isValidSriLankanMobile(contact)) {
      setRegError('Enter a valid Sri Lankan mobile number (example: 0771234567 or +94771234567).')
      return
    }
    if (regForm.password !== regForm.confirm_password) {
      setRegError('Passwords do not match.')
      return
    }

    setRegBusy(true)
    try {
      const payload = {
        ...regForm,
        username,
        full_name: fullName,
        email,
        contact: contact ? normalizePhone(contact) : '',
      }
      const { data } = await requestStudentRegistrationOtp(payload)
      setRegForm(payload)
      setRegOtp('')
      setRegStep('otp')
      setRegMessage(data.detail || 'OTP sent to your email.')
    } catch (err) {
      setRegError(getAuthErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setRegBusy(false)
    }
  }

  const resetRegistrationFlow = () => {
    setRegForm(EMPTY_REG)
    setRegStep('form')
    setRegOtp('')
    setRegError('')
    setRegMessage('')
    setShowRegPass(false)
  }

  const resetPasswordFlow = () => {
    setResetForm(EMPTY_RESET)
    setResetStep('request')
    setResetToken('')
    setResetError('')
    setResetMessage('')
    setShowResetPass(false)
  }

  const getAuthErrorMessage = (err, fallback) => {
    const data = err.response?.data
    if (typeof data?.detail === 'string') return data.detail
    if (data && typeof data === 'object') {
      const first = Object.values(data)[0]
      if (Array.isArray(first)) return first[0]
      if (typeof first === 'string') return first
    }
    return fallback
  }

  const handleVerifyRegistrationOtp = async (e) => {
    e.preventDefault()
    const otp = regOtp.trim()
    if (otp.length !== 6) {
      setRegError('Enter the 6 digit OTP.')
      return
    }

    setRegBusy(true)
    setRegError('')
    setRegMessage('')
    try {
      const user = await verifyStudentRegistrationOtp(regForm.email, otp)
      resetRegistrationFlow()
      navigate(ROLE_ROUTES[user.role?.name] || '/student', { replace: true })
    } catch (err) {
      setRegError(getAuthErrorMessage(err, 'Invalid or expired OTP.'))
    } finally {
      setRegBusy(false)
    }
  }

  const handleSendResetOtp = async (e) => {
    e.preventDefault()
    const identifier = resetForm.identifier.trim()
    if (!identifier) {
      setResetError('Enter your username or email.')
      return
    }

    setResetBusy(true)
    setResetError('')
    setResetMessage('')
    try {
      const { data } = await forgotPassword(identifier)
      setResetForm((prev) => ({ ...prev, identifier }))
      setResetMessage(data.detail || 'Reset code sent.')
      setResetStep('verify')
    } catch (err) {
      setResetError(getAuthErrorMessage(err, 'Could not send OTP. Please try again.'))
    } finally {
      setResetBusy(false)
    }
  }

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault()
    const identifier = resetForm.identifier.trim()
    const otp = resetForm.otp.trim()
    if (!otp) {
      setResetError('Enter the OTP from your email.')
      return
    }

    setResetBusy(true)
    setResetError('')
    setResetMessage('')
    try {
      const { data } = await verifyResetOtp(identifier, otp)
      setResetToken(data.reset_token || '')
      setResetMessage(data.detail || 'OTP verified. Enter your new password.')
      setResetStep('reset')
    } catch (err) {
      setResetError(getAuthErrorMessage(err, 'Invalid or expired OTP.'))
    } finally {
      setResetBusy(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetToken) {
      setResetError('Verify OTP before resetting password.')
      return
    }
    if (resetForm.password !== resetForm.confirm_password) {
      setResetError('Passwords do not match.')
      return
    }

    setResetBusy(true)
    setResetError('')
    setResetMessage('')
    try {
      await resetPassword(resetForm.identifier.trim(), resetToken, resetForm.password, resetForm.confirm_password)
      resetPasswordFlow()
      setTab('login')
      setLoginError('')
      setLoginInfo('Password reset successfully. Please log in with your new password.')
      setDeactivatedMsg('')
      setLoginForm({ username: '', password: '' })
    } catch (err) {
      setResetError(getAuthErrorMessage(err, 'Could not reset password. Please try again.'))
    } finally {
      setResetBusy(false)
    }
  }

  const switchTab = (nextTab) => {
    setTab(nextTab)
    setLoginError('')
    setLoginInfo('')
    setRegError('')
    setDeactivatedMsg('')
    if (nextTab !== 'register') resetRegistrationFlow()
    if (nextTab !== 'forgot') resetPasswordFlow()
  }

  const submitBtnStyle = (busy) => ({
    width: '100%', border: 'none', borderRadius: '16px',
    padding: '15px 18px', marginTop: '8px',
    background: 'linear-gradient(135deg, #d69b3d 0%, #b66f1e 100%)',
    color: '#fffaf2', fontSize: '15px', fontWeight: 800, letterSpacing: '0.03em',
    cursor: busy ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    boxShadow: '0 18px 34px rgba(182,111,30,0.34)', opacity: busy ? 0.7 : 1,
  })

  const tabBtnStyle = (active) => ({
    flex: 1, border: 'none', borderRadius: '12px', padding: '12px 14px',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px', fontWeight: 700, transition: 'all 0.2s ease',
    background: active
      ? 'linear-gradient(135deg, rgba(214,162,81,0.28), rgba(160,94,18,0.22))'
      : 'transparent',
    color: active ? '#fff4dc' : 'rgba(255,233,196,0.56)',
    boxShadow: active ? 'inset 0 0 0 1px rgba(255,224,169,0.20)' : 'none',
  })

  const errorBoxStyle = {
    marginBottom: '16px', borderRadius: '14px', padding: '12px 14px',
    background: 'rgba(217,80,56,0.14)',
    border: '1px solid rgba(255,131,104,0.24)',
    color: '#ffd5cc', fontSize: '13px',
  }

  const eyeBtnStyle = {
    border: 'none', background: 'transparent',
    color: 'rgba(255,231,192,0.72)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  }

  return (
    <div style={pageStyle}>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(110deg, rgba(6,3,1,0.62) 0%, rgba(10,6,3,0.48) 42%, rgba(14,8,3,0.58) 100%)',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 16% 38%, rgba(201,133,58,0.22), transparent 32%), radial-gradient(circle at 75% 20%, rgba(241,192,97,0.10), transparent 24%)',
      }} />

      {/* Gold divider */}
      {!isMobile && (
        <div style={{
          position: 'absolute', left: '54%', top: '8%', bottom: '8%', width: '1px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(201,155,61,0.55) 25%, rgba(230,185,90,0.80) 50%, rgba(201,155,61,0.55) 75%, transparent 100%)',
          zIndex: 3, pointerEvents: 'none',
        }} />
      )}

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: '1440px', minHeight: '100vh',
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.08fr 0.92fr',
        alignItems: 'center',
        padding: isMobile ? '24px' : '48px 52px',
        boxSizing: 'border-box', gap: isMobile ? '8px' : '0px',
      }}>

        {/* ── LEFT — Branding ── */}
        <section style={{
          position: 'relative', zIndex: 2,
          padding: isMobile ? '12px 4px 0' : '32px 48px 32px 20px',
          display: 'flex', alignItems: 'center',
          minHeight: isMobile ? 'auto' : '100%',
        }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px', padding: '10px 14px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}>
              <img
                src="/image/image6.jpeg" alt="Cafe Lush logo"
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px rgba(201,168,76,0.92), 0 0 20px rgba(201,168,76,0.28)' }}
              />
              <div>
                <div style={{ color: '#fff4df', fontWeight: 700, fontSize: '15px', letterSpacing: '0.03em' }}>Cafe Lush</div>
                <div style={{ color: 'rgba(245,223,189,0.74)', fontSize: '12px', fontWeight: 600 }}>Where Every Order Meets Excellence</div>
              </div>
            </div>

            <h1 style={{
              margin: 0, color: '#fff7eb',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? '52px' : '92px',
              lineHeight: isMobile ? 0.95 : 0.9,
              fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase',
              textShadow: '0 4px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.28)',
            }}>
              Welcome to<br />Cafe Lush
            </h1>

            <p style={{
              marginTop: '22px', marginBottom: '28px', maxWidth: '560px',
              color: 'rgba(255,240,219,0.84)',
              fontSize: isMobile ? '15px' : '18px', lineHeight: 1.8, fontWeight: 400,
            }}>
              Manage orders, staff access, student registration, and daily restaurant
              operations in one premium modern system built for speed and simplicity.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: isMobile ? '6px' : '0' }}>
              <FeaturePill>Order Management</FeaturePill>
              <FeaturePill>Staff Access</FeaturePill>
              <FeaturePill>Live Operations</FeaturePill>
            </div>
          </div>
        </section>

        {/* ── RIGHT — Auth Card ── */}
        <section style={{
          position: 'relative', zIndex: 3,
          display: 'flex',
          justifyContent: isMobile ? 'stretch' : 'center',
          alignItems: 'center',
          padding: isMobile ? '0' : '32px 20px 32px 48px',
        }}>
          <div style={{
            width: '100%', maxWidth: tab === 'register' ? '520px' : '500px',
            background: 'rgba(255,250,242,0.16)', border: '1px solid rgba(255,230,185,0.30)',
            borderRadius: '28px', padding: isMobile ? '20px 16px' : tab === 'register' ? '22px 26px' : '32px',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            boxShadow: '0 8px 12px rgba(0,0,0,0.12), 0 32px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.06)',
            maxHeight: '96vh', overflowY: 'auto',
          }}>

            {/* Card header */}
            <div style={{ marginBottom: tab === 'register' ? '10px' : '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                  width: tab === 'register' ? '34px' : '42px',
                  height: tab === 'register' ? '34px' : '42px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #d7a347 0%, #b8751c 100%)',
                  color: '#fffdf8', fontWeight: 800, fontSize: tab === 'register' ? '13px' : '16px',
                  boxShadow: '0 12px 26px rgba(184,117,28,0.28)',
                }}>C</div>
                <div>
                  <div style={{ color: '#fff5e1', fontWeight: 700, fontSize: tab === 'register' ? '17px' : '22px' }}>
                    {tab === 'login' ? 'Login' : tab === 'forgot' ? 'Reset Password' : 'Create Account'}
                  </div>
                  <div style={{ color: 'rgba(255,234,205,0.72)', fontSize: '12px' }}>
                    {tab === 'forgot' ? 'Verify your OTP before choosing a new password' : 'Access the Cafe Lush management platform'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '6px', padding: '5px', marginBottom: tab === 'register' ? '12px' : '22px',
              borderRadius: '14px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,227,182,0.12)',
            }}>
              <button type="button" onClick={() => switchTab('login')} style={tabBtnStyle(tab === 'login')}>Sign In</button>
              <button type="button" onClick={() => switchTab('register')} style={tabBtnStyle(tab === 'register')}>Student Register</button>
            </div>

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <>
                {loginInfo && (
                  <div style={{ marginBottom: '16px', borderRadius: '14px', padding: '12px 14px', background: 'rgba(32,128,84,0.16)', border: '1px solid rgba(126,220,170,0.26)', color: '#d8ffe9', fontSize: '13px' }}>
                    {loginInfo}
                  </div>
                )}
                {loginError && <div style={errorBoxStyle}>{loginError}</div>}

                {deactivatedMsg && (
                  <div style={{ marginBottom: '16px', borderRadius: '14px', padding: '14px 16px', background: 'rgba(180,30,30,0.18)', border: '1px solid rgba(255,100,80,0.35)', color: '#ffd5cc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>🚫</span>
                      <span style={{ fontWeight: 800, fontSize: '14px' }}>Account Deactivated</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, opacity: 0.9 }}>{deactivatedMsg}</p>
                    <p style={{ margin: '8px 0 0', fontSize: '11px', opacity: 0.6 }}>Please contact the administrator if you believe this is a mistake.</p>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <InputField
                    label="Username" icon={<IconUser />}
                    placeholder="Enter your username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required autoFocus
                  />
                  <InputField
                    label="Password" icon={<IconLock />}
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    rightElement={
                      <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} style={eyeBtnStyle}>
                        {showLoginPass ? <IconEyeOff /> : <IconEye />}
                      </button>
                    }
                  />
                  <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => switchTab('forgot')}
                      style={{ border: 'none', background: 'transparent', color: '#f0c570', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading} style={submitBtnStyle(loading)}>
                    {loading ? <Spinner size="sm" /> : null}
                    {loading ? 'Signing in...' : 'Login'}
                  </button>
                </form>

                {/* ── Divider ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,210,140,0.18)' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,220,170,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,210,140,0.18)' }} />
                </div>

                {/* ── Google Button ── */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLoginButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                </div>


              </>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab === 'forgot' && (
              <>
                <p style={{ color: 'rgba(255,237,212,0.78)', fontSize: '13px', marginTop: 0, marginBottom: '14px', lineHeight: 1.6 }}>
                  Enter your username to receive an OTP. If an email is shared by multiple staff accounts, use the username.
                </p>

                {resetError && <div style={errorBoxStyle}>{resetError}</div>}
                {resetMessage && (
                  <div style={{ marginBottom: '16px', borderRadius: '14px', padding: '12px 14px', background: 'rgba(32,128,84,0.16)', border: '1px solid rgba(126,220,170,0.26)', color: '#d8ffe9', fontSize: '13px' }}>
                    {resetMessage}
                  </div>
                )}

                {resetStep === 'request' && (
                  <form onSubmit={handleSendResetOtp}>
                    <InputField
                      label="Username or Email"
                      icon={<IconUser />}
                      placeholder="Enter your username or unique email"
                      value={resetForm.identifier}
                      onChange={(e) => setResetForm({ ...resetForm, identifier: e.target.value })}
                      required
                      autoFocus
                    />
                    <button type="submit" disabled={resetBusy} style={submitBtnStyle(resetBusy)}>
                      {resetBusy ? <Spinner size="sm" /> : null}
                      {resetBusy ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  </form>
                )}

                {resetStep === 'verify' && (
                  <form onSubmit={handleVerifyResetOtp}>
                    <InputField
                      label="OTP"
                      icon={<IconLock />}
                      placeholder="Enter 6 digit OTP"
                      value={resetForm.otp}
                      onChange={(e) => setResetForm({ ...resetForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      required
                      autoFocus
                    />
                    <button type="submit" disabled={resetBusy} style={submitBtnStyle(resetBusy)}>
                      {resetBusy ? <Spinner size="sm" /> : null}
                      {resetBusy ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetStep('request'); setResetToken(''); setResetError(''); setResetMessage('') }}
                      style={{ marginTop: '12px', width: '100%', border: '1px solid rgba(255,227,182,0.22)', borderRadius: '14px', padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#f0c570', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Send a new OTP
                    </button>
                  </form>
                )}

                {resetStep === 'reset' && (
                  <form onSubmit={handleResetPassword}>
                    <InputField
                      label="New Password"
                      icon={<IconLock />}
                      type={showResetPass ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={resetForm.password}
                      onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                      required
                      minLength={6}
                      autoFocus
                      rightElement={
                        <button type="button" onClick={() => setShowResetPass(!showResetPass)} style={eyeBtnStyle}>
                          {showResetPass ? <IconEyeOff /> : <IconEye />}
                        </button>
                      }
                    />
                    <InputField
                      label="Confirm Password"
                      icon={<IconLock />}
                      type={showResetPass ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={resetForm.confirm_password}
                      onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button type="submit" disabled={resetBusy} style={submitBtnStyle(resetBusy)}>
                      {resetBusy ? <Spinner size="sm" /> : null}
                      {resetBusy ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                )}

                <p style={{ textAlign: 'center', marginTop: '14px', marginBottom: 0, color: 'rgba(255,233,201,0.68)', fontSize: '12px' }}>
                  Remembered your password?{' '}
                  <button type="button" onClick={() => switchTab('login')}
                    style={{ border: 'none', background: 'transparent', color: '#f0c570', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}>
                    Back to login
                  </button>
                </p>
              </>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <>
                <p style={{ color: 'rgba(255,237,212,0.78)', fontSize: '12px', marginTop: 0, marginBottom: '10px', lineHeight: 1.5 }}>
                  Create your student account to start placing meal orders.
                </p>

                {regError && <div style={{ ...errorBoxStyle, padding: '8px 12px', fontSize: '12px', marginBottom: '10px' }}>{regError}</div>}
                {regMessage && (
                  <div style={{ marginBottom: '10px', borderRadius: '14px', padding: '8px 12px', background: 'rgba(32,128,84,0.16)', border: '1px solid rgba(126,220,170,0.26)', color: '#d8ffe9', fontSize: '12px' }}>
                    {regMessage}
                  </div>
                )}

                {regStep === 'form' ? (
                  <form onSubmit={handleRegister}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <InputField compact label="Full Name" icon={<IconUser />} placeholder="Enter your full name"
                          value={regForm.full_name} onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })} required />
                      </div>
                      <InputField compact label="Username" icon={<IconUser />} placeholder="Choose a username"
                        value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} required />
                      <InputField compact label="Contact" icon={<IconPhone />} placeholder="07xxxxxxxx"
                        value={regForm.contact} onChange={(e) => setRegForm({ ...regForm, contact: e.target.value })} />
                      <div style={{ gridColumn: '1 / -1' }}>
                        <InputField compact label="Email" icon={<IconMail />} type="email" placeholder="Enter email address"
                          value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} required />
                      </div>
                      <InputField compact label="Password" icon={<IconLock />}
                        type={showRegPass ? 'text' : 'password'} placeholder="Min 6 characters"
                        value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        required minLength={6}
                        rightElement={
                          <button type="button" onClick={() => setShowRegPass(!showRegPass)} style={eyeBtnStyle}>
                            {showRegPass ? <IconEyeOff /> : <IconEye />}
                          </button>
                        }
                      />
                      <InputField compact label="Confirm Password" icon={<IconLock />}
                        type={showRegPass ? 'text' : 'password'} placeholder="Repeat password"
                        value={regForm.confirm_password} onChange={(e) => setRegForm({ ...regForm, confirm_password: e.target.value })} required />
                    </div>

                    <button type="submit" disabled={regBusy} style={{ ...submitBtnStyle(regBusy), padding: '11px 18px', marginTop: '6px', fontSize: '14px' }}>
                      {regBusy ? <Spinner size="sm" /> : null}
                      {regBusy ? 'Sending OTP...' : 'Send Email OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyRegistrationOtp}>
                    <InputField compact label="Email" icon={<IconMail />} type="email" placeholder="Email address"
                      value={regForm.email} onChange={() => {}} required />
                    <InputField compact label="OTP" icon={<IconLock />} placeholder="Enter 6 digit OTP"
                      value={regOtp} onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus />
                    <button type="submit" disabled={regBusy} style={{ ...submitBtnStyle(regBusy), padding: '11px 18px', marginTop: '6px', fontSize: '14px' }}>
                      {regBusy ? <Spinner size="sm" /> : null}
                      {regBusy ? 'Verifying...' : 'Verify OTP & Create Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRegStep('form'); setRegOtp(''); setRegError(''); setRegMessage('') }}
                      style={{ marginTop: '10px', width: '100%', border: '1px solid rgba(255,227,182,0.22)', borderRadius: '14px', padding: '10px', background: 'rgba(255,255,255,0.06)', color: '#f0c570', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}
                    >
                      Edit details or resend OTP
                    </button>
                  </form>
                )}

                <p style={{ textAlign: 'center', marginTop: '12px', marginBottom: 0, color: 'rgba(255,233,201,0.68)', fontSize: '12px' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchTab('login')}
                    style={{ border: 'none', background: 'transparent', color: '#f0c570', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}>
                    Sign in here
                  </button>
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 3, color: 'rgba(255,230,194,0.56)', fontSize: '11px',
        letterSpacing: '0.06em', textAlign: 'center', width: '100%',
        padding: '0 12px', boxSizing: 'border-box',
      }}>
        © 2025 AxionSoft. All rights reserved. | Privacy Policy | Terms of Use
      </div>
    </div>
  )
}
