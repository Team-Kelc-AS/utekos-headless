import { z } from 'zod'

export const vippsReferenceSchema = z
  .string()
  .regex(/^[a-zA-Z0-9-]{8,64}$/)
export const vippsMoneySchema = z.object({
  currency: z.literal('NOK'),
  value: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
})

export const vippsPaymentSchema = z.object({
  reference: vippsReferenceSchema,
  state: z.enum([
    'CREATED',
    'AUTHORIZED',
    'ABORTED',
    'EXPIRED',
    'TERMINATED'
  ]),
  amount: vippsMoneySchema,
  aggregate: z
    .object({
      authorizedAmount: vippsMoneySchema,
      capturedAmount: vippsMoneySchema,
      cancelledAmount: vippsMoneySchema,
      refundedAmount: vippsMoneySchema
    })
    .optional(),
  shippingDetails: z
    .object({
      address: z.object({
        addressLine1: z.string().min(1),
        addressLine2: z.string().optional(),
        city: z.string().min(1),
        country: z.string().length(2),
        postCode: z.string().min(1)
      }),
      shippingCost: z.number().int().nonnegative(),
      shippingOptionId: z.string().min(1),
      shippingOptionName: z.string().min(1)
    })
    .optional(),
  userDetails: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      mobileNumber: z.string().optional()
    })
    .optional()
})

export type VippsPayment = z.infer<typeof vippsPaymentSchema>

export class VippsPaymentInvariantError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'VippsPaymentInvariantError'
  }
}

export function assertPaymentIdentity(
  payment: VippsPayment,
  reference: string,
  expectedAmount: number
) {
  if (
    !Number.isSafeInteger(expectedAmount) ||
    expectedAmount < 100
  ) {
    throw new VippsPaymentInvariantError(
      'invalid_expected_amount'
    )
  }
  if (
    payment.reference !== reference ||
    payment.amount.value !== expectedAmount
  ) {
    throw new VippsPaymentInvariantError(
      'payment_identity_or_amount_mismatch'
    )
  }
}

export function isFullyCaptured(
  payment: VippsPayment,
  expectedAmount: number
) {
  const aggregate = payment.aggregate
  return (
    payment.state === 'AUTHORIZED' &&
    !!aggregate &&
    aggregate.authorizedAmount.value === expectedAmount &&
    aggregate.capturedAmount.value === expectedAmount &&
    aggregate.cancelledAmount.value === 0 &&
    aggregate.refundedAmount.value === 0
  )
}

/** Pure decision: AUTHORIZED is not PAID; neither a redirect nor an HTTP 200 is evidence. */
export function captureDecision(
  payment: VippsPayment,
  reference: string,
  expectedAmount: number
) {
  assertPaymentIdentity(payment, reference, expectedAmount)
  if (payment.state === 'CREATED') return 'wait' as const
  if (payment.state !== 'AUTHORIZED') return 'terminal' as const
  if (isFullyCaptured(payment, expectedAmount))
    return 'complete' as const
  const aggregate = payment.aggregate
  if (
    !aggregate ||
    aggregate.authorizedAmount.value !== expectedAmount ||
    aggregate.cancelledAmount.value !== 0 ||
    aggregate.refundedAmount.value !== 0 ||
    aggregate.capturedAmount.value !== 0
  ) {
    // Do not guess a new remainder after a partial/foreign modification.
    throw new VippsPaymentInvariantError(
      'unexpected_payment_aggregate'
    )
  }
  return 'capture' as const
}
