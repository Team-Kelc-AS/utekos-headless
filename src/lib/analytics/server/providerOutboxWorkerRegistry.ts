import { createPostgresProviderOutboxWorker } from './createPostgresProviderOutboxWorker'
import type { RegisteredProviderAdapterKey } from './providerAdapterRegistry'
import { googleDataManagerAddToCartProviderAdapter } from './providerAdapters/googleDataManagerAddToCartProviderAdapter'
import { googleDataManagerAddPaymentInfoProviderAdapter } from './providerAdapters/googleDataManagerAddPaymentInfoProviderAdapter'
import { googleDataManagerAddToWishlistProviderAdapter } from './providerAdapters/googleDataManagerAddToWishlistProviderAdapter'
import { googleDataManagerBeginCheckoutProviderAdapter } from './providerAdapters/googleDataManagerBeginCheckoutProviderAdapter'
import { googleDataManagerFilterApplyProviderAdapter } from './providerAdapters/googleDataManagerFilterApplyProviderAdapter'
import { googleDataManagerFormErrorProviderAdapter } from './providerAdapters/googleDataManagerFormErrorProviderAdapter'
import { googleDataManagerFormStartProviderAdapter } from './providerAdapters/googleDataManagerFormStartProviderAdapter'
import { googleDataManagerFormSubmitProviderAdapter } from './providerAdapters/googleDataManagerFormSubmitProviderAdapter'
import { googleDataManagerGenerateLeadProviderAdapter } from './providerAdapters/googleDataManagerGenerateLeadProviderAdapter'
import { googleDataManagerPurchaseProviderAdapter } from './providerAdapters/googleDataManagerPurchaseProviderAdapter'
import { googleDataManagerRefundProviderAdapter } from './providerAdapters/googleDataManagerRefundProviderAdapter'
import { googleDataManagerRemoveFromCartProviderAdapter } from './providerAdapters/googleDataManagerRemoveFromCartProviderAdapter'
import { googleDataManagerScrollDepthProviderAdapter } from './providerAdapters/googleDataManagerScrollDepthProviderAdapter'
import { googleDataManagerSearchProviderAdapter } from './providerAdapters/googleDataManagerSearchProviderAdapter'
import { googleDataManagerSelectItemProviderAdapter } from './providerAdapters/googleDataManagerSelectItemProviderAdapter'
import { googleDataManagerSelectPromotionProviderAdapter } from './providerAdapters/googleDataManagerSelectPromotionProviderAdapter'
import { googleDataManagerSizeGuideViewProviderAdapter } from './providerAdapters/googleDataManagerSizeGuideViewProviderAdapter'
import { googleDataManagerSortApplyProviderAdapter } from './providerAdapters/googleDataManagerSortApplyProviderAdapter'
import { googleDataManagerVariantSelectProviderAdapter } from './providerAdapters/googleDataManagerVariantSelectProviderAdapter'
import { googleDataManagerVideoProgressProviderAdapter } from './providerAdapters/googleDataManagerVideoProgressProviderAdapter'
import { googleDataManagerViewCartProviderAdapter } from './providerAdapters/googleDataManagerViewCartProviderAdapter'
import { googleDataManagerViewCategoryProviderAdapter } from './providerAdapters/googleDataManagerViewCategoryProviderAdapter'
import { googleDataManagerHeroInteractProviderAdapter } from './providerAdapters/googleDataManagerHeroInteractProviderAdapter'
import { googleDataManagerViewItemProviderAdapter } from './providerAdapters/googleDataManagerViewItemProviderAdapter'
import { googleDataManagerViewItemListProviderAdapter } from './providerAdapters/googleDataManagerViewItemListProviderAdapter'
import { googleDataManagerViewPromotionProviderAdapter } from './providerAdapters/googleDataManagerViewPromotionProviderAdapter'
import { googleDataManagerViewSearchResultsProviderAdapter } from './providerAdapters/googleDataManagerViewSearchResultsProviderAdapter'
import { googleDataManagerInteractWithAccordionProviderAdapter } from './providerAdapters/googleDataManagerInteractWithAccordionProviderAdapter'
import { googleDataManagerOpenQuickViewProviderAdapter } from './providerAdapters/googleDataManagerOpenQuickViewProviderAdapter'
import { metaAddToCartProviderAdapter } from './providerAdapters/metaAddToCartProviderAdapter'
import { metaAddToWishlistProviderAdapter } from './providerAdapters/metaAddToWishlistProviderAdapter'
import { metaBeginCheckoutProviderAdapter } from './providerAdapters/metaBeginCheckoutProviderAdapter'
import { metaGenerateLeadProviderAdapter } from './providerAdapters/metaGenerateLeadProviderAdapter'
import { metaPageViewProviderAdapter } from './providerAdapters/metaPageViewProviderAdapter'
import { metaPurchaseProviderAdapter } from './providerAdapters/metaPurchaseProviderAdapter'
import { metaRemoveFromCartProviderAdapter } from './providerAdapters/metaRemoveFromCartProviderAdapter'
import { metaSearchProviderAdapter } from './providerAdapters/metaSearchProviderAdapter'
import { metaSelectItemProviderAdapter } from './providerAdapters/metaSelectItemProviderAdapter'
import { metaViewItemProviderAdapter } from './providerAdapters/metaViewItemProviderAdapter'
import { metaHeroInteractProviderAdapter } from './providerAdapters/metaHeroInteractProviderAdapter'
import { metaInteractWithAccordionProviderAdapter } from './providerAdapters/metaInteractWithAccordionProviderAdapter'
import { metaOpenQuickViewProviderAdapter } from './providerAdapters/metaOpenQuickViewProviderAdapter'
import { metaScrollDepthProviderAdapter } from './providerAdapters/metaScrollDepthProviderAdapter'
import { metaViewCartProviderAdapter } from './providerAdapters/metaViewCartProviderAdapter'
import { metaViewCategoryProviderAdapter } from './providerAdapters/metaViewCategoryProviderAdapter'
import { metaViewItemListProviderAdapter } from './providerAdapters/metaViewItemListProviderAdapter'
import { microsoftUetAddToCartProviderAdapter } from './providerAdapters/microsoftUetAddToCartProviderAdapter'
import { microsoftUetBeginCheckoutProviderAdapter } from './providerAdapters/microsoftUetBeginCheckoutProviderAdapter'
import { microsoftUetPageViewProviderAdapter } from './providerAdapters/microsoftUetPageViewProviderAdapter'
import { microsoftUetPurchaseProviderAdapter } from './providerAdapters/microsoftUetPurchaseProviderAdapter'
import { pinterestAddPaymentInfoProviderAdapter } from './providerAdapters/pinterestAddPaymentInfoProviderAdapter'
import { pinterestAddToCartProviderAdapter } from './providerAdapters/pinterestAddToCartProviderAdapter'
import { pinterestAddToWishlistProviderAdapter } from './providerAdapters/pinterestAddToWishlistProviderAdapter'
import { pinterestBeginCheckoutProviderAdapter } from './providerAdapters/pinterestBeginCheckoutProviderAdapter'
import { pinterestGenerateLeadProviderAdapter } from './providerAdapters/pinterestGenerateLeadProviderAdapter'
import { pinterestPurchaseProviderAdapter } from './providerAdapters/pinterestPurchaseProviderAdapter'
import { pinterestSearchProviderAdapter } from './providerAdapters/pinterestSearchProviderAdapter'
import { pinterestViewCategoryProviderAdapter } from './providerAdapters/pinterestViewCategoryProviderAdapter'
import { pinterestViewItemProviderAdapter } from './providerAdapters/pinterestViewItemProviderAdapter'
import type { ProviderOutboxBatchSummary } from './runProviderOutboxWorker'

export const providerOutboxWorkerRegistry = {
  'google:add_payment_info': createPostgresProviderOutboxWorker(
    googleDataManagerAddPaymentInfoProviderAdapter
  ),
  'google:add_to_cart': createPostgresProviderOutboxWorker(
    googleDataManagerAddToCartProviderAdapter
  ),
  'google:add_to_wishlist': createPostgresProviderOutboxWorker(
    googleDataManagerAddToWishlistProviderAdapter
  ),
  'google:begin_checkout': createPostgresProviderOutboxWorker(
    googleDataManagerBeginCheckoutProviderAdapter
  ),
  'google:filter_apply': createPostgresProviderOutboxWorker(
    googleDataManagerFilterApplyProviderAdapter
  ),
  'google:form_error': createPostgresProviderOutboxWorker(
    googleDataManagerFormErrorProviderAdapter
  ),
  'google:form_start': createPostgresProviderOutboxWorker(
    googleDataManagerFormStartProviderAdapter
  ),
  'google:form_submit': createPostgresProviderOutboxWorker(
    googleDataManagerFormSubmitProviderAdapter
  ),
  'google:generate_lead': createPostgresProviderOutboxWorker(
    googleDataManagerGenerateLeadProviderAdapter
  ),
  'google:purchase': createPostgresProviderOutboxWorker(
    googleDataManagerPurchaseProviderAdapter
  ),
  'google:refund': createPostgresProviderOutboxWorker(
    googleDataManagerRefundProviderAdapter
  ),
  'google:remove_from_cart': createPostgresProviderOutboxWorker(
    googleDataManagerRemoveFromCartProviderAdapter
  ),
  'google:scroll_depth': createPostgresProviderOutboxWorker(
    googleDataManagerScrollDepthProviderAdapter
  ),
  'google:search': createPostgresProviderOutboxWorker(
    googleDataManagerSearchProviderAdapter
  ),
  'google:select_item': createPostgresProviderOutboxWorker(
    googleDataManagerSelectItemProviderAdapter
  ),
  'google:select_promotion': createPostgresProviderOutboxWorker(
    googleDataManagerSelectPromotionProviderAdapter
  ),
  'google:size_guide_view': createPostgresProviderOutboxWorker(
    googleDataManagerSizeGuideViewProviderAdapter
  ),
  'google:sort_apply': createPostgresProviderOutboxWorker(
    googleDataManagerSortApplyProviderAdapter
  ),
  'google:variant_select': createPostgresProviderOutboxWorker(
    googleDataManagerVariantSelectProviderAdapter
  ),
  'google:video_progress': createPostgresProviderOutboxWorker(
    googleDataManagerVideoProgressProviderAdapter
  ),
  'google:view_cart': createPostgresProviderOutboxWorker(
    googleDataManagerViewCartProviderAdapter
  ),
  'google:view_category': createPostgresProviderOutboxWorker(
    googleDataManagerViewCategoryProviderAdapter
  ),
  'google:hero_interact': createPostgresProviderOutboxWorker(
    googleDataManagerHeroInteractProviderAdapter
  ),
  'google:interact_with_accordion': createPostgresProviderOutboxWorker(
    googleDataManagerInteractWithAccordionProviderAdapter
  ),
  'google:open_quick_view': createPostgresProviderOutboxWorker(
    googleDataManagerOpenQuickViewProviderAdapter
  ),
  'google:view_item': createPostgresProviderOutboxWorker(
    googleDataManagerViewItemProviderAdapter
  ),
  'google:view_item_list': createPostgresProviderOutboxWorker(
    googleDataManagerViewItemListProviderAdapter
  ),
  'google:view_promotion': createPostgresProviderOutboxWorker(
    googleDataManagerViewPromotionProviderAdapter
  ),
  'google:view_search_results': createPostgresProviderOutboxWorker(
    googleDataManagerViewSearchResultsProviderAdapter
  ),
  'meta:add_to_cart': createPostgresProviderOutboxWorker(
    metaAddToCartProviderAdapter
  ),
  'meta:add_to_wishlist': createPostgresProviderOutboxWorker(
    metaAddToWishlistProviderAdapter
  ),
  'meta:begin_checkout': createPostgresProviderOutboxWorker(
    metaBeginCheckoutProviderAdapter
  ),
  'meta:generate_lead': createPostgresProviderOutboxWorker(
    metaGenerateLeadProviderAdapter
  ),
  'meta:hero_interact': createPostgresProviderOutboxWorker(
    metaHeroInteractProviderAdapter
  ),
  'meta:interact_with_accordion': createPostgresProviderOutboxWorker(
    metaInteractWithAccordionProviderAdapter
  ),
  'meta:open_quick_view': createPostgresProviderOutboxWorker(
    metaOpenQuickViewProviderAdapter
  ),
  'meta:page_view': createPostgresProviderOutboxWorker(
    metaPageViewProviderAdapter
  ),
  'meta:purchase': createPostgresProviderOutboxWorker(
    metaPurchaseProviderAdapter
  ),
  'meta:remove_from_cart': createPostgresProviderOutboxWorker(
    metaRemoveFromCartProviderAdapter
  ),
  'meta:scroll_depth': createPostgresProviderOutboxWorker(
    metaScrollDepthProviderAdapter
  ),
  'meta:search': createPostgresProviderOutboxWorker(
    metaSearchProviderAdapter
  ),
  'meta:select_item': createPostgresProviderOutboxWorker(
    metaSelectItemProviderAdapter
  ),
  'meta:view_item': createPostgresProviderOutboxWorker(
    metaViewItemProviderAdapter
  ),
  'meta:view_cart': createPostgresProviderOutboxWorker(
    metaViewCartProviderAdapter
  ),
  'meta:view_category': createPostgresProviderOutboxWorker(
    metaViewCategoryProviderAdapter
  ),
  'meta:view_item_list': createPostgresProviderOutboxWorker(
    metaViewItemListProviderAdapter
  ),
  'microsoft_uet:add_to_cart': createPostgresProviderOutboxWorker(
    microsoftUetAddToCartProviderAdapter
  ),
  'microsoft_uet:begin_checkout': createPostgresProviderOutboxWorker(
    microsoftUetBeginCheckoutProviderAdapter
  ),
  'microsoft_uet:page_view': createPostgresProviderOutboxWorker(
    microsoftUetPageViewProviderAdapter
  ),
  'microsoft_uet:purchase': createPostgresProviderOutboxWorker(
    microsoftUetPurchaseProviderAdapter
  ),
  'pinterest:add_payment_info': createPostgresProviderOutboxWorker(
    pinterestAddPaymentInfoProviderAdapter
  ),
  'pinterest:add_to_cart': createPostgresProviderOutboxWorker(
    pinterestAddToCartProviderAdapter
  ),
  'pinterest:add_to_wishlist': createPostgresProviderOutboxWorker(
    pinterestAddToWishlistProviderAdapter
  ),
  'pinterest:begin_checkout': createPostgresProviderOutboxWorker(
    pinterestBeginCheckoutProviderAdapter
  ),
  'pinterest:generate_lead': createPostgresProviderOutboxWorker(
    pinterestGenerateLeadProviderAdapter
  ),
  'pinterest:purchase': createPostgresProviderOutboxWorker(
    pinterestPurchaseProviderAdapter
  ),
  'pinterest:search': createPostgresProviderOutboxWorker(
    pinterestSearchProviderAdapter
  ),
  'pinterest:view_category': createPostgresProviderOutboxWorker(
    pinterestViewCategoryProviderAdapter
  ),
  'pinterest:view_item': createPostgresProviderOutboxWorker(
    pinterestViewItemProviderAdapter
  )
} as const satisfies Record<
  RegisteredProviderAdapterKey,
  (input: { maxItems: number }) => Promise<ProviderOutboxBatchSummary>
>
