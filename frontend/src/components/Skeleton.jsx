// Shimmer placeholders shown while a list loads — steadier than a spinner
// because the layout does not jump once real data arrives.
export function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton sk-title" />
      <div className="skeleton sk-line" style={{ width: '35%' }} />
      <div className="skeleton sk-line" style={{ width: '92%' }} />
      <div className="skeleton sk-line" style={{ width: '78%' }} />
      <div className="row mt-4">
        <div className="skeleton sk-chip" />
        <div className="skeleton sk-chip" />
      </div>
    </div>
  )
}

export default function SkeletonList({ count = 3, grid = false }) {
  const items = Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)
  return grid ? <div className="grid">{items}</div> : <div>{items}</div>
}
