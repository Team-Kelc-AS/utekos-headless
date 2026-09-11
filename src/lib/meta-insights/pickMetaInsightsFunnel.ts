import type { MetaInsightsActionType } from './metaInsightsActionTypes'

export function pickMetaInsightsFunnel(
  actions: Partial<Record<MetaInsightsActionType, number>>
) {
  return {
    landingPageViews:
      actions.omni_landing_page_view ?? actions.landing_page_view ?? 0,
    addToCart: actions.omni_add_to_cart ?? actions.add_to_cart ?? 0,
    initiateCheckout:
      actions.omni_initiated_checkout ?? actions.initiate_checkout ?? 0,
    purchase: actions.omni_purchase ?? actions.purchase ?? 0
  }
}
