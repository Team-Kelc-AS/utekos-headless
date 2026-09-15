type MagazineViewTransitionEnvironment = {
  VERCEL_ENV?: string | undefined
  MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED?:
    | string
    | undefined
}

export function isMagazineViewTransitionPreviewEnabled(
  environment: MagazineViewTransitionEnvironment
): boolean {
  return (
    environment.VERCEL_ENV === 'preview'
    && environment.MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED
      === '1'
  )
}
