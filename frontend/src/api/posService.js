import api from './axios'

// ── Categories ────────────────────────────────────────────────────────────────

/** GET /pos/categories/ */
export const getCategories = () =>
  api.get('/pos/categories/')

/** POST /pos/categories/ */
export const createCategory = (data) =>
  api.post('/pos/categories/', data)

// ── Items ─────────────────────────────────────────────────────────────────────

/** GET /pos/items/ */
export const getItems = () =>
  api.get('/pos/items/')

/** POST /pos/items/ */
export const createItem = (data) =>
  api.post('/pos/items/', data)

/** PUT /pos/items/:id/ */
export const updateItem = (id, data) =>
  api.put(`/pos/items/${id}/`, data)

/** DELETE /pos/items/:id/ */
export const deleteItem = (id) =>
  api.delete(`/pos/items/${id}/`)

// ── POS Orders ────────────────────────────────────────────────────────────────

/**
 * POST /pos/orders/
 * Payload: { items: [{ item_id, quantity }] }
 * Backend auto-calculates total from item prices.
 * Returns full order with itemized breakdown.
 *
 * @param {Array<{ item_id: number, quantity: number }>} items
 */
export const createPosOrder = (items) =>
  api.post('/pos/orders/', { items })

// ── Daily Sales Summary ───────────────────────────────────────────────────────

/**
 * GET /pos/orders/summary/?date=YYYY-MM-DD
 * Returns { date, total_orders, total_sales }
 * Defaults to today if date is omitted.
 *
 * @param {string} [date] — ISO date string e.g. '2025-06-01'
 */
export const getDailySales = (date) => {
  const params = date ? { date } : {}
  return api.get('/pos/orders/summary/', { params })
}
