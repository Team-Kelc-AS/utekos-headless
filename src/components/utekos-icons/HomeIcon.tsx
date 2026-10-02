import { ICON_COLORS, type IconProps } from './icon-types'

export function HomeIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M13.267 1.744a2 2 0 0 0-2.533 0L.367 10.226A1 1 0 0 0 1 12h2v8a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-6a3 3 0 1 1 6 0v6a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-8h2a1 1 0 0 0 .633-1.774z" clip-rule="evenodd"/>
    </svg>
  )
}
