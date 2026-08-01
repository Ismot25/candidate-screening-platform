import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './PageLoader'

// Guards routes by authentication and (optionally) role.
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    // Send users to their own home if they hit a route for the other role.
    return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/jobs'} replace />
  }
  return children
}
