import { ICON_COLORS, type IconProps } from './icon-types'

export function LogOutIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M5.5 2A3.5 3.5 0 0 0 2 5.5v14.397a2.5 2.5 0 0 0 1.754 2.386l5 1.563a2.502 2.502 0 0 0 3.189-1.848c.019.002.038.002.057.002h1.5a3.5 3.5 0 0 0 3.5-3.5v-2.25a1 1 0 1 0-2 0v2.25a1.5 1.5 0 0 1-1.5 1.5H12V7.103a2.5 2.5 0 0 0-1.754-2.386L7.953 4H13.5A1.5 1.5 0 0 1 15 5.5v2.25a1 1 0 1 0 2 0V5.5A3.5 3.5 0 0 0 13.5 2h-8zm13.293 6.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L20.086 13H16a1 1 0 1 1 0-2h4.086l-1.293-1.293a1 1 0 0 1 0-1.414z" clipRule="evenodd"/>
    </svg>
  )
}
