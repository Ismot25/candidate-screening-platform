// Thin fetch wrapper around the FastAPI backend.
// Handles JSON, auth token injection, and error normalization.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TOKEN_KEY = 'csp_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch only rejects on network-level failures (server down, DNS, CORS),
    // where the raw message is just "Failed to fetch" — say something useful.
    const error = new Error(
      `Cannot reach the API at ${BASE_URL}. Is the backend running?`
    )
    error.status = 0
    throw error
  }

  if (res.status === 204) return null

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    // FastAPI returns { detail: "..." } or { detail: [validation errors] }.
    let message = 'Request failed'
    if (data && data.detail) {
      message = Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join(', ')
        : data.detail
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return data
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  // Jobs
  listJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/jobs${qs ? `?${qs}` : ''}`)
  },
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (payload) => request('/jobs', { method: 'POST', body: payload }),
  updateJob: (id, payload) => request(`/jobs/${id}`, { method: 'PATCH', body: payload }),
  closeJob: (id) => request(`/jobs/${id}/close`, { method: 'POST' }),

  // Applications
  applyToJob: (jobId, payload) =>
    request(`/jobs/${jobId}/applications`, { method: 'POST', body: payload }),
  listJobApplications: (jobId) => request(`/jobs/${jobId}/applications`),
  myApplications: () => request('/applications/me'),
  updateApplicationStatus: (appId, status) =>
    request(`/applications/${appId}/status`, { method: 'PATCH', body: { status } }),
}
