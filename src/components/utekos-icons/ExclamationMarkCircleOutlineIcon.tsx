import { ICON_COLORS, type IconProps } from './icon-types'

export function ExclamationMarkCircleOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M23 12c0 6.075-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1s11 4.925 11 11m-2 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0M10.795 7.75a1.206 1.206 0 1 1 2.41 0l-.17 4.75a1.036 1.036 0 0 1-2.07 0zM10.5 16a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clip-rule="evenodd"/>
    </svg>
  )
}
