import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Icon from './Icon'

// Modal for a candidate to apply to a job by submitting a resume URL.
export default function ApplyModal({ job, onClose, onApplied }) {
  const [resumeUrl, setResumeUrl] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Escape closes the dialog, as users expect from a modal.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.applyToJob(job.id, {
        resume_url: resumeUrl,
        cover_letter: coverLetter || null,
      })
      onApplied(job.id)
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
              <h3>Apply to this role</h3>
              <p className="page-sub">{job.title}</p>
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
              <label htmlFor="resume-url">Resume URL *</label>
              <input
                id="resume-url"
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                autoFocus
                required
              />
              <div className="hint">
                Link to your resume (Google Drive, Dropbox, personal site, etc.)
              </div>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="cover-letter">Cover letter <span className="muted">(optional)</span></label>
              <textarea
                id="cover-letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the recruiter why you are a great fit…"
              />
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
