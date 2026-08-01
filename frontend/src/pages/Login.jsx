import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function Login() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [role, setRole] = useState('candidate')
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // If already logged in, bounce to home.
  if (user) navigate(user.role === 'recruiter' ? '/recruiter' : '/jobs', { replace: true })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register({ ...form, role })
      navigate(u.role === 'recruiter' ? '/recruiter' : '/jobs', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          ScreenHire
        </div>

        <h2>{mode === 'login' ? 'Welcome back' : 'Let’s get you set up'}</h2>
        <p className="page-sub">
          {mode === 'login'
            ? 'Good to see you again — pick up where you left off.'
            : 'Takes about a minute, promise.'}
        </p>

        <div className="tabs" role="tablist">
          <div
            role="tab"
            aria-selected={mode === 'login'}
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign in
          </div>
          <div
            role="tab"
            aria-selected={mode === 'register'}
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create account
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="alert" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>I am a</label>
                <div className="segmented">
                  <button
                    type="button"
                    className={role === 'candidate' ? 'active' : ''}
                    onClick={() => setRole('candidate')}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    className={role === 'recruiter' ? 'active' : ''}
                    onClick={() => setRole('recruiter')}
                  >
                    Recruiter
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              minLength={mode === 'register' ? 6 : undefined}
              required
            />
          </div>

          <button className="btn btn-block mt-2" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="demo-box">
          <strong>Demo accounts</strong> — password <code>password123</code>
          <br />
          recruiter@demo.com · candidate@demo.com
        </div>
      </div>
    </div>
  )
}
