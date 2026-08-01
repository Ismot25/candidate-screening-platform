import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ApplyModal from '../components/ApplyModal'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import SkeletonList from '../components/Skeleton'

export default function BrowseJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [applyingTo, setApplyingTo] = useState(null)
  const [flash, setFlash] = useState('')

  async function load(searchTerm = '') {
    setLoading(true)
    try {
      const params = searchTerm ? { search: searchTerm } : {}
      const data = await api.listJobs(params)
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

  function handleSearch(e) {
    e.preventDefault()
    load(search)
  }

  function handleApplied(jobId) {
    setJobs((js) => js.map((j) => (j.id === jobId ? { ...j, has_applied: true, application_count: j.application_count + 1 } : j)))
    setApplyingTo(null)
    setFlash('Application submitted. Track it under “My Applications”.')
    setTimeout(() => setFlash(''), 4000)
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <div className="greeting">Hey {user.full_name.split(' ')[0]}</div>
          <h1 className="page-title">Find your next role</h1>
          <p className="page-sub">
            {loading
              ? 'Just a sec…'
              : `${jobs.length} role${jobs.length === 1 ? '' : 's'} open to applications right now.`}
          </p>
        </div>
      </div>

      {flash && (
        <div className="alert alert-success">
          <Icon name="check" />
          <span>{flash}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSearch} className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary">Search</button>
        {search && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); load() }}>
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <SkeletonList count={4} grid />
      ) : jobs.length === 0 ? (
        <EmptyState icon="search" title="Nothing here right now">
          {search ? 'No matches for that search — try another term, or clear it.' : 'No open roles yet. Check back soon, new ones land regularly.'}
        </EmptyState>
      ) : (
        <div className="grid">
          {jobs.map((job) => (
            <article className="card card-hover" key={job.id}>
              <div className="row between row-top">
                <h3 className="card-title">{job.title}</h3>
                {job.has_applied && <span className="badge badge-applied">Applied</span>}
              </div>
              <div className="card-meta">{job.recruiter.full_name}</div>

              <div className="chips">
                {job.location && <span className="chip"><Icon name="pin" size={14} />{job.location}</span>}
                {job.employment_type && <span className="chip"><Icon name="briefcase" size={14} />{job.employment_type}</span>}
                {job.salary_range && <span className="chip"><Icon name="wallet" size={14} />{job.salary_range}</span>}
              </div>

              <p className="card-body clamp-3">{job.description}</p>

              <div className="card-foot">
                <button
                  className="btn btn-sm"
                  disabled={job.has_applied}
                  onClick={() => setApplyingTo(job)}
                >
                  {job.has_applied ? 'Already applied' : 'Apply'}
                </button>
                <span className="spacer" />
                <span className="muted small nowrap">
                  {job.application_count} applicant{job.application_count === 1 ? '' : 's'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {applyingTo && (
        <ApplyModal job={applyingTo} onClose={() => setApplyingTo(null)} onApplied={handleApplied} />
      )}
    </div>
  )
}
