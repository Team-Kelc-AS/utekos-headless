import { z } from 'zod'
import type { CanonicalPageView } from '../pageViewEvent'
import {
  buildMicrosoftUetCapiUserData,
  microsoftUetCapiUserDataSchema
} from './microsoftUetCapiUserData'

export const microsoftUetCapiPageViewEventSchema = z
  .strictObject({
    adStorageConsent: z.literal('G'),
    eventId: z.string().uuid(),
    eventName: z.literal('page_view'),
    eventSourceUrl: z.string().url(),
    eventTime: z.number().int().positive(),
    eventType: z.literal('pageLoad'),
    pageLoadId: z.string().uuid(),
    pageTitle: z.string().min(1).optional(),
    referrerUrl: z.string().url().optional(),
    userData: microsoftUetCapiUserDataSchema
  })

export const microsoftUetCapiPageViewRequestSchema = z
  .strictObject({
    continueOnValidationError: z.boolean(),
    data: z
      .array(microsoftUetCapiPageViewEventSchema)
      .min(1)
      .max(1000),
    dataProvider: z.literal('utekos-headless')
  })

export type MicrosoftUetCapiPageViewEvent = z.infer<
  typeof microsoftUetCapiPageViewEventSchema
>

export type MicrosoftUetCapiPageViewRequest = z.infer<
  typeof microsoftUetCapiPageViewRequestSchema
>

export function mapCanonicalPageViewToMicrosoftUet(
  event: CanonicalPageView
): MicrosoftUetCapiPageViewEvent {
  if (event.consent.marketing !== 'granted') {
    throw new Error(
      'Microsoft UET CAPI page_view requires granted marketing consent'
    )
  }

  const eventTime = Math.floor(Date.parse(event.event_time) / 1000)

  if (!Number.isFinite(eventTime) || eventTime <= 0) {
    throw new Error(
      'Microsoft UET CAPI event_time must be a valid timestamp'
    )
  }

  return microsoftUetCapiPageViewEventSchema.parse({
    adStorageConsent: 'G',
    eventId: event.event_id,
    eventName: 'page_view',
    eventSourceUrl: event.page_url,
    eventTime,
    eventType: 'pageLoad',
    pageLoadId: event.page_view_id,
    pageTitle: event.page_title,
    ...(event.referrer_url ?
      { referrerUrl: event.referrer_url }
    : {}),
    userData: buildMicrosoftUetCapiUserData(event)
  })
}

export function buildMicrosoftUetCapiPageViewRequest(
  event: CanonicalPageView
): MicrosoftUetCapiPageViewRequest {
  return microsoftUetCapiPageViewRequestSchema.parse({
    continueOnValidationError: false,
    data: [mapCanonicalPageViewToMicrosoftUet(event)],
    dataProvider: 'utekos-headless'
  })
}
