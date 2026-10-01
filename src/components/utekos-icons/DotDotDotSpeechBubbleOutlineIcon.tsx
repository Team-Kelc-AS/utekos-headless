import { ICON_COLORS, type IconProps } from './icon-types'

export function DotDotDotSpeechBubbleOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M2 1a1 1 0 0 0-.707 1.707l2.254 2.254A10.959 10.959 0 0 0 1 12c0 6.075 4.925 11 11 11s11-4.925 11-11S18.075 1 12 1H2zm3.636 3.222L4.414 3H12a9 9 0 1 1-9 9 8.969 8.969 0 0 1 2.636-6.364 1 1 0 0 0 0-1.414zM7.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" clipRule="evenodd"/>
    </svg>
  )
}
