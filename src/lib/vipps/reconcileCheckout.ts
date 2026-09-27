import 'server-only'
import { captureAndComplete } from './captureAndComplete'
import { withVippsCheckout } from './checkoutStore'
import { getVippsRuntime } from './runtime'
import { VippsPaymentInvariantError } from './payment'

export async function reconcileVippsCheckout(reference: string) {
  const { config, client, shopify } = getVippsRuntime()
  return withVippsCheckout(
    config,
    reference,
    async (state, save) => {
      // A cached paid result is an already verified historical capture, not a new provider claim.
      if (state.stage === 'paid' && state.order)
        return { status: 'paid' as const, order: state.order }
      if (
        !state.draftId ||
        !state.amount ||
        state.shippingAmount === undefined
      )
        throw new Error('Vipps checkout is not ready')
      const draftId = state.draftId
      const amount = state.amount
      try {
        const result = await captureAndComplete(
          { ...config, reference, amount },
          {
            getPayment: client.getPayment,
            capture: client.capture,
            async prepareOrder(payment) {
              if (
                payment.shippingDetails?.shippingOptionId !==
                  'utekos-standard-no' ||
                payment.shippingDetails.shippingCost !==
                  state.shippingAmount
              ) {
                throw new VippsPaymentInvariantError(
                  'shipping_selection_mismatch'
                )
              }
              await shopify.prepare(
                draftId,
                reference,
                amount,
                payment
              )
            },
            completePaidOrder: payment =>
              shopify.completePaid(
                draftId,
                reference,
                amount,
                payment
              )
          }
        )
        if (result.status === 'paid')
          await save({
            ...state,
            stage: 'paid',
            order: result.order
          })
        if (result.status === 'terminal')
          await save({ ...state, stage: 'terminal' })
        return result
      } catch (error) {
        await save({
          ...state,
          lastError:
            error instanceof VippsPaymentInvariantError ?
              error.code
            : 'reconciliation_failed'
        })
        throw error
      }
    }
  )
}
