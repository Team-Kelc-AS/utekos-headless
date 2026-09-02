import { z } from 'zod'
import { canonicalAddToCartSchema } from './addToCartEvent'
import { canonicalAddPaymentInfoSchema } from './addPaymentInfoEvent'
import { canonicalAddShippingInfoSchema } from './addShippingInfoEvent'
import { canonicalBeginCheckoutSchema } from './beginCheckoutEvent'
import { canonicalPageViewSchema } from './pageViewEvent'
import { canonicalPurchaseSchema } from './purchaseEvent'
import { canonicalRefundSchema } from './refundEvent'
import { canonicalViewItemSchema } from './viewItemEvent'
import { canonicalViewItemListSchema } from './viewItemListEvent'
import { canonicalSelectItemSchema } from './selectItemEvent'
import { canonicalAddToWishlistSchema } from './addToWishlistEvent'
import { canonicalRemoveFromCartSchema } from './removeFromCartEvent'
import { canonicalViewCartSchema } from './viewCartEvent'
import { canonicalSearchSchema } from './searchEvent'
import { canonicalViewSearchResultsSchema } from './viewSearchResultsEvent'
import { canonicalViewPromotionSchema } from './viewPromotionEvent'
import { canonicalSelectPromotionSchema } from './selectPromotionEvent'
import { canonicalGenerateLeadSchema } from './generateLeadEvent'
import { canonicalFormStartSchema } from './formStartEvent'
import { canonicalFormSubmitSchema } from './formSubmitEvent'
import { canonicalFormErrorSchema } from './formErrorEvent'
import { canonicalFilterApplySchema } from './filterApplyEvent'
import { canonicalSortApplySchema } from './sortApplyEvent'
import { canonicalVariantSelectSchema } from './variantSelectEvent'
import { canonicalSizeGuideViewSchema } from './sizeGuideViewEvent'
import { canonicalScrollDepthSchema } from './scrollDepthEvent'
import { canonicalViewCategorySchema } from './viewCategoryEvent'
import { canonicalHeroInteractSchema } from './heroInteractEvent'
import { canonicalVideoProgressSchema } from './videoProgressEvent'
import { canonicalInteractWithAccordionSchema } from './interactWithAccordionEvent'
import { canonicalOpenQuickViewSchema } from './openQuickViewEvent'
import {
  canonicalMetaAppEventSchema,
  canonicalMetaOfflineEventSchema
} from './metaNonWebCanonicalEvent'

export const canonicalEventSchema = z.discriminatedUnion(
  'event_name',
  [
    canonicalPageViewSchema,
    canonicalViewItemSchema,
    canonicalAddToCartSchema,
    canonicalAddPaymentInfoSchema,
    canonicalAddShippingInfoSchema,
    canonicalBeginCheckoutSchema,
    canonicalPurchaseSchema,
    canonicalRefundSchema,
    canonicalViewItemListSchema,
    canonicalSelectItemSchema,
    canonicalAddToWishlistSchema,
    canonicalRemoveFromCartSchema,
    canonicalViewCartSchema,
    canonicalSearchSchema,
    canonicalViewSearchResultsSchema,
    canonicalViewPromotionSchema,
    canonicalSelectPromotionSchema,
    canonicalGenerateLeadSchema,
    canonicalFormStartSchema,
    canonicalFormSubmitSchema,
    canonicalFormErrorSchema,
    canonicalFilterApplySchema,
    canonicalSortApplySchema,
    canonicalVariantSelectSchema,
    canonicalSizeGuideViewSchema,
    canonicalScrollDepthSchema,
    canonicalViewCategorySchema,
    canonicalHeroInteractSchema,
    canonicalInteractWithAccordionSchema,
    canonicalOpenQuickViewSchema,
    canonicalVideoProgressSchema,
    canonicalMetaAppEventSchema,
    canonicalMetaOfflineEventSchema
  ]
)

export type CanonicalEvent = z.infer<typeof canonicalEventSchema>
export type ImplementedCanonicalEventName =
  CanonicalEvent['event_name']

export function parseCanonicalEvent(
  input: unknown
): CanonicalEvent {
  return canonicalEventSchema.parse(input)
}
