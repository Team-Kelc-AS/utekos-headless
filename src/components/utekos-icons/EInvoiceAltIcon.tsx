import { ICON_COLORS, type IconProps } from './icon-types'

export function EInvoiceAltIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M9.744 9.511c-.306.817-.881 1.233-1.704 1.233-1.328 0-1.525-.89-1.544-1.763v-.066l.212-.017c.845-.069 2.26-.185 3.38-.658 1.215-.501 1.806-1.29 1.806-2.407 0-.872-.39-2.333-3.008-2.333C5.97 3.5 4.01 5.624 4.01 8.784c0 1.388.475 3.716 3.63 3.716 1.972 0 3.417-.922 3.98-2.53l.156-.454zM6.596 7.337c.176-1.385.967-2.245 2.067-2.245.803 0 .972.456.972.839 0 .598-.376.986-1.188 1.22a7.8 7.8 0 0 1-1.773.274h-.092z"/>
    </svg>
  )
}
