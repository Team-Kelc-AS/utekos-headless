import { z } from 'zod'

export function getTechDownContribution(input: unknown) {
  const costs = z
    .strictObject({
      netRevenueExVat: z.number().nonnegative(),
      goodsCost: z.number().nonnegative(),
      shippingFulfillmentCost: z.number().nonnegative(),
      paymentCost: z.number().nonnegative(),
      expectedReturnsCost: z.number().nonnegative()
    })
    .parse(input)
  const contribution =
    Math.round(
      (costs.netRevenueExVat -
        costs.goodsCost -
        costs.shippingFulfillmentCost -
        costs.paymentCost -
        costs.expectedReturnsCost) *
        100
    ) / 100
  return {
    contributionBeforeAdsNok: contribution,
    breakEvenNewCustomerCacNok: contribution
  }
}
