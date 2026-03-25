import api from './axios'

// ── Partner Branches ──────────────────────────────────────────────────────────

/**
 * GET /partners/branches/
 * Returns all branches (local + partner hotels). Admin only.
 */
export const getPartners = () =>
  api.get('/partners/branches/')

/**
 * POST /partners/branches/
 * Creates a branch. Set is_partner=true and commission_rate for partner hotels.
 *
 * @param {{
 *   name: string,
 *   address?: string,
 *   contact?: string,
 *   is_partner: boolean,
 *   commission_rate: number  // e.g. 12.50 means 12.50%
 * }} data
 */
export const createPartner = (data) =>
  api.post('/partners/branches/', data)

/**
 * PUT /partners/branches/:id/
 * Full update of a branch record.
 */
export const updatePartner = (id, data) =>
  api.put(`/partners/branches/${id}/`, data)

/**
 * DELETE /partners/branches/:id/
 */
export const deletePartner = (id) =>
  api.delete(`/partners/branches/${id}/`)

// ── Commission Transactions ───────────────────────────────────────────────────

/**
 * GET /partners/transactions/
 * Returns all partner commission records.
 * Each record: { id, branch, branch_name, event, event_name,
 *                commission_amount, status, created_at }
 * Status values: 'pending' | 'paid' | 'cancelled'
 */
export const getCommissions = () =>
  api.get('/partners/transactions/')
