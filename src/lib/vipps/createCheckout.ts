import 'server-only'
import { z } from 'zod'
import { merchantShippingServiceJsonLd } from '@/lib/policies/merchantShippingServiceJsonLd'
import { getVippsRuntime, vippsStatusToken } from './runtime'
import { withVippsCheckout } from './checkoutStore'
import { toMinorUnits } from './shopifyOrder'
import { vippsPaymentDescription } from './productDescription'

export const vippsCheckoutInputSchema = z.object({
  handle: z.string().regex(/^[a-z0-9-]{1,100}$/),
  variantId: z
    .string()
    .regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
  discountCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{1,255}$/)
    .optional(),
  attemptId: z.uuid()
})

export function vippsStandardShippingAmount(subtotal: number) {
  const rule = [
    ...merchantShippingServiceJsonLd.shippingConditions
  ]
    .reverse()
    .find(
      item =>
        subtotal >= Math.round(item.orderValue.minValue * 100)
    )
  if (!rule) throw new Error('No Norwegian shipping policy')
  return Math.round(rule.shippingRate.value * 100)
}

export function buildVippsPaymentRequest(input: {
  reference: string
  amount: number
  shippingAmount: number
  productTitle: string
  selectedOptions: Array<{ name: string; value: string }>
  origin: string
  token: string
}) {
  return {
    reference: input.reference,
    amount: {
      currency: 'NOK',
      value: input.amount - input.shippingAmount
    },
    paymentMethod: { type: 'WALLET' },
    userFlow: 'WEB_REDIRECT',
    profile: { scope: 'name phoneNumber email address' },
    paymentDescription: vippsPaymentDescription(
      input.productTitle,
      input.selectedOptions
    ),
    // Vipps requires a redirect URL it can validate and redirect to. The return
    // page consumes this short-lived capability immediately and removes it from
    // the browser URL before making any further navigation.
    returnUrl: `${input.origin}/vipps/retur?reference=${encodeURIComponent(input.reference)}&token=${encodeURIComponent(input.token)}`,
    shipping: {
      allowedCountries: ['NO'],
      fixedOptions: [
        {
          brand: 'OTHER',
          type: 'OTHER',
          options: [
            {
              id: 'utekos-standard-no',
              name: 'Standardfrakt i Norge',
              isDefault: true,
              amount: {
                currency: 'NOK',
                value: input.shippingAmount
              }
            }
          ]
        }
      ]
    }
  }
}

export async function createVippsCheckout(
  input: z.infer<typeof vippsCheckoutInputSchema>
) {
  if (process.env.VIPPS_EXPRESS_ENABLED !== 'true')
    throw new Error('Vipps Express is disabled')
  const { config, origin, secret, client, shopify } =
    getVippsRuntime()
  const reference = `utekos-express-${input.attemptId}`
  const token = vippsStatusToken(reference, secret)
  return withVippsCheckout(
    config,
    reference,
    async (state, save) => {
      let verifiedVariant:
        | {
            productTitle: string
            selectedOptions: Array<{
              name: string
              value: string
            }>
          }
        | undefined
      if (
        state.handle !== input.handle ||
        state.variantId !== input.variantId ||
        state.discountCode !== input.discountCode
      )
        throw new Error(
          'Vipps attempt belongs to another variant'
        )
      if (state.stage === 'paid' || state.stage === 'terminal')
        throw new Error('Vipps attempt already finished')
      if (state.shopifyCheckoutUrl)
        return {
          redirectUrl: state.shopifyCheckoutUrl,
          checkoutMode: 'shopify' as const,
          reference,
          token
        }
      if (state.redirectUrl)
        return {
          redirectUrl: state.redirectUrl,
          checkoutMode: 'vipps' as const,
          reference,
          token
        }
      if (state.stage === 'draft_creating' && !state.draftId)
        throw new Error(
          'Shopify draft creation needs reconciliation; do not duplicate'
        )
      if (state.stage === 'new') {
        verifiedVariant = await shopify.findAvailableVariant(
          input.handle,
          input.variantId
        )
        await save({ ...state, stage: 'draft_creating' })
        const draft = await shopify.create({
          lineItems: [
            {
              variantId: input.variantId,
              quantity: 1,
              generatePriceOverride: true
            }
          ],
          presentmentCurrencyCode: 'NOK',
          acceptAutomaticDiscounts: true,
          ...(state.discountCode ?
            { discountCodes: [state.discountCode] }
          : {}),
          reserveInventoryUntil: new Date(
            Date.now() + 30 * 60 * 1000
          ).toISOString(),
          tags: ['vipps-express', `vipps-${config.environment}`],
          customAttributes: [
            { key: 'vipps_reference', value: reference },
            { key: 'vipps_msn', value: config.msn },
            {
              key: 'vipps_environment',
              value: config.environment
            },
            {
              key: 'utekos_checkout_method',
              value: 'vipps_express'
            },
            ...(state.discountCode ?
              [
                {
                  key: 'utekos_discount_code',
                  value: state.discountCode
                }
              ]
            : []),
            {
              key: 'utekos_checkout_started_at',
              value:
                state.checkoutStartedAt ??
                state.termsAcceptedAt ??
                new Date().toISOString()
            }
          ],
          note: `Vipps Express ${reference}. Payment is only completed after verified capture.`
        })
        const shippingAmount = vippsStandardShippingAmount(
          toMinorUnits(
            draft.totalPriceSet.presentmentMoney.amount
          )
        )
        state = {
          ...state,
          stage: 'draft_ready',
          draftId: draft.id,
          shippingAmount
        }
        await save(state)
      }
      if (state.stage === 'draft_ready') {
        const draft = await shopify.update(state.draftId!, {
          shippingLine: {
            title: 'Standardfrakt i Norge',
            priceWithCurrency: {
              amount: (state.shippingAmount! / 100).toFixed(2),
              currencyCode: 'NOK'
            }
          }
        })
        const amount = toMinorUnits(
          draft.totalPriceSet.presentmentMoney.amount
        )
        if (amount - state.shippingAmount! < 100) {
          if (!state.discountCode)
            throw new Error(
              'Vipps Express requires a positive merchandise amount'
            )
          if (!draft.discountCodes.includes(state.discountCode))
            throw new Error(
              'Shopify did not apply the supplied discount code'
            )
          if (!draft.invoiceUrl)
            throw new Error(
              'Shopify checkout URL is unavailable for this discounted order'
            )
          state = {
            ...state,
            stage: 'shopify_checkout_ready',
            amount,
            shopifyCheckoutUrl: draft.invoiceUrl
          }
          await save(state)
          return {
            redirectUrl: draft.invoiceUrl,
            checkoutMode: 'shopify' as const,
            reference,
            token
          }
        }
        verifiedVariant ??= await shopify.findAvailableVariant(
          input.handle,
          input.variantId
        )
        const paymentRequest = buildVippsPaymentRequest({
          reference,
          amount,
          shippingAmount: state.shippingAmount!,
          productTitle: verifiedVariant.productTitle,
          selectedOptions: verifiedVariant.selectedOptions,
          origin,
          token
        })
        state = {
          ...state,
          stage: 'payment_creating',
          amount,
          paymentRequest
        }
        await save(state)
      }
      if (!state.paymentRequest)
        throw new Error(
          'Vipps immutable payment request missing'
        )
      const payment = await client.createPayment(
        state.paymentRequest,
        // Vipps accepts a 64-character payment reference but limits
        // Idempotency-Key to 50. The client attempt UUID is stable across a
        // retry of this checkout and remains within that narrower limit.
        input.attemptId
      )
      if (payment.reference !== reference)
        throw new Error('Vipps returned unexpected reference')
      state = {
        ...state,
        stage: 'payment_ready',
        redirectUrl: payment.redirectUrl
      }
      await save(state)
      return {
        redirectUrl: payment.redirectUrl,
        checkoutMode: 'vipps' as const,
        reference,
        token
      }
    },
    {
      handle: input.handle,
      variantId: input.variantId,
      ...(input.discountCode ?
        { discountCode: input.discountCode }
      : {}),
      checkoutStartedAt: new Date().toISOString(),
      stage: 'new'
    }
  )
}
