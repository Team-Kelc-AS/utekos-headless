import type { ErrorEvent } from '@sentry/nextjs'

import { isIgnorableClientError } from './isIgnorableClientError'
import type { ClientErrorDetails } from './isIgnorableClientError'

function collectExceptionFrames(event: ErrorEvent): string[] {
  const filenames: string[] = []

  for (const exception of event.exception?.values ?? []) {
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (typeof frame.filename === 'string') {
        filenames.push(frame.filename)
      }
      if (typeof frame.abs_path === 'string') {
        filenames.push(frame.abs_path)
      }
    }
  }

  return filenames
}

export function filterSentryClientEvent(
  event: ErrorEvent,
  additionalFilter?: (details: ClientErrorDetails) => boolean
): ErrorEvent | null {
  const exceptionValues = event.exception?.values ?? []
  const rootException = [...exceptionValues]
    .reverse()
    .find(value => value.mechanism?.parent_id === undefined)
  const message = rootException?.value ?? event.message ?? ''
  const frames = collectExceptionFrames(event)
  const source = frames.at(-1) ?? frames[0]
  const stack = frames.join('\n')

  const details = {
    message,
    ...(source ? { source } : {}),
    ...(stack ? { stack } : {})
  }

  return (
      isIgnorableClientError(details) ||
        additionalFilter?.(details) === true
    ) ?
      null
    : event
}
