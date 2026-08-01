import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import SkeletonList from '../components/Skeleton'

// Human-readable explanation of each application status for candidates.
const STATUS_HINT = {
  applied: 'Your application has been received.',
  screening: 'The recruiter is reviewing your application.',
  interview: 'You have progressed to the interview stage.',
  rejected: 'Not selected this time.',
  hired: 'Congratulations — you got the job.',
}

// Happy-path pipeline; `rejected` is a terminal state rendered separately.
const STEPS = ['applied', 'screening', 'interview', 'hired']

function StatusTrack({ status }) {
  const rejected = status === 'rejected'
  // The API does not record how far a rejected application got, so we only
  // claim the one stage we know for sure — it was submitted.
  const reached = rejected ? 0 : STEPS.indexOf(status)

  return (
    <div className="mt-2">
      <div className={`track ${rejected ? 'track-rejected' : ''}`}>
        {STEPS.map((step, i) => (
          <div className={`track-step ${i <= reached ? 'done' : ''}`} key={step}>
            <span className="track-dot" />
            {/* Connector fills only once the *next* stage is reached. */}
            {i < STEPS.length - 1 && <span className={`track-bar ${i < reached ? 'filled' : ''}`} />}
          </div>
        ))}
      </div>
      <div className="track-labels">
        {STEPS.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </div>
  )
}

export default function MyApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await api.myApplications()
        setApps(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Your applications</h1>
          <p className="page-sub">
            {loading
              ? 'Just a sec…'
              : `${apps.length} application${apps.length === 1 ? '' : 's'} in flight — here’s where each one stands.`}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : apps.length === 0 ? (
        <EmptyState icon="file" title="No applications yet">
          <Link to="/jobs">Browse open jobs</Link>
        </EmptyState>
      ) : (
        apps.map((app) => (
          <article className="card card-hover" key={app.id}>
            <div className="row between row-top">
              <div>
                <h3 className="card-title">{app.job.title}</h3>
                <div className="card-meta">
                  Applied{' '}
                  {new Date(app.created_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <Badge status={app.status} />
            </div>

            <StatusTrack status={app.status} />

            <p className="card-body">{STATUS_HINT[app.status]}</p>

            <div className="card-foot">
              <a className="btn btn-secondary btn-sm" href={app.resume_url} target="_blank" rel="noreferrer">
                <Icon name="file" size={14} />
                View submitted resume
              </a>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
