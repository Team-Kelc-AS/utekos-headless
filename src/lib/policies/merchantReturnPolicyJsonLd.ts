import { returnPolicy } from '@/lib/policies/returnPolicy'
import type { MerchantReturnPolicy } from 'schema-dts'

export const MERCHANT_RETURN_POLICY_ID =
  'https://utekos.no/#return-policy-no'

export const merchantReturnPolicyJsonLd = {
  '@type': 'MerchantReturnPolicy',
  '@id': MERCHANT_RETURN_POLICY_ID,
  'applicableCountry': returnPolicy.applicableCountry,
  'returnPolicyCountry': returnPolicy.returnPolicyCountry,
  'returnPolicyCategory':
    'https://schema.org/MerchantReturnFiniteReturnWindow',
  'merchantReturnDays': returnPolicy.returnWindowDays,
  'merchantReturnLink': returnPolicy.pageUrl,
  'itemCondition': 'https://schema.org/NewCondition',
  'returnMethod': 'https://schema.org/ReturnByMail',
  'returnFees':
    'https://schema.org/ReturnFeesCustomerResponsibility',
  'customerRemorseReturnFees':
    'https://schema.org/ReturnFeesCustomerResponsibility',
  'returnLabelSource':
    'https://schema.org/ReturnLabelCustomerResponsibility',
  'customerRemorseReturnLabelSource':
    'https://schema.org/ReturnLabelCustomerResponsibility',
  'itemDefectReturnFees': 'https://schema.org/FreeReturn',
  'refundType': 'https://schema.org/FullRefund'
} satisfies MerchantReturnPolicy
