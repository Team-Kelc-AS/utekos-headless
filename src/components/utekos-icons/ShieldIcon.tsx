import { ICON_COLORS, type IconProps } from './icon-types'

export function ShieldIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" d="m4.649 4.757 7-2.625a1 1 0 0 1 .702 0l7 2.625a1 1 0 0 1 .649.936v7.982a6 6 0 0 1-2.82 5.087l-4.65 2.907a1 1 0 0 1-1.06 0l-4.65-2.907A6 6 0 0 1 4 13.674v-7.98a1 1 0 0 1 .649-.936z"/><path fill="currentColor" d="m4.649 4.757-.351-.937.35.937zm7-2.625.351.936zm.702 0 .351-.937-.35.937zm7 2.625.351-.937zM17.18 18.762l.53.848zm-4.65 2.907L12 20.82l.53.848zm-1.06 0 .53-.848zm-4.65-2.907-.53.848zM5 5.693l7-2.625-.702-1.873-7 2.625zm7-2.625.702-1.873a2 2 0 0 0-1.404 0zm0 0 7 2.625.702-1.873-7-2.625zm7 2.625h2a2 2 0 0 0-1.298-1.873zm0 0v7.982h2V5.692zm0 7.982a5 5 0 0 1-2.35 4.24l1.06 1.695A7 7 0 0 0 21 13.675zm-2.35 4.24L12 20.82l1.06 1.696 4.65-2.907zM12 20.82l-1.06 1.696a2 2 0 0 0 2.12 0zm0 0-4.65-2.907-1.06 1.696 4.65 2.907zm-4.65-2.907A5 5 0 0 1 5 13.675H3a7 7 0 0 0 3.29 5.936l1.06-1.695zM5 13.675V5.694H3v7.982zm0-7.981L4.298 3.82A2 2 0 0 0 3 5.693h2z"/>
    </svg>
  )
}
