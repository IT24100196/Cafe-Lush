export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const EMAIL_MAX_LENGTH = 254
export const SL_MOBILE_REGEX = /^07\d{8}$/
export const FULL_NAME_REGEX = /^[\p{L}]+(?:\s+[\p{L}]+)*$/u
export const USERNAME_REGEX = /^(?=.*[A-Za-z])[A-Za-z0-9._-]{3,30}$/
export const FULL_NAME_MAX_LENGTH = 150
export const PASSWORD_MIN_LENGTH = 8

export function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 10)
}

export function isValidEmail(value = '') {
  const email = String(value).trim()
  if (!email) return false
  if (email.length > EMAIL_MAX_LENGTH) return false
  return EMAIL_REGEX.test(email)
}

export function isValidSriLankanMobile(value = '') {
  const phone = String(value).trim()
  if (!phone) return false
  return SL_MOBILE_REGEX.test(phone)
}

export function isValidFullName(value = '') {
  const fullName = String(value).trim().replace(/\s+/g, ' ')
  if (!fullName) return false
  if (fullName.length > FULL_NAME_MAX_LENGTH) return false
  return FULL_NAME_REGEX.test(fullName)
}

export function isValidUsername(value = '') {
  const username = String(value).trim()
  if (!username) return false
  return USERNAME_REGEX.test(username)
}

export function isValidPassword(value = '') {
  const password = String(value)
  if (password.length < PASSWORD_MIN_LENGTH) return false
  if (/^\d+$/.test(password)) return false
  return true
}

export function isPositiveNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0
}
