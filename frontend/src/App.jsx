import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import RecruiterDashboard from './pages/RecruiterDashboard'
import JobApplications from './pages/JobApplications'
import BrowseJobs from './pages/BrowseJobs'
import MyApplications from './pages/MyApplications'

// Sends a logged-in user to their role's home; otherwise to login.
function Home() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/jobs'} replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Recruiter */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute role="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs/:jobId/applications"
          element={
            <ProtectedRoute role="recruiter">
              <JobApplications />
            </ProtectedRoute>
          }
        />

        {/* Candidate */}
        <Route
          path="/jobs"
          element={
            <ProtectedRoute role="candidate">
              <BrowseJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute role="candidate">
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
