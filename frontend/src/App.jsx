import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage        from './pages/LoginPage'
import PublicLandingPage from './pages/PublicLandingPage'
import StudentDashboard from './pages/student/StudentDashboard'
import CashierDashboard from './pages/cashier/CashierDashboard'

import AdminLayout        from './pages/admin/AdminLayout'
import DashboardOverview  from './pages/admin/DashboardOverview'
import ItemsManagement    from './pages/admin/ItemsManagement'
import MealPackages     from './pages/admin/MealPackages'
import StudentOrders    from './pages/admin/StudentOrders'
import WalkInOrders     from './pages/admin/WalkInOrders'
import EventsManagement from './pages/admin/EventsManagement'
import IncomeOutcome    from './pages/admin/IncomeOutcome'
import MonthlyReport    from './pages/admin/MonthlyReport'
import PublicPreview    from './pages/admin/PublicPreview'
import Suggestions      from './pages/admin/Suggestions'
import UserManagement   from './pages/admin/UserManagement'
import CashierManagement from './pages/admin/CashierManagement'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<PublicLandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Cashier */}
          <Route
            path="/cashier"
            element={
              <ProtectedRoute role="cashier">
                <CashierDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin — nested routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index                element={<DashboardOverview />} />
            <Route path="overview"      element={<DashboardOverview />} />
            <Route path="items"         element={<ItemsManagement />} />
            <Route path="meal-packages" element={<MealPackages />} />
            <Route path="student-orders"element={<StudentOrders />} />
            <Route path="walk-in-orders" element={<WalkInOrders />} />
            <Route path="events"        element={<EventsManagement />} />
            <Route path="income-outcome" element={<IncomeOutcome />} />
            <Route path="reports"        element={<MonthlyReport />} />
            <Route path="public-preview" element={<PublicPreview />} />
            <Route path="suggestions"    element={<Suggestions />} />
            <Route path="users"           element={<UserManagement />} />
            <Route path="cashiers"        element={<CashierManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
