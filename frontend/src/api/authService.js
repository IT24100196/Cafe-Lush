import axios from 'axios'
import api from './axios'

const BASE_URL = '/api'

/**
 * POST /auth/register/student/
 * Public — self-registration for students.
 * Creates both the User account and the Student profile in one call.
 * Returns { access, refresh, user } so the student is logged in immediately.
 *
 * @param {{ username, password, full_name, student_code, email?, contact? }} data
 */
export async function studentRegister(data) {
  const { data: res } = await axios.post(`${BASE_URL}/auth/register/student/`, data)
  localStorage.setItem('access',  res.access)
  localStorage.setItem('refresh', res.refresh)
  localStorage.setItem('user',    JSON.stringify(res.user))
  return res.user
}

export function requestStudentRegistrationOtp(data) {
  return axios.post(`${BASE_URL}/auth/register/student/request-otp/`, data)
}

export async function verifyStudentRegistrationOtp(email, otp) {
  const { data } = await axios.post(`${BASE_URL}/auth/register/student/verify/`, { email, otp })
  localStorage.setItem('access',  data.access)
  localStorage.setItem('refresh', data.refresh)
  localStorage.setItem('user',    JSON.stringify(data.user))
  return data.user
}

/**
 * POST /auth/login/
 * Returns { access, refresh, user }
 * Stores tokens + user in localStorage
 */
export async function login(username, password) {
  const { data } = await axios.post(`${BASE_URL}/auth/login/`, { username, password })
  localStorage.setItem('access',  data.access)
  localStorage.setItem('refresh', data.refresh)
  localStorage.setItem('user',    JSON.stringify(data.user))
  return data.user
}

export function forgotPassword(identifier) {
  return axios.post(`${BASE_URL}/auth/forgot-password/`, { identifier })
}

export function verifyResetOtp(identifier, otp) {
  return axios.post(`${BASE_URL}/auth/verify-reset-otp/`, { identifier, otp })
}

export function resetPassword(identifier, resetToken, password, confirmPassword) {
  return axios.post(`${BASE_URL}/auth/reset-password/`, {
    identifier,
    reset_token: resetToken,
    password,
    confirm_password: confirmPassword,
  })
}

/**
 * POST /auth/logout/
 * Blacklists the refresh token, then clears localStorage
 */
export async function logout() {
  const refresh = localStorage.getItem('refresh')
  try {
    if (refresh) await api.post('/auth/logout/', { refresh })
  } catch {
    // Proceed with local cleanup even if server call fails
  } finally {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
  }
}

/**
 * POST /auth/refresh/
 * Silently refreshes the access token using the stored refresh token.
 * Returns the new access token string, or null on failure.
 */
export async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh')
  if (!refresh) return null
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
    localStorage.setItem('access', data.access)
    return data.access
  } catch {
    return null
  }
}

/**
 * GET /auth/profile/
 * Returns the currently authenticated user object.
 */
export function getProfile() {
  return api.get('/auth/profile/')
}

/**
 * Checks whether the stored access token is still valid by
 * decoding its exp claim (no network call needed).
 * Returns true if valid, false if expired or missing.
 */
export function isTokenValid() {
  const token = localStorage.getItem('access')
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

/**
 * On app load: verify token, refresh if expired, return user or null.
 */
export async function initAuth() {
  if (isTokenValid()) {
    try {
      const { data } = await getProfile()
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch {
      return null
    }
  }

  // Token expired — try silent refresh
  const newToken = await refreshAccessToken()
  if (!newToken) return null

  try {
    const { data } = await getProfile()
    localStorage.setItem('user', JSON.stringify(data))
    return data
  } catch {
    return null
  }
}
