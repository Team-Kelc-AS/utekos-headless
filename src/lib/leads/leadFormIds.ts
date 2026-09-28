export const LEAD_FORM_IDS = {
  productWaitlistUtekosDun: 'product_waitlist_utekos_dun',
  newsletterSignup: 'newsletter_signup'
} as const

export type LeadFormId =
  (typeof LEAD_FORM_IDS)[keyof typeof LEAD_FORM_IDS]

export const LEAD_TYPES = {
  productWaitlist: 'product_waitlist',
  newsletter: 'newsletter'
} as const

export type LeadType = (typeof LEAD_TYPES)[keyof typeof LEAD_TYPES]

export const LEAD_SOURCES = {
  productWaitlistUtekosDun: 'product_waitlist_utekos_dun',
  newsletterSignup: 'newsletter_signup'
} as const

export type LeadSource =
  (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES]
