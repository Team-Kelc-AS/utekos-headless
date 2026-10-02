import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowReturnLeftCircleIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m5.5-12.75A4.25 4.25 0 0 0 13.25 6H13a1 1 0 1 0 0 2h.25a2.25 2.25 0 0 1 0 4.5H9.414l1.793-1.793a1 1 0 0 0-1.414-1.414l-3.5 3.5a1 1 0 0 0 0 1.414l3.5 3.5a1 1 0 0 0 1.414-1.414L9.414 14.5h3.836a4.25 4.25 0 0 0 4.25-4.25" clip-rule="evenodd"/>
    </svg>
  )
}
