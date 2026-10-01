import { ICON_COLORS, type IconProps } from './icon-types'

export function CashierAlt2Icon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fillRule="evenodd" d="M3 18a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H3zm8-12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-7.582 7.814A3.5 3.5 0 0 1 6.85 11h2.3a3.5 3.5 0 0 1 3.433 2.814l.398 1.99.039.196H2.98l.04-.196.398-1.99zM20 16v-3a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v3h5z" clipRule="evenodd"/>
    </svg>
  )
}
