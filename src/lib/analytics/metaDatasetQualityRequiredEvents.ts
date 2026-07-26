export const requiredMetaDatasetQualityEvents = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
  'Lead'
] as const

export type RequiredMetaDatasetQualityEvent =
  (typeof requiredMetaDatasetQualityEvents)[number]
