import {
  resolvePageViewNavigation,
  type PageViewNavigation
} from './pageViewEvent'

/**
 * Module-level last URL so SPA remounts (Suspense + useSearchParams)
 * cannot reset the in-component previousUrl ref and fire a second
 * PageView for the same navigation.
 */
let lastClaimedPageUrl: string | null = null

export function claimPageViewNavigation(input: {
  currentUrl: string
  documentReferrer: string
}): PageViewNavigation | null {
  const navigation = resolvePageViewNavigation({
    currentUrl: input.currentUrl,
    documentReferrer: input.documentReferrer,
    previousUrl: lastClaimedPageUrl
  })

  if (!navigation) return null

  lastClaimedPageUrl = navigation.pageUrl
  return navigation
}
