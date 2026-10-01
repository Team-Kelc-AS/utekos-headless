import { ICON_COLORS, type IconProps } from './icon-types'

export function PreviewIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      
<path fillRule="evenodd" clipRule="evenodd" d="M0.356747 7.61435C2.48054 4.07193 5.03815 2.24711 8.00854 2.25C10.9786 2.2529 13.5357 4.083 15.6591 7.6304C15.8014 7.86813 15.8011 8.16494 15.6582 8.40233C13.533 11.9339 10.9755 13.7529 8.00707 13.75C5.03896 13.7471 2.48207 11.9228 0.357124 8.38628C0.214427 8.14879 0.214282 7.85198 0.356747 7.61435ZM8.00854 12.25C10.2813 12.2522 12.3171 10.8725 14.1345 8.01455C12.3175 5.14153 10.2811 3.75222 8.00707 3.75C5.73349 3.74779 3.69768 5.13204 1.88113 7.99957C3.69895 10.863 5.73535 12.2478 8.00854 12.25ZM8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5Z" fill="currentColor"/>

    </svg>
  )
}
