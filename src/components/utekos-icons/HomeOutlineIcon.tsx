import { ICON_COLORS, type IconProps } from './icon-types'

export function HomeOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M13.266 1.744a2 2 0 0 0-2.533 0L.367 10.226a1 1 0 1 0 1.266 1.548L3 10.656V20a2 2 0 0 0 2 2h4a1 1 0 0 0 1-1v-5a2 2 0 1 1 4 0v5a1 1 0 0 0 1 1h4a2 2 0 0 0 2-2v-9.344l1.366 1.118a1 1 0 0 0 1.267-1.548zM19 9.02l-7-5.727L5 9.02V20h3v-4a4 4 0 0 1 8 0v4h3z" clip-rule="evenodd"/>
    </svg>
  )
}
