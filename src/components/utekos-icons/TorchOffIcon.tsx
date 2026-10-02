import { ICON_COLORS, type IconProps } from './icon-types'

export function TorchOffIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M8 20.5a2.5 2.5 0 0 0 2.5 2.5h3a2.5 2.5 0 0 0 2.5-2.5v-7.611a8 8 0 0 1 .845-3.578l.31-.622A8 8 0 0 0 18 5.111V5H6v.111a8 8 0 0 0 .845 3.578l.31.622A8 8 0 0 1 8 12.889zm10-18V4H6V2.5A1.5 1.5 0 0 1 7.5 1h9A1.5 1.5 0 0 1 18 2.5M12 11a2 2 0 0 0-2 2v2a2 2 0 1 0 4 0v-2a2 2 0 0 0-2-2m0 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2" clip-rule="evenodd"/>
    </svg>
  )
}
