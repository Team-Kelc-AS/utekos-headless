import { ICON_COLORS, type IconProps } from './icon-types'

export function ShieldXmarkIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M11.649 2.132l-7 2.625A1 1 0 0 0 4 5.693v7.982a6 6 0 0 0 2.82 5.087l4.65 2.907a1 1 0 0 0 1.06 0l4.65-2.907A6 6 0 0 0 20 13.674v-7.98a1 1 0 0 0-.649-.936l-7-2.625a1 1 0 0 0-.702 0zm4.058 13.075a1 1 0 0 1-1.414 0L12 12.914l-2.293 2.293a1 1 0 0 1-1.414-1.414l2.293-2.293-2.293-2.293a1 1 0 0 1 1.414-1.414L12 10.086l2.293-2.293a1 1 0 1 1 1.414 1.414L13.414 11.5l2.293 2.293a1 1 0 0 1 0 1.414z" clipRule="evenodd"/>
    </svg>
  )
}
