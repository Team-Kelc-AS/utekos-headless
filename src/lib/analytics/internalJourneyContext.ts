import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { browserPageViewSession } from './pageViewSession'

const JOURNEY_STORAGE_KEY = 'utekos:analytics:journey:v1'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

type JourneyStorage = Pick<
  Storage,
  'getItem' | 'removeItem' | 'setItem'
>

type JourneyCompatibleEvent = {
  consent: ConsentSnapshot
  journey_id?: string | undefined
  page_view_id?: string | undefined
  previous_page_view_id?: string | undefined
}

type InternalJourneyFields = {
  journey_id?: string | undefined
  previous_page_view_id?: string | undefined
}

type InternalJourneyContextDependencies = {
  createId: () => string
  getPreviousPageViewId: (
    pageViewId: string | undefined
  ) => string | undefined
  getStorage: () => JourneyStorage | undefined
}

function omitInternalJourneyContext<
  E extends JourneyCompatibleEvent
>(event: E): E & InternalJourneyFields {
  const nextEvent: E & InternalJourneyFields = { ...event }

  delete nextEvent.journey_id
  delete nextEvent.previous_page_view_id

  return nextEvent
}

export function createInternalJourneyContextEnricher(
  dependencies: InternalJourneyContextDependencies
) {
  let inMemoryJourneyId: string | undefined

  return function enrichInternalJourneyContext<
    E extends JourneyCompatibleEvent
  >(event: E): E & InternalJourneyFields {
    const nextEvent = omitInternalJourneyContext(event)
    let storage: JourneyStorage | undefined

    try {
      storage = dependencies.getStorage()
    } catch {
      storage = undefined
    }

    if (event.consent.analytics !== 'granted') {
      inMemoryJourneyId = undefined

      try {
        storage?.removeItem(JOURNEY_STORAGE_KEY)
      } catch {
        // Storage access is best effort. Denied events remain unlinked.
      }

      return nextEvent
    }

    let journeyId = inMemoryJourneyId

    if (!journeyId) {
      try {
        const storedJourneyId = storage?.getItem(
          JOURNEY_STORAGE_KEY
        )

        if (
          storedJourneyId &&
          UUID_PATTERN.test(storedJourneyId)
        ) {
          journeyId = storedJourneyId
        }
      } catch {
        // Fall back to an in-memory, tab-scoped identifier.
      }
    }

    if (!journeyId) {
      journeyId = dependencies.createId()

      if (!UUID_PATTERN.test(journeyId)) {
        throw new Error('journey_id_factory_returned_invalid_uuid')
      }

      try {
        storage?.setItem(JOURNEY_STORAGE_KEY, journeyId)
      } catch {
        // The in-memory identifier still preserves this tab's journey.
      }
    }

    inMemoryJourneyId = journeyId

    const previousPageViewId =
      dependencies.getPreviousPageViewId(event.page_view_id)

    return {
      ...nextEvent,
      journey_id: journeyId,
      ...(previousPageViewId ?
        { previous_page_view_id: previousPageViewId }
      : {})
    }
  }
}

const enrichBrowserInternalJourneyContext =
  createInternalJourneyContextEnricher({
    createId: () => globalThis.crypto.randomUUID(),
    getPreviousPageViewId: pageViewId =>
      browserPageViewSession.get(pageViewId)
        ?.previousPageViewId,
    getStorage: () =>
      typeof window === 'undefined' ? undefined : window.sessionStorage
  })

export function enrichCanonicalBrowserJourneyContext<
  E extends JourneyCompatibleEvent
>(event: E): E {
  return enrichBrowserInternalJourneyContext(event)
}

export function stripInternalJourneyContext<
  E extends JourneyCompatibleEvent
>(event: E): E {
  return omitInternalJourneyContext(event)
}
