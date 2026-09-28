import {
  LEAD_FORM_IDS,
  type LeadFormId
} from './leadFormIds'

export const LEAD_VALUE_POLICY = {
  version: '2026-09-28-net-revenue-30d-v1',
  currency: 'NOK',
  attributionWindowDays: 30,
  reviewAfter: '2026-10-28',
  values: {
    [LEAD_FORM_IDS.newsletterSignup]: {
      value: 396.61,
      maturedLeads: 66,
      attributedPurchases: 18
    },
    [LEAD_FORM_IDS.productWaitlistUtekosDun]: {
      value: 415.65,
      maturedLeads: 19,
      attributedPurchases: 3
    }
  }
} as const satisfies {
  attributionWindowDays: number
  currency: string
  reviewAfter: string
  values: Record<
    LeadFormId,
    {
      attributedPurchases: number
      maturedLeads: number
      value: number
    }
  >
  version: string
}

export type LeadMonetaryValue = {
  currency: typeof LEAD_VALUE_POLICY.currency
  value: number
}

/**
 * Returns the fixed value available at event time for Meta value
 * optimization. Values are observed 30-day Shopify net revenue per mature
 * canonical lead, matched by SHA-256 email and net of recorded refunds.
 *
 * Keeping the mapping exhaustive makes a new Lead producer fail type-checking
 * until it receives an approved, evidence-backed valuation.
 */
export function monetaryValueForLead(
  formId: LeadFormId
): LeadMonetaryValue {
  return {
    currency: LEAD_VALUE_POLICY.currency,
    value: LEAD_VALUE_POLICY.values[formId].value
  }
}
