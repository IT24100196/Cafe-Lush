import api from './axios'

/**
 * GET /reports/monthly/?month=YYYY-MM
 * Admin only. Aggregates income across all revenue streams for the given month.
 *
 * Response shape:
 * {
 *   month:            string,   // e.g. "2025-06"
 *   meal_income:      number,   // sum of meal order payments
 *   pos_income:       number,   // sum of paid POS orders
 *   event_income:     number,   // sum of completed event totals
 *   commissions_paid: number,   // sum of paid partner commissions (cost)
 *   net_profit:       number    // (meal + pos + event) − commissions_paid
 * }
 *
 * @param {string} month — format 'YYYY-MM', e.g. '2025-06'
 */
export const getMonthlyReport = (month) =>
  api.get('/reports/monthly/', { params: { month } })
