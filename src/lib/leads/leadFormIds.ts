export const LEAD_FORM_IDS = {
  productWaitlistUtekosDun: 'product_waitlist_utekos_dun',
  newsletterSignup: 'newsletter_signup',
  techdownAddToCart: 'techdown_add_to_cart',
  klarnaExpressCheckout: 'klarna_express_checkout'
} as const

export type LeadFormId =
  (typeof LEAD_FORM_IDS)[keyof typeof LEAD_FORM_IDS]

export const LEAD_TYPES = {
  productWaitlist: 'product_waitlist',
  newsletter: 'newsletter',
  commerceInterest: 'commerce_interest'
} as const

export type LeadType = (typeof LEAD_TYPES)[keyof typeof LEAD_TYPES]

export const LEAD_SOURCES = {
  productWaitlistUtekosDun: 'product_waitlist_utekos_dun',
  newsletterSignup: 'newsletter_signup'
} as const

export type LeadSource =
  (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES]

export const COMMERCE_INTEREST_LEAD_FORM_IDS = {
  techdownAddToCart: LEAD_FORM_IDS.techdownAddToCart,
  klarnaExpressCheckout: LEAD_FORM_IDS.klarnaExpressCheckout
} as const

export type CommerceInterestLeadFormId =
  (typeof COMMERCE_INTEREST_LEAD_FORM_IDS)[keyof typeof COMMERCE_INTEREST_LEAD_FORM_IDS]
