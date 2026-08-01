// Renders a colored status badge (with a leading dot) for job/application statuses.
export default function Badge({ status, label }) {
  return <span className={`badge badge-${status}`}>{label || status}</span>
}
