export const SKREDDERSY_VARMEN_PATH = '/skreddersy-varmen'
export const SKREDDERSY_VARMEN_LAYOUT_PATH =
  '/skreddersy-varmen/layout'

export function resolveSkreddersyVarmenPublicPathname(
  pathname: string
): string {
  return (
      pathname === `${SKREDDERSY_VARMEN_LAYOUT_PATH}/current` ||
        pathname === `${SKREDDERSY_VARMEN_LAYOUT_PATH}/legacy`
    ) ?
      SKREDDERSY_VARMEN_PATH
    : pathname
}
