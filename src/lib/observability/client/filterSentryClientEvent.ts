import type { ErrorEvent } from '@sentry/nextjs'

import { isIgnorableClientError } from './isIgnorableClientError'

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
  event: ErrorEvent
): ErrorEvent | null {
  const exceptionValues = event.exception?.values ?? []
  const rootException = [...exceptionValues]
    .reverse()
    .find(value => value.mechanism?.parent_id === undefined)
  const message = rootException?.value ?? event.message ?? ''
  const frames = collectExceptionFrames(event)
  const source = frames.at(-1) ?? frames[0]
  const stack = frames.join('\n')

  return isIgnorableClientError({
    message,
    ...(source ? { source } : {}),
    ...(stack ? { stack } : {})
  })
    ? null
    : event
}
