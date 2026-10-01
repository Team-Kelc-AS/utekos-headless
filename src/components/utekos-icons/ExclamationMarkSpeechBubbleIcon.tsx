import { ICON_COLORS, type IconProps } from './icon-types'

export function ExclamationMarkSpeechBubbleIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M1.076 1.617A1 1 0 0 1 2 1h10c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12c0-2.677.957-5.132 2.547-7.039L1.293 2.707a1 1 0 0 1-.217-1.09zM12 13a1 1 0 0 1-1-1V7a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1zm-1.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" clipRule="evenodd"/>
    </svg>
  )
}
