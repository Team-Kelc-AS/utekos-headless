import { ICON_COLORS, type IconProps } from './icon-types'

export function SpeechBubbleIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M2 1a1 1 0 0 0-.707 1.707l2.254 2.254A10.96 10.96 0 0 0 1 12c0 6.075 4.925 11 11 11s11-4.925 11-11S18.075 1 12 1z" clip-rule="evenodd"/>
    </svg>
  )
}
