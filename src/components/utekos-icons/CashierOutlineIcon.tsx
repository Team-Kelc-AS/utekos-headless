import { ICON_COLORS, type IconProps } from './icon-types'

export function CashierOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M6 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm2-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm3.421 12.206l.36 1.794H4.22l.359-1.794A1.5 1.5 0 0 1 6.049 13H9.95a1.5 1.5 0 0 1 1.471 1.206zm1.962-.392L13.82 16H15v-3a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3.268A2 2 0 0 1 23 18v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 1.142-1.807l.475-2.38A3.5 3.5 0 0 1 6.05 11h3.9a3.5 3.5 0 0 1 3.433 2.814zM21 18H3v3h18v-3zm-1-2v-3h-3v3h3z" clipRule="evenodd"/>
    </svg>
  )
}
