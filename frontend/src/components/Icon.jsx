// Minimal line-icon set. One stroke weight, currentColor, no dependencies —
// cleaner and more consistent than emoji, which render differently per OS.
const PATHS = {
  search: 'M11 11a5 5 0 1 0-7.07-7.07A5 5 0 0 0 11 11Zm0 0 4 4',
  pin: 'M14 6.7c0 3.5-4.5 7.8-4.5 7.8S5 10.2 5 6.7a4.5 4.5 0 1 1 9 0Z M9.5 6.7a1 1 0 1 0 0-.01',
  briefcase: 'M3 6.5h13v8H3zM7 6.5v-2h5v2M3 9.5h13',
  wallet: 'M3 5.5h11a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 14 14.5H3zM3 5.5v9M12.5 10h1',
  file: 'M5 2.5h5l3.5 3.5v9H5zM10 2.5V6h3.5',
  mail: 'M3 4.5h13v10H3zM3 5l6.5 5L16 5',
  plus: 'M9.5 4v11M4 9.5h11',
  check: 'M4 10l3.5 3.5L15 6',
  close: 'M5 5l9 9M14 5l-9 9',
  alert: 'M9.5 3 16.5 15h-14zM9.5 7.5v3.5M9.5 13.2v.1',
  back: 'M15 9.5H4M8 5l-4 4.5L8 14',
  inbox: 'M3 10.5h4l1 2h4l1-2h3M3 10.5 5 4h9l2 6.5v4H3z',
  sun: 'M9.5 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9.5 2v1.5M9.5 15.5V17M17 9.5h-1.5M3.5 9.5H2M14.8 4.2l-1 1M5.2 13.8l-1 1M14.8 14.8l-1-1M5.2 5.2l-1-1',
  moon: 'M15 11.3A6 6 0 1 1 7.7 4a4.8 4.8 0 0 0 7.3 7.3Z',
  logout: 'M11 5V3.5H3v12h8V14M7.5 9.5H16M13 6.5l3 3-3 3',
}

export default function Icon({ name, size = 16, className = '' }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 19 19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  )
}
