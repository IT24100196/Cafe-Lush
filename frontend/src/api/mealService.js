import api from './axios'

// ── Meal Types (Admin) ────────────────────────────────────────────────────────

/** GET /meals/types/ — list all meal types */
export const getMealTypes = () =>
  api.get('/meals/types/')

/** POST /meals/types/ — create a meal type */
export const createMealType = (data) =>
  api.post('/meals/types/', data)

/** PUT /meals/types/:id/ — update a meal type */
export const updateMealType = (id, data) =>
  api.put(`/meals/types/${id}/`, data)

/** DELETE /meals/types/:id/ */
export const deleteMealType = (id) =>
  api.delete(`/meals/types/${id}/`)

// ── Meal Orders ───────────────────────────────────────────────────────────────

/**
 * POST /meals/orders/
 * Payload: { student, meal_type, order_date }
 * Returns the created MealOrder object.
 * Backend enforces cutoff rules and returns 400 if cutoff has passed.
 */
export const placeOrder = (studentId, mealTypeId, orderDate) =>
  api.post('/meals/orders/', {
    student:    studentId,
    meal_type:  mealTypeId,
    order_date: orderDate,
  })

/**
 * GET /meals/orders/
 * For students  → returns their own order history.
 * For admins    → pass optional params { order_date, status } to filter.
 */
export const getOrderHistory = (params = {}) =>
  api.get('/meals/orders/', { params })
