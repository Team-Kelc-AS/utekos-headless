import { z } from 'zod'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'
import type { CanonicalPurchase } from '../purchaseEvent'
import {
  buildMicrosoftUetCapiUserData,
  microsoftUetCapiUserDataSchema
} from './microsoftUetCapiUserData'

const microsoftUetCapiItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    price: z.number().nonnegative().optional(),
    quantity: z.number().int().positive().optional()
  })
  .strict()

const microsoftUetCapiCustomDataSchema = z
  .object({
    currency: z.string().length(3).optional(),
    ecommTotalValue: z.number().nonnegative().optional(),
    eventCategory: z.string().min(1).optional(),
    eventLabel: z.string().min(1).optional(),
    eventValue: z.number().optional(),
    itemIds: z.array(z.string().min(1)).optional(),
    items: z.array(microsoftUetCapiItemSchema).optional(),
    pageType: z.literal('purchase'),
    transactionId: z.string().min(1).optional(),
    value: z.number().nonnegative().optional()
  })
  .strict()

export const microsoftUetCapiPurchaseEventSchema = z
  .object({
    adStorageConsent: z.literal('G'),
    customData: microsoftUetCapiCustomDataSchema,
    eventId: z.string().min(1),
    eventName: z.literal('purchase'),
    eventSourceUrl: z.string().url().optional(),
    eventTime: z.number().int().positive(),
    eventType: z.literal('custom'),
    userData: microsoftUetCapiUserDataSchema
  })
  .strict()

export const microsoftUetCapiRequestSchema = z
  .object({
    continueOnValidationError: z.boolean(),
    data: z.array(microsoftUetCapiPurchaseEventSchema).min(1).max(1000),
    dataProvider: z.literal('utekos-headless')
  })
  .strict()

export type MicrosoftUetCapiPurchaseEvent = z.infer<
  typeof microsoftUetCapiPurchaseEventSchema
>

export type MicrosoftUetCapiRequest = z.infer<
  typeof microsoftUetCapiRequestSchema
>

export function mapCanonicalPurchaseToMicrosoftUet(
  event: CanonicalPurchase
): MicrosoftUetCapiPurchaseEvent {
  if (event.consent.marketing !== 'granted') {
    throw new Error(
      'Microsoft UET CAPI purchase requires granted marketing consent'
    )
  }

  const eventTime = Math.floor(Date.parse(event.event_time) / 1000)

  if (!Number.isFinite(eventTime) || eventTime <= 0) {
    throw new Error(
      'Microsoft UET CAPI event_time must be a valid timestamp'
    )
  }

  const items = event.custom_data.items.map(item => ({
    id: cleanShopifyId(item.item_id) ?? item.item_id,
    name: item.item_name,
    price: item.final_unit_price ?? item.unit_price,
    quantity: item.quantity
  }))
  const itemIds = items.map(item => item.id)
  const value = event.custom_data.value
  const transactionId = event.custom_data.transaction_id

  return microsoftUetCapiPurchaseEventSchema.parse({
    adStorageConsent: 'G',
    customData: {
      currency: event.custom_data.currency,
      ecommTotalValue: value,
      eventCategory: 'ecommerce',
      eventLabel: transactionId,
      eventValue: value,
      itemIds,
      items,
      pageType: 'purchase',
      transactionId,
      value
    },
    eventId: event.event_id,
    eventName: 'purchase',
    ...(event.page_url ? { eventSourceUrl: event.page_url } : {}),
    eventTime,
    eventType: 'custom',
    userData: buildMicrosoftUetCapiUserData(event)
  })
}

export function buildMicrosoftUetCapiPurchaseRequest(
  event: CanonicalPurchase
): MicrosoftUetCapiRequest {
  return microsoftUetCapiRequestSchema.parse({
    continueOnValidationError: false,
    data: [mapCanonicalPurchaseToMicrosoftUet(event)],
    dataProvider: 'utekos-headless'
  })
}
