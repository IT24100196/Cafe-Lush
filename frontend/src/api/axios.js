import axios from 'axios'

const BASE_URL = '/api'

// ── Main API instance ─────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL })

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent refresh on 401, hard redirect on refresh failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Only attempt refresh once per request
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const refresh = localStorage.getItem('refresh')
      if (!refresh) {
        _clearAndRedirect()
        return Promise.reject(error)
      }

      try {
        // Use a plain axios call (not `api`) to avoid interceptor loop
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
        localStorage.setItem('access', data.access)
        // Retry the original request with the new token
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        _clearAndRedirect()
      }
    }

    return Promise.reject(error)
  }
)

function _clearAndRedirect() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export default api
