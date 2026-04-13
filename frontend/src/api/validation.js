export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const SL_MOBILE_REGEX = /^07\d{8}$/

export function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 10)
}

export function isValidEmail(value = '') {
  const email = String(value).trim()
  if (!email) return false
  return EMAIL_REGEX.test(email)
}

export function isValidSriLankanMobile(value = '') {
  const phone = String(value).trim()
  if (!phone) return false
  return SL_MOBILE_REGEX.test(phone)
}

export function isPositiveNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0
}
