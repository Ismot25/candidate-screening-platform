import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import JobFormModal from '../components/JobFormModal'
import SkeletonList from '../components/Skeleton'

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | { job? }

  async function load() {
    setLoading(true)
    try {
      const data = await api.listJobs({ mine: true })
      setJobs(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleClose(job) {
    if (!confirm(`Close "${job.title}"? Candidates will no longer see or apply to it.`)) return
    try {
      const updated = await api.closeJob(job.id)
      setJobs((js) => js.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)))
    } catch (err) {
      alert(err.message)
    }
  }

  function handleSaved(saved) {
    setJobs((js) => {
      const exists = js.some((j) => j.id === saved.id)
      return exists ? js.map((j) => (j.id === saved.id ? saved : j)) : [saved, ...js]
    })
    setModal(null)
  }

  const openCount = jobs.filter((j) => j.status === 'open').length
  const applicants = jobs.reduce((sum, j) => sum + j.application_count, 0)

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <div className="greeting">Hey {user.full_name.split(' ')[0]}</div>
          <h1 className="page-title">Your job postings</h1>
          <p className="page-sub">
            {loading
              ? 'Just a sec…'
              : jobs.length === 0
                ? 'Nothing posted yet — let’s change that.'
                : `${openCount} role${openCount === 1 ? '' : 's'} live right now.`}
          </p>
        </div>
        <button className="btn" onClick={() => setModal({})}>
          <Icon name="plus" size={15} />
          New job
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="stats">
          <div>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-label">Total jobs</div>
          </div>
          <div>
            <div className="stat-value">{openCount}</div>
            <div className="stat-label">Open</div>
          </div>
          <div>
            <div className="stat-value">{jobs.length - openCount}</div>
            <div className="stat-label">Closed</div>
          </div>
          <div>
            <div className="stat-value">{applicants}</div>
            <div className="stat-label">Applicants</div>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} grid />
      ) : jobs.length === 0 ? (
        <EmptyState icon="briefcase" title="No jobs yet">
          Hit <strong>New job</strong> and your first role goes live in a couple of minutes.
        </EmptyState>
      ) : (
        <div className="grid">
          {jobs.map((job) => (
            <article className="card card-hover" key={job.id}>
              <div className="row between row-top">
                <div>
                  <h3 className="card-title">{job.title}</h3>
                  <div className="card-meta">
                    {[job.location, job.employment_type, job.salary_range].filter(Boolean).join(' · ') || 'No details added'}
                  </div>
                </div>
                <div className="count-pill">
                  <strong>{job.application_count}</strong>
                  <span>applicant{job.application_count === 1 ? '' : 's'}</span>
                </div>
              </div>

              <div className="chips">
                <Badge status={job.status} />
              </div>

              <p className="card-body clamp-3">{job.description}</p>

              <div className="card-foot">
                <Link className="btn btn-sm" to={`/recruiter/jobs/${job.id}/applications`}>
                  Review applications
                </Link>
                <button className="btn btn-secondary btn-sm" onClick={() => setModal({ job })}>Edit</button>
                {job.status === 'open' && (
                  <button className="btn btn-danger-soft btn-sm" onClick={() => handleClose(job)}>Close</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && <JobFormModal job={modal.job} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </div>
  )
}
