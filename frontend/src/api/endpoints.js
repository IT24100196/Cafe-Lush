import api from './axios'

// Auth
export const login         = (data)        => api.post('/auth/login/', data)
export const logout        = (refresh)     => api.post('/auth/logout/', { refresh })
export const getProfile    = ()            => api.get('/auth/profile/')
export const updateProfile = (data)        => api.patch('/auth/profile/', data)

// Meal types & orders
export const getMealTypes  = ()            => api.get('/meals/types/')
export const createMealType = (data)       => api.post('/meals/types/', data)
export const updateMealType = (id, data)   => api.put(`/meals/types/${id}/`, data)
export const deleteMealType = (id)         => api.delete(`/meals/types/${id}/`)
export const getMealOrders        = ()            => api.get('/meals/orders/')
export const placeMealOrder       = (data)        => api.post('/meals/orders/', data)
export const placeMealOrdersBatch = (orders)      => api.post('/meals/orders/batch/', { orders })
export const getDeliveryAreas     = ()            => api.get('/meals/orders/delivery-areas/')
export const estimateDeliveryFee  = (data)        => api.post('/meals/orders/delivery-fee/', data)
export const updateOrderStatus    = (id, status)  => api.patch(`/meals/orders/${id}/status/`, { status })
export const updateOrderSessionStatus = (sessionId, status) => api.patch(`/meals/orders/session/${sessionId}/status/`, { status })
export const cancelStudentOrder   = (id)          => api.patch(`/meals/orders/${id}/cancel/`)
export const clearOrderHistory    = ()            => api.delete('/meals/orders/clear/')
export const getNotifications     = ()            => api.get('/meals/notifications/')
export const markNotificationsRead = ()           => api.patch('/meals/notifications/')
export const markAllNotificationsRead = ()        => api.patch('/meals/notifications/read-all/')
export const markNotificationRead = (id)          => api.patch(`/meals/notifications/${id}/read/`)
export const deleteNotification = (id)            => api.delete(`/meals/notifications/${id}/`)
export const deleteAllNotifications = ()          => api.delete('/meals/notifications/delete-all/')
export const deleteSelectedNotifications = (ids)  => api.post('/meals/notifications/bulk-delete/', { ids })

// POS — Categories
export const getCategories    = ()           => api.get('/pos/categories/')
export const createCategory   = (data)       => api.post('/pos/categories/', data)
export const updateCategory   = (id, data)   => api.patch(`/pos/categories/${id}/`, data)
export const deleteCategory   = (id)         => api.delete(`/pos/categories/${id}/`)
// POS — Items
export const getItems         = ()           => api.get('/pos/items/')
export const createItem       = (data)       => api.post('/pos/items/', data)
export const updateItem       = (id, data)   => api.patch(`/pos/items/${id}/`, data)
export const deleteItem       = (id)         => api.delete(`/pos/items/${id}/`)
// POS — Orders
export const createPosOrder      = (data)          => api.post('/pos/orders/', data)
export const getPosOrders        = (date)          => api.get('/pos/orders/', { params: { date } })
export const getDailySummary     = (date)          => api.get('/pos/orders/summary/', { params: { date } })
export const getPosIncomeSummary = (days = 14)     => api.get('/pos/orders/income-summary/', { params: { days } })

// Events
export const getEvents      = ()           => api.get('/events/')
export const createEvent    = (data)       => api.post('/events/', data)
export const updateEvent    = (id, data)   => api.put(`/events/${id}/`, data)
export const updateEventStatus = (id, s)   => api.put(`/events/${id}/status/`, { status: s })

// Partners
export const getBranches    = ()           => api.get('/partners/branches/')
export const createBranch   = (data)       => api.post('/partners/branches/', data)
export const updateBranch   = (id, data)   => api.put(`/partners/branches/${id}/`, data)
export const deleteBranch   = (id)         => api.delete(`/partners/branches/${id}/`)
export const getTransactions = ()          => api.get('/partners/transactions/')

// Reports
export const getMonthlyReport      = (month)  => api.get('/reports/monthly/',  { params: { month } })
export const getAdminOverview      = ()       => api.get('/reports/overview/')
export const getIncomeOutcome      = ()       => api.get('/reports/income-outcome/')
export const createIncomeOutcome   = (data)   => api.post('/reports/income-outcome/', data)
export const deleteIncomeOutcome   = (id)     => api.delete(`/reports/income-outcome/${id}/`)

// Meal packages
export const getMealPackages    = ()           => api.get('/meals/packages/')
export const createMealPackage  = (data)       => api.post('/meals/packages/', data)
export const updateMealPackage  = (id, data)   => api.put(`/meals/packages/${id}/`, data)
export const deleteMealPackage  = (id)         => api.delete(`/meals/packages/${id}/`)
export const getPackageItems    = ()           => api.get('/meals/package-items/')

export const getStudentItems  = ()           => api.get('/meals/student-items/')

// Admin: all meal orders
export const getAllMealOrders = (params)   => api.get('/meals/orders/', { params })

// Featured items (public menu)
export const getFeaturedItems   = ()                => api.get('/pos/featured-items/')
export const setFeaturedItem    = (position, item)  => api.post('/pos/featured-items/', { position, item })
export const removeFeaturedItem = (position)        => api.delete(`/pos/featured-items/${position}/`)

// Weekly meal plan
export const getWeeklyMealPlan = ()              => api.get('/pos/weekly-meal-plan/')
export const updateMealSlot    = (id, data)      => api.patch(`/pos/weekly-meal-plan/${id}/`, data)

// Suggestions
export const submitSuggestion    = (data) => api.post('/meals/suggestions/', data)
export const getSuggestions      = ()     => api.get('/meals/suggestions/')
export const markSuggestionsRead = ()     => api.patch('/meals/suggestions/')

// Users (admin)
export const getStudents        = ()              => api.get('/auth/users/')
export const deactivateStudent  = (id, reason)   => api.patch('/auth/users/', { id, reason })
export const activateStudent    = (id)            => api.patch('/auth/users/', { id })
export const getCashiers        = ()              => api.get('/auth/cashiers/')
export const createCashier      = (data)          => api.post('/auth/cashiers/', data)
export const updateCashier      = (id, data)      => api.patch(`/auth/cashiers/${id}/`, data)
export const getOnlineOrders    = ()             => api.get('/meals/online-orders/')
export const generateOnlineBill = (orderId)      => api.post(`/meals/bills/online/${orderId}/`)
export const generateWalkInBill = (data)         => api.post('/meals/bills/walk-in/', data)
export const getWalkInBills     = ()             => api.get('/meals/bills/walk-in/list/')
export const getBillPrint       = (billId)       => api.get(`/meals/bills/${billId}/print/`)
export const getBillDetail      = (billId)       => api.get(`/meals/bills/${billId}/`)
export const updateWalkInBill   = (billId, data) => api.patch(`/meals/bills/${billId}/`, data)
export const getBillPdf         = (billId)       => `${api.defaults.baseURL}/meals/bills/${billId}/pdf/`
export const sendBillEmail      = (billId, email) => api.post(`/meals/bills/${billId}/send-email/`, { email })
