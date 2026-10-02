import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import { metric } from '@vercel/functions'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

export type MetaDispatchReceipt<EventName extends string> = {
  eventId: string
  eventName: EventName
  provider: 'meta'
  result: MetaSendResult
}

export function createCanonicalMetaDispatch<
  E extends { event_id: string; event_name: EventName },
  EventName extends string
>(input: {
  eventName: EventName
  mapEvent: (event: E) => ServerEvent
}) {
  type Dependencies = {
    mapEvent: (event: E) => ServerEvent
    readConfig: () => MetaConversionsApiConfig
    sendEvent: (
      event: ServerEvent,
      config: MetaConversionsApiConfig
    ) => Promise<MetaSendResult>
  }

  const defaultDependencies: Dependencies = {
    mapEvent: input.mapEvent,
    readConfig: readMetaConversionsApiConfig,
    sendEvent: sendMetaServerEvent
  }

  return async function dispatch(
    event: E,
    dependencies: Dependencies = defaultDependencies
  ): Promise<MetaDispatchReceipt<EventName>> {
    const metaEvent = dependencies.mapEvent(event)
    const config = dependencies.readConfig()
    const startedAt = performance.now()

    try {
      const result = await dependencies.sendEvent(metaEvent, config)
    
      try {
        metric(
          'meta.capi.dispatch.duration_ms',
          performance.now() - startedAt,
          {
            event: input.eventName,
            outcome: 'success'
          }
        )
      } catch {
        // Metrics must not affect Meta dispatch.
      }

      try {
        metric('meta.capi.dispatch.count', 1, {
          event: input.eventName,
          outcome: 'success'
        })
      } catch (error) {
        // Temporary: diagnose empty Vercel Custom Metrics via Runtime Logs.
        console.warn(
          'metric emission failed',
          error instanceof Error ? error.name : typeof error
        )
      }

      return {
        eventId: event.event_id,
        eventName: input.eventName,
        provider: 'meta',
        result
      }
    } catch (error) {
      try {
        metric(
          'meta.capi.dispatch.duration_ms',
          performance.now() - startedAt,
          {
            event: input.eventName,
            outcome: 'error'
          }
        )
      } catch {
        // Metrics must not affect Meta dispatch.
      }

      try {
        metric('meta.capi.dispatch.count', 1, {
          event: input.eventName,
          outcome: 'error'
        })
      } catch {
        // Metrics must not affect Meta dispatch.
      }

      throw error
    }
  }
}