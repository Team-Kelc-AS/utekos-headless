'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { z } from 'zod'
import { findMicrosoftUetAnonymousId } from './microsoftUetIdentity'

const microsoftUetIdSyncEventSchema = z.strictObject({
  event: z.literal('microsoft_uet_id_sync'),
  microsoft_vid: z.string().uuid(),
  page_view_event_id: z.string().uuid().optional(),
  page_view_id: z.string().uuid().optional()
})

export type MicrosoftUetIdSyncEvent = z.infer<
  typeof microsoftUetIdSyncEventSchema
>

type EmitMicrosoftUetIdSyncInput = {
  externalId: string
  pageViewEventId?: string
  pageViewId?: string
}

export function createMicrosoftUetIdSyncEmitter(
  push: (event: MicrosoftUetIdSyncEvent) => void
) {
  let emittedVid: string | undefined

  function emit(input: EmitMicrosoftUetIdSyncInput) {
    const microsoftVid = findMicrosoftUetAnonymousId({
      external_id: input.externalId
    })

    if (!microsoftVid || emittedVid === microsoftVid) {
      return false
    }

    const event = microsoftUetIdSyncEventSchema.parse({
      event: 'microsoft_uet_id_sync',
      microsoft_vid: microsoftVid,
      ...(input.pageViewEventId ?
        { page_view_event_id: input.pageViewEventId }
      : {}),
      ...(input.pageViewId ?
        { page_view_id: input.pageViewId }
      : {})
    })

    push(event)
    emittedVid = microsoftVid
    return true
  }

  return { emit }
}

export const browserMicrosoftUetIdSyncEmitter =
  createMicrosoftUetIdSyncEmitter(event => {
    sendGTMEvent(event)
  })
