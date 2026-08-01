import Icon from './Icon'

// Friendly placeholder shown when a list has no results.
export default function EmptyState({ icon = 'inbox', title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      {title && <div className="empty-title">{title}</div>}
      {children && <div className="small">{children}</div>}
    </div>
  )
}
