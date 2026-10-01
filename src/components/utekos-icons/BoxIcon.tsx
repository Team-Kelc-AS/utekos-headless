import { ICON_COLORS, type IconProps } from './icon-types'

export function BoxIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M10.175 1.943a3.5 3.5 0 0 1 3.65 0l6.5 3.972c.224.137.428.296.612.474L12 11.83 3.063 6.39c.184-.178.389-.337.612-.474l6.5-3.972zm-8.09 6.192A3.499 3.499 0 0 0 2 8.902v7.053a3.5 3.5 0 0 0 1.935 3.13l6.5 3.25c.183.092.372.166.565.224v-8.997L2.085 8.135zM13 22.56c.193-.058.382-.132.565-.224l6.5-3.25A3.5 3.5 0 0 0 22 15.955V8.902c0-.26-.029-.518-.085-.767L13 13.562v8.997z" clipRule="evenodd"/>
    </svg>
  )
}
