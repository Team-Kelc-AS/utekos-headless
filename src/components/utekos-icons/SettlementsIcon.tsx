import { ICON_COLORS, type IconProps } from './icon-types'

export function SettlementsIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M11 2.139c0-.588-.506-1.053-1.083-.942C4.837 2.171 1 6.637 1 12s3.838 9.83 8.917 10.803c.577.11 1.083-.354 1.083-.942zM21.861 11c.588 0 1.053-.506.942-1.083a11.01 11.01 0 0 0-8.72-8.72c-.577-.11-1.083.354-1.083.942V10a1 1 0 0 0 1 1zm-7.777 11.803c-.578.11-1.084-.354-1.084-.942v-7.86a1 1 0 0 1 1-1h7.861c.588 0 1.053.505.942 1.083a11.01 11.01 0 0 1-8.72 8.719z" clip-rule="evenodd"/>
    </svg>
  )
}
