import { z } from 'zod'

const RuntimeEnvSchema = z.strictObject({
  enabled: z.enum(['true', 'false']).default('false'),
  activatedAt: z.string().datetime({ offset: true }).optional(),
  comfyrobeProductId: z
    .string()
    .regex(/^gid:\/\/shopify\/Product\/[0-9]+$/)
    .optional()
})

export type AbandonedCheckoutRecoveryRuntimeConfig = {
  enabled: boolean
  activatedAt: Date | null
}

export function getAbandonedCheckoutRecoveryRuntimeConfig():
AbandonedCheckoutRecoveryRuntimeConfig {
  const parsed = RuntimeEnvSchema.safeParse({
    enabled: process.env.ABANDONED_CHECKOUT_RECOVERY_ENABLED,
    activatedAt:
      process.env.ABANDONED_CHECKOUT_RECOVERY_ACTIVATED_AT,
    comfyrobeProductId:
      process.env.STAYCOMFY_COMFYROBE_PRODUCT_ID
  })

  if (!parsed.success) {
    throw new Error('abandoned_checkout_recovery_runtime_config_invalid')
  }

  if (parsed.data.enabled === 'true') {
    if (!parsed.data.activatedAt || !parsed.data.comfyrobeProductId) {
      throw new Error('abandoned_checkout_recovery_runtime_config_invalid')
    }

    const activatedAt = new Date(parsed.data.activatedAt)

    if (activatedAt.getTime() > Date.now()) {
      throw new Error('abandoned_checkout_recovery_runtime_config_invalid')
    }

    return { enabled: true, activatedAt }
  }

  return { enabled: false, activatedAt: null }
}
