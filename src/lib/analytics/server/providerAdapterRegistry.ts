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
import { microsoftUetPurchaseProviderAdapter } from './providerAdapters/microsoftUetPurchaseProviderAdapter'
import { microsoftUetPageViewProviderAdapter } from './providerAdapters/microsoftUetPageViewProviderAdapter'
import { pinterestAddPaymentInfoProviderAdapter } from './providerAdapters/pinterestAddPaymentInfoProviderAdapter'
import { pinterestAddToCartProviderAdapter } from './providerAdapters/pinterestAddToCartProviderAdapter'
import { pinterestAddToWishlistProviderAdapter } from './providerAdapters/pinterestAddToWishlistProviderAdapter'
import { pinterestBeginCheckoutProviderAdapter } from './providerAdapters/pinterestBeginCheckoutProviderAdapter'
import { pinterestGenerateLeadProviderAdapter } from './providerAdapters/pinterestGenerateLeadProviderAdapter'
import { pinterestPurchaseProviderAdapter } from './providerAdapters/pinterestPurchaseProviderAdapter'
import { pinterestSearchProviderAdapter } from './providerAdapters/pinterestSearchProviderAdapter'
import { pinterestViewCategoryProviderAdapter } from './providerAdapters/pinterestViewCategoryProviderAdapter'
import { pinterestViewItemProviderAdapter } from './providerAdapters/pinterestViewItemProviderAdapter'
import type { ProviderAdapterKey } from './providerAdapter'

export const providerAdapterRegistry = {
  'google:add_payment_info':
    googleDataManagerAddPaymentInfoProviderAdapter,
  'google:add_to_cart': googleDataManagerAddToCartProviderAdapter,
  'google:add_to_wishlist': googleDataManagerAddToWishlistProviderAdapter,
  'google:begin_checkout':
    googleDataManagerBeginCheckoutProviderAdapter,
  'google:filter_apply': googleDataManagerFilterApplyProviderAdapter,
  'google:form_error': googleDataManagerFormErrorProviderAdapter,
  'google:form_start': googleDataManagerFormStartProviderAdapter,
  'google:form_submit': googleDataManagerFormSubmitProviderAdapter,
  'google:generate_lead': googleDataManagerGenerateLeadProviderAdapter,
  'google:hero_interact': googleDataManagerHeroInteractProviderAdapter,
  'google:interact_with_accordion':
    googleDataManagerInteractWithAccordionProviderAdapter,
  'google:open_quick_view': googleDataManagerOpenQuickViewProviderAdapter,
  'google:purchase': googleDataManagerPurchaseProviderAdapter,
  'google:refund': googleDataManagerRefundProviderAdapter,
  'google:remove_from_cart': googleDataManagerRemoveFromCartProviderAdapter,
  'google:scroll_depth': googleDataManagerScrollDepthProviderAdapter,
  'google:search': googleDataManagerSearchProviderAdapter,
  'google:select_item': googleDataManagerSelectItemProviderAdapter,
  'google:select_promotion': googleDataManagerSelectPromotionProviderAdapter,
  'google:size_guide_view': googleDataManagerSizeGuideViewProviderAdapter,
  'google:sort_apply': googleDataManagerSortApplyProviderAdapter,
  'google:variant_select': googleDataManagerVariantSelectProviderAdapter,
  'google:video_progress': googleDataManagerVideoProgressProviderAdapter,
  'google:view_cart': googleDataManagerViewCartProviderAdapter,
  'google:view_category': googleDataManagerViewCategoryProviderAdapter,
  'google:view_item': googleDataManagerViewItemProviderAdapter,
  'google:view_item_list': googleDataManagerViewItemListProviderAdapter,
  'google:view_promotion': googleDataManagerViewPromotionProviderAdapter,
  'google:view_search_results':
    googleDataManagerViewSearchResultsProviderAdapter,
  'meta:add_to_cart': metaAddToCartProviderAdapter,
  'meta:add_to_wishlist': metaAddToWishlistProviderAdapter,
  'meta:begin_checkout': metaBeginCheckoutProviderAdapter,
  'meta:generate_lead': metaGenerateLeadProviderAdapter,
  'meta:hero_interact': metaHeroInteractProviderAdapter,
  'meta:interact_with_accordion':
    metaInteractWithAccordionProviderAdapter,
  'meta:open_quick_view': metaOpenQuickViewProviderAdapter,
  'meta:page_view': metaPageViewProviderAdapter,
  'meta:purchase': metaPurchaseProviderAdapter,
  'meta:remove_from_cart': metaRemoveFromCartProviderAdapter,
  'meta:scroll_depth': metaScrollDepthProviderAdapter,
  'meta:search': metaSearchProviderAdapter,
  'meta:select_item': metaSelectItemProviderAdapter,
  'meta:view_item': metaViewItemProviderAdapter,
  'meta:view_cart': metaViewCartProviderAdapter,
  'meta:view_category': metaViewCategoryProviderAdapter,
  'meta:view_item_list': metaViewItemListProviderAdapter,
  'microsoft_uet:add_to_cart': microsoftUetAddToCartProviderAdapter,
  'microsoft_uet:begin_checkout':
    microsoftUetBeginCheckoutProviderAdapter,
  'microsoft_uet:page_view': microsoftUetPageViewProviderAdapter,
  'microsoft_uet:purchase': microsoftUetPurchaseProviderAdapter,
  'pinterest:add_payment_info':
    pinterestAddPaymentInfoProviderAdapter,
  'pinterest:add_to_cart': pinterestAddToCartProviderAdapter,
  'pinterest:add_to_wishlist':
    pinterestAddToWishlistProviderAdapter,
  'pinterest:begin_checkout': pinterestBeginCheckoutProviderAdapter,
  'pinterest:generate_lead': pinterestGenerateLeadProviderAdapter,
  'pinterest:purchase': pinterestPurchaseProviderAdapter,
  'pinterest:search': pinterestSearchProviderAdapter,
  'pinterest:view_category': pinterestViewCategoryProviderAdapter,
  'pinterest:view_item': pinterestViewItemProviderAdapter
} as const satisfies Partial<Record<ProviderAdapterKey, unknown>>

export type RegisteredProviderAdapterKey =
  keyof typeof providerAdapterRegistry
