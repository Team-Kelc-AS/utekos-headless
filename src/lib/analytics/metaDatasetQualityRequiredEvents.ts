export const requiredMetaDatasetQualityEvents = [
  'LandingScrollDepth',
  'PageView',
  'ViewContent',
  'ViewItemList',
  'ViewCart',
  'InteractWithAccordion',
  'AddToCart',
  'ViewCategory',
  'InitiateCheckout',
  'SelectItem',
  'HeroInteract',
  'RemoveFromCart',
  'Purchase',
  'AddToWishlist',
  'OpenQuickView',
  'AddPaymentInfo',
  'AddShippingInfo',
  'Lead'
] as const

export type RequiredMetaDatasetQualityEvent =
  (typeof requiredMetaDatasetQualityEvents)[number]
