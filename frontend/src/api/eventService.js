import api from './axios'

/**
 * GET /events/
 * Returns all events. Admin only.
 */
export const getEvents = () =>
  api.get('/events/')

/**
 * POST /events/
 * Creates a new event. If assigned_branch is a partner hotel,
 * the backend auto-calculates and stores the commission.
 *
 * @param {{
 *   name: string,
 *   customer_name: string,
 *   customer_contact?: string,
 *   event_date: string,       // YYYY-MM-DD
 *   venue?: string,
 *   assigned_branch?: number, // Branch id, nullable
 *   total_amount: number
 * }} data
 */
export const createEvent = (data) =>
  api.post('/events/', data)

/**
 * PUT /events/:id/
 * Full update of an event record.
 * Re-calculates commission if assigned_branch changes.
 */
export const updateEvent = (id, data) =>
  api.put(`/events/${id}/`, data)

/**
 * PUT /events/:id/status/
 * Updates only the status field.
 * Valid values: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
 *
 * @param {number} id
 * @param {'inquiry'|'confirmed'|'completed'|'cancelled'} status
 */
export const updateEventStatus = (id, status) =>
  api.put(`/events/${id}/status/`, { status })

/**
 * DELETE /events/:id/
 */
export const deleteEvent = (id) =>
  api.delete(`/events/${id}/`)
