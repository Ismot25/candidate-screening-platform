import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import PageLoader from '../components/PageLoader'

const STATUSES = ['applied', 'screening', 'interview', 'rejected', 'hired']

export default function JobApplications() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [jobData, appData] = await Promise.all([
        api.getJob(jobId),
        api.listJobApplications(jobId),
      ])
      setJob(jobData)
      setApps(appData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [jobId])

  async function changeStatus(app, status) {
    // Optimistic update with rollback on failure.
    const prev = app.status
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status } : a)))
    try {
      await api.updateApplicationStatus(app.id, status)
    } catch (err) {
      alert(err.message)
      setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status: prev } : a)))
    }
  }

  if (loading) return <div className="container"><PageLoader /></div>
  if (error) {
    return (
      <div className="container">
        <Link to="/recruiter" className="back-link"><Icon name="back" size={14} />Back to my jobs</Link>
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  // Pipeline summary so the recruiter sees the funnel at a glance.
  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: apps.filter((a) => a.status === s).length }),
    {}
  )

  return (
    <div className="container">
      <Link to="/recruiter" className="back-link"><Icon name="back" size={14} />Back to my jobs</Link>

      <div className="page-head">
        <div>
          <h1 className="page-title">
            {job.title} <Badge status={job.status} />
          </h1>
          <p className="page-sub">
            {apps.length} application{apps.length === 1 ? '' : 's'} ·{' '}
            {[job.location, job.employment_type].filter(Boolean).join(' · ') || 'No details added'}
          </p>
        </div>
      </div>

      {apps.length > 0 && (
        <div className="stats">
          {STATUSES.map((s) => (
            <div key={s}>
              <div className="stat-value">{counts[s]}</div>
              <div className="stat-label">{s}</div>
            </div>
          ))}
        </div>
      )}

      {apps.length === 0 ? (
        <EmptyState icon="inbox" title="No applications yet">
          Once candidates apply to this role, they will show up here.
        </EmptyState>
      ) : (
        apps.map((app) => (
          <article className="card card-hover" key={app.id}>
            <div className="row between row-top">
              <div className="row">
                <Avatar name={app.candidate.full_name} size="lg" />
                <div>
                  <h3 className="card-title">{app.candidate.full_name}</h3>
                  <div className="card-meta">
                    <a href={`mailto:${app.candidate.email}`}>{app.candidate.email}</a>
                  </div>
                </div>
              </div>
              <Badge status={app.status} />
            </div>

            {app.cover_letter && <p className="card-body">{app.cover_letter}</p>}

            <div className="card-foot">
              <a className="btn btn-secondary btn-sm" href={app.resume_url} target="_blank" rel="noreferrer">
                <Icon name="file" size={14} />
                View resume
              </a>
              <span className="spacer" />
              <label className="muted small mb-0 nowrap" htmlFor={`status-${app.id}`}>
                Move to
              </label>
              <select
                id={`status-${app.id}`}
                value={app.status}
                onChange={(e) => changeStatus(app, e.target.value)}
                style={{ width: 'auto' }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
