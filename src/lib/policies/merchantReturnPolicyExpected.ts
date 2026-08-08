import { returnPolicy } from '@/lib/policies/returnPolicy'

export const merchantReturnPolicyExpected = {
  countries: [returnPolicy.applicableCountry],
  policy: {
    type: 'NUMBER_OF_DAYS_AFTER_DELIVERY',
    days: String(returnPolicy.returnWindowDays)
  },
  returnMethods: ['BY_MAIL'],
  itemConditions: ['NEW'],
  returnShippingFee: { type: 'CUSTOMER_PAYING_ACTUAL_FEE' },
  returnPolicyUri: returnPolicy.pageUrl,
  acceptDefectiveOnly: false,
  processRefundDays:
    returnPolicy.processRefundBusinessDays.maximum,
  acceptExchange: returnPolicy.acceptsExchanges,
  returnLabelSource: 'CUSTOMER_RESPONSIBILITY'
} as const
