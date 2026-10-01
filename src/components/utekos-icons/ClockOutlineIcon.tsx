import { ICON_COLORS, type IconProps } from './icon-types'

export function ClockOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0zm9-11C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm1 5a1 1 0 1 0-2 0v6.414l.293.293 3 3a1 1 0 0 0 1.414-1.414L13 11.586V6z" clipRule="evenodd"/>
    </svg>
  )
}
