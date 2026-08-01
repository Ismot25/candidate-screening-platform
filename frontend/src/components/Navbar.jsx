import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // react-router marks the matching NavLink with isActive for us.
  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">S</span>
          ScreenHire
        </Link>

        <div className="nav-links">
          {user && (
            <>
              {user.role === 'recruiter' ? (
                <NavLink to="/recruiter" className={linkClass}>My Jobs</NavLink>
              ) : (
                <>
                  <NavLink to="/jobs" className={linkClass}>Open Jobs</NavLink>
                  <NavLink to="/applications" className={linkClass}>My Applications</NavLink>
                </>
              )}
              <span className="nav-divider" />
            </>
          )}

          <ThemeToggle />

          {user && (
            <>
              <div className="nav-user">
                <Avatar name={user.full_name} />
                <div className="nav-user-meta">
                  <div className="nav-user-name">{user.full_name}</div>
                  <div className="nav-user-role">{user.role}</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
