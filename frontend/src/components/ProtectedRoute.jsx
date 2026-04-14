import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authContextCore'

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role?.name !== role) return <Navigate to="/login" replace />
  return children
}
