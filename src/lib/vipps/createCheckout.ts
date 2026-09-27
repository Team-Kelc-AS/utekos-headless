import 'server-only'
import { z } from 'zod'
import { merchantShippingServiceJsonLd } from '@/lib/policies/merchantShippingServiceJsonLd'
import { getVippsRuntime, vippsStatusToken } from './runtime'
import { withVippsCheckout } from './checkoutStore'
import { toMinorUnits } from './shopifyOrder'

export const vippsCheckoutInputSchema = z.object({
  handle: z.string().regex(/^[a-z0-9-]{1,100}$/),
  variantId: z
    .string()
    .regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
  attemptId: z.uuid(),
  termsAccepted: z.literal(true)
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
      if (
        state.handle !== input.handle ||
        state.variantId !== input.variantId
      )
        throw new Error(
          'Vipps attempt belongs to another variant'
        )
      if (state.stage === 'paid' || state.stage === 'terminal')
        throw new Error('Vipps attempt already finished')
      if (state.redirectUrl)
        return {
          redirectUrl: state.redirectUrl,
          reference,
          token
        }
      if (state.stage === 'draft_creating' && !state.draftId)
        throw new Error(
          'Shopify draft creation needs reconciliation; do not duplicate'
        )
      if (state.stage === 'new') {
        await shopify.findAvailableVariant(
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
            {
              key: 'utekos_terms_accepted_at',
              value: state.termsAcceptedAt
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
        if (amount - state.shippingAmount! < 100)
          throw new Error('Invalid Vipps order amount')
        const paymentRequest = {
          reference,
          amount: {
            currency: 'NOK',
            value: amount - state.shippingAmount!
          },
          paymentMethod: { type: 'WALLET' },
          userFlow: 'WEB_REDIRECT',
          profile: { scope: 'name phoneNumber email address' },
          paymentDescription: 'Kjøp hos Utekos',
          // Vipps requires a redirect URL it can validate and redirect to. The return
          // page consumes this short-lived capability immediately and removes it from
          // the browser URL before making any further navigation.
          returnUrl: `${origin}/vipps/retur?reference=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`,
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
                      value: state.shippingAmount
                    }
                  }
                ]
              }
            ]
          }
        }
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
        reference,
        token
      }
    },
    {
      handle: input.handle,
      variantId: input.variantId,
      termsAcceptedAt: new Date().toISOString(),
      stage: 'new'
    }
  )
}
