import { z } from 'zod'

import {
  shopifyTransactionalEmailLiveNotificationTypes,
  shopifyTransactionalEmailNotificationTypes,
  type ShopifyTransactionalEmailNotificationType
} from './shopifyTransactionalEmailEvidenceContract'

const modeSchema = z.enum([
  'disabled',
  'canary',
  'live'
])

const emailSchema = z.string().trim().toLowerCase().email().max(320)
const notificationTypeSchema = z.enum(
  shopifyTransactionalEmailNotificationTypes
)

export type ShopifyTransactionalEmailMode = z.infer<
  typeof modeSchema
>

export type ShopifyTransactionalEmailSettings = {
  activationAt: string | null
  canaryEmail: string | null
  mode: ShopifyTransactionalEmailMode
  notificationTypes:
    readonly ShopifyTransactionalEmailNotificationType[]
  shopDomain: string | null
}

type Environment = Readonly<Record<string, string | undefined>>

export function getShopifyTransactionalEmailSettings(
  env: Environment = process.env
): ShopifyTransactionalEmailSettings {
  const rawMode = env.SHOPIFY_TRANSACTIONAL_EMAILS_MODE
  const mode = rawMode === undefined
    ? 'disabled'
    : modeSchema.parse(rawMode)
  const activationAt = env
    .SHOPIFY_TRANSACTIONAL_EMAILS_ACTIVATION_AT
  const parsedActivationAt = activationAt
    ? new Date(activationAt)
    : null
  const shopDomain = (
    env.STORE_DOMAIN
    ?? env.VERCEL_SHOPIFY_STORE_DOMAIN
    ?? ''
  ).trim().toLowerCase()
  const canaryEmail = env
    .SHOPIFY_TRANSACTIONAL_EMAILS_CANARY_EMAIL
  const rawNotificationTypes = env
    .SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES

  if (
    mode !== 'disabled'
    && (
      !parsedActivationAt
      || !Number.isFinite(parsedActivationAt.getTime())
    )
  ) {
    throw new Error(
      'shopify_transactional_email_activation_at_invalid'
    )
  }

  if (
    mode !== 'disabled'
    && !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/u.test(shopDomain)
  ) {
    throw new Error(
      'shopify_transactional_email_shop_domain_invalid'
    )
  }

  const parsedCanaryEmail = canaryEmail
    ? emailSchema.safeParse(canaryEmail)
    : null

  if (
    canaryEmail
    && !parsedCanaryEmail?.success
  ) {
    throw new Error(
      'shopify_transactional_email_canary_email_invalid'
    )
  }

  if (
    mode === 'canary'
    && !parsedCanaryEmail?.success
  ) {
    throw new Error(
      'shopify_transactional_email_canary_email_missing'
    )
  }

  const notificationTypes = mode === 'disabled'
    ? []
    : rawNotificationTypes
      ?.split(',')
      .map(value => value.trim())

  const parsedNotificationTypes = z
    .array(notificationTypeSchema)
    .min(1)
    .safeParse(notificationTypes)

  if (
    mode !== 'disabled'
    && (
      !parsedNotificationTypes.success
      || new Set(parsedNotificationTypes.data).size
        !== parsedNotificationTypes.data.length
    )
  ) {
    throw new Error(
      'shopify_transactional_email_notification_types_invalid'
    )
  }

  if (
    mode === 'live'
    && parsedNotificationTypes.success
    && parsedNotificationTypes.data.some(
      notificationType => !shopifyTransactionalEmailLiveNotificationTypes
        .includes(notificationType)
    )
  ) {
    throw new Error(
      'shopify_transactional_email_live_notification_types_unsupported'
    )
  }

  return {
    activationAt: parsedActivationAt?.toISOString() ?? null,
    canaryEmail:
      parsedCanaryEmail?.success
        ? parsedCanaryEmail.data
        : null,
    mode,
    notificationTypes:
      parsedNotificationTypes.success
        ? parsedNotificationTypes.data
        : [],
    shopDomain: shopDomain || null
  }
}
