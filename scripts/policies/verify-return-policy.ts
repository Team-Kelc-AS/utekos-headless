import { z } from 'zod'

import { merchantApiRequest } from '../../src/lib/google/merchant-center/merchantApiRequest'
import { getMerchantCenterConfig } from '../../src/lib/google/merchant-center/config'
import { merchantReturnPolicyExpected } from '../../src/lib/policies/merchantReturnPolicyExpected'
import { renderShopifyRefundPolicyHtml } from '../../src/lib/policies/renderShopifyRefundPolicyHtml'
import { returnPolicy } from '../../src/lib/policies/returnPolicy'
import { shopifyAdminGraphql } from '../../src/lib/shopify/shopifyAdminGraphql'

const shopPolicyResponseSchema = z.object({
  shop: z.object({
    shopPolicies: z.array(
      z.object({
        type: z.string(),
        body: z.string(),
        updatedAt: z.string()
      })
    )
  })
})

const merchantReturnPolicyResponseSchema = z.object({
  onlineReturnPolicies: z
    .array(
      z
        .object({
          countries: z.array(z.string()).optional(),
          policy: z
            .object({
              type: z.string().optional(),
              days: z.string().optional()
            })
            .optional(),
          restockingFee: z
            .object({
              fixedFee: z
                .object({ amountMicros: z.string().optional() })
                .optional(),
              microPercent: z.number().optional()
            })
            .optional(),
          returnMethods: z.array(z.string()).optional(),
          itemConditions: z.array(z.string()).optional(),
          returnShippingFee: z
            .object({ type: z.string().optional() })
            .optional(),
          returnPolicyUri: z.string().optional(),
          acceptDefectiveOnly: z.boolean().optional(),
          processRefundDays: z.number().optional(),
          acceptExchange: z.boolean().optional(),
          returnLabelSource: z.string().optional()
        })
        .passthrough()
    )
    .default([])
})

function normalizePolicyHtml(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasNoRestockingFee(
  restockingFee:
    | {
        fixedFee?:
          | { amountMicros?: string | undefined }
          | undefined
        microPercent?: number | undefined
      }
    | undefined
) {
  if (!restockingFee) return true

  return (
    Number(restockingFee.fixedFee?.amountMicros ?? 0) === 0 &&
    Number(restockingFee.microPercent ?? 0) === 0
  )
}

async function verifyShopifyPolicy() {
  const query = `
    query VerifyShopRefundPolicy {
      shop {
        shopPolicies {
          type
          body
          updatedAt
        }
      }
    }
  `
  const response = shopPolicyResponseSchema.parse(
    await shopifyAdminGraphql<unknown>(query)
  )
  const refundPolicy = response.shop.shopPolicies.find(
    policy => policy.type === 'REFUND_POLICY'
  )
  const expectedText = normalizePolicyHtml(
    renderShopifyRefundPolicyHtml()
  )
  const actualText = normalizePolicyHtml(
    refundPolicy?.body ?? ''
  )
  const checks = {
    refundPolicyPresent: Boolean(refundPolicy),
    canonicalEmail: actualText.includes(
      returnPolicy.contactEmail
    ),
    returnAddress: actualText.includes(
      returnPolicy.returnAddress.streetAddress
    ),
    exactCanonicalText: actualText === expectedText
  }

  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    updatedAt: refundPolicy?.updatedAt ?? null
  }
}

async function verifyMerchantPolicy() {
  const config = getMerchantCenterConfig()
  const response = await merchantApiRequest({
    path: `/accounts/v1/${config.accountName}/onlineReturnPolicies`,
    responseSchema: merchantReturnPolicyResponseSchema
  })
  const policy = response.onlineReturnPolicies.find(candidate =>
    candidate.countries?.includes(returnPolicy.applicableCountry)
  )
  const expected = merchantReturnPolicyExpected
  const checks = {
    norwayPolicyPresent: Boolean(policy),
    returnWindowType:
      policy?.policy?.type === expected.policy.type,
    returnWindowDays:
      policy?.policy?.days === expected.policy.days,
    returnByMail:
      policy?.returnMethods?.includes('BY_MAIL') === true,
    newCondition:
      policy?.itemConditions?.includes('NEW') === true,
    customerPaysActualReturnFee:
      policy?.returnShippingFee?.type ===
      expected.returnShippingFee.type,
    canonicalPolicyUrl:
      policy?.returnPolicyUri === expected.returnPolicyUri,
    acceptsGeneralReturns: policy?.acceptDefectiveOnly !== true,
    refundProcessingDays:
      policy?.processRefundDays === expected.processRefundDays,
    acceptsExchange:
      policy?.acceptExchange === expected.acceptExchange,
    customerCreatesLabel:
      policy?.returnLabelSource === expected.returnLabelSource,
    noRestockingFee: hasNoRestockingFee(policy?.restockingFee)
  }

  return {
    ok: Object.values(checks).every(Boolean),
    policyCount: response.onlineReturnPolicies.length,
    checks
  }
}

async function main() {
  const [shopify, merchant] = await Promise.all([
    verifyShopifyPolicy(),
    verifyMerchantPolicy()
  ])
  const result = {
    checkedAt: new Date().toISOString(),
    mode: 'read-only',
    ok: shopify.ok && merchant.ok,
    shopify,
    merchant
  }

  console.log(JSON.stringify(result, null, 2))

  if (!result.ok) process.exitCode = 1
}

main().catch(error => {
  console.error(
    JSON.stringify({
      mode: 'read-only',
      ok: false,
      error:
        error instanceof Error ? error.message : 'Unknown error'
    })
  )
  process.exitCode = 1
})
