import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Icon from './Icon'

const EMPTY = {
  title: '',
  description: '',
  location: '',
  employment_type: 'Full-time',
  salary_range: '',
}

// Modal used to both create and edit a job. Pass `job` to edit.
export default function JobFormModal({ job, onClose, onSaved }) {
  const editing = Boolean(job)
  const [form, setForm] = useState(
    editing
      ? {
          title: job.title,
          description: job.description,
          location: job.location || '',
          employment_type: job.employment_type || 'Full-time',
          salary_range: job.salary_range || '',
        }
      : EMPTY
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Escape closes the dialog, as users expect from a modal.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Only send non-empty optional fields.
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location || null,
        employment_type: form.employment_type || null,
        salary_range: form.salary_range || null,
      }
      const saved = editing ? await api.updateJob(job.id, payload) : await api.createJob(payload)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-head">
            <div>
              <h3>{editing ? 'Edit job' : 'Create a new job'}</h3>
              <p className="page-sub">
                {editing ? 'Changes are visible to candidates immediately.' : 'It goes live as soon as you publish.'}
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <Icon name="alert" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="job-title">Title *</label>
              <input
                id="job-title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Senior Frontend Engineer"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="job-desc">Description *</label>
              <textarea
                id="job-desc"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What the role involves, who you are looking for, how to stand out…"
                required
              />
            </div>

            <div className="row">
              <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                <label htmlFor="job-location">Location</label>
                <input
                  id="job-location"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="Remote"
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                <label htmlFor="job-type">Employment type</label>
                <select
                  id="job-type"
                  value={form.employment_type}
                  onChange={(e) => update('employment_type', e.target.value)}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="job-salary">Salary range</label>
              <input
                id="job-salary"
                value={form.salary_range}
                onChange={(e) => update('salary_range', e.target.value)}
                placeholder="$100k - $130k"
              />
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
