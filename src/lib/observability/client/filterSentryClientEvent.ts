import type { ErrorEvent } from '@sentry/nextjs'

import { isIgnorableClientError } from './isIgnorableClientError'

export function filterSentryClientEvent(
  event: ErrorEvent
): ErrorEvent | null {
  const exceptionValues = event.exception?.values ?? []
  const rootException = [...exceptionValues]
    .reverse()
    .find(value => value.mechanism?.parent_id === undefined)
  const message = rootException?.value ?? event.message ?? ''

  return isIgnorableClientError({ message }) ? null : event
}
