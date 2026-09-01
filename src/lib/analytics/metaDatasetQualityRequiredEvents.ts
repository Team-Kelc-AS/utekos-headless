export const requiredMetaDatasetQualityEvents = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'AddToWishlist',
  'RemoveFromCart',
  'InitiateCheckout',
  'AddShippingInfo',
  'AddPaymentInfo',
  'Purchase',
  'Lead'
] as const

export type RequiredMetaDatasetQualityEvent =
  (typeof requiredMetaDatasetQualityEvents)[number]
