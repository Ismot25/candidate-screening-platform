// Full-height spinner used while auth state resolves.
export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <div className="spinner" />
      <span className="small">{label}</span>
    </div>
  )
}
