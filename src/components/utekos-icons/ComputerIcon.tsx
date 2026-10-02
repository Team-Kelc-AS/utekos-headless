import { ICON_COLORS, type IconProps } from './icon-types'

export function ComputerIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M5 3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H2a1 1 0 1 0 0 2h20a1 1 0 1 0 0-2h-3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 2h14v11H5z" clip-rule="evenodd"/>
    </svg>
  )
}
