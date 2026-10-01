import { ICON_COLORS, type IconProps } from './icon-types'

export function ShieldExclamationMarkIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fillRule="evenodd" d="M11.649 2.132l-7 2.625A1 1 0 0 0 4 5.693v7.982a6 6 0 0 0 2.82 5.087l4.65 2.907a1 1 0 0 0 1.06 0l4.65-2.907A6 6 0 0 0 20 13.674v-7.98a1 1 0 0 0-.649-.936l-7-2.625a1 1 0 0 0-.702 0zM12 13a1 1 0 0 1-1-1V7a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1zm-1.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" clipRule="evenodd"/>
    </svg>
  )
}
