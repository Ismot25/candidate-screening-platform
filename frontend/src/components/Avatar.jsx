// Circular initials avatar. The colour is derived from the name so the same
// person is always the same colour — friendlier than a uniform grey circle.
export default function Avatar({ name = '', size = 'md' }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  // Cheap deterministic hash → hue. Stable across reloads and sessions.
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360

  return (
    <div
      className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`}
      style={{ '--av-hue': hash }}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  )
}
