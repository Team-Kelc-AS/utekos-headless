import { z } from 'zod'
import { controlResultSchema } from './controlResult'
import { getCanonicalContext } from './getCanonicalContext'

export const controlErrorSchema = z.strictObject({
  error: z.enum([
    'AUTH_REQUIRED',
    'INVALID_INPUT',
    'EVENT_NOT_FOUND',
    'INVALID_CONTROL_OUTPUT'
  ])
})

export function createControlContextResponse(
  input: unknown,
  headers: HeadersInit,
  build: (input: unknown) => unknown = getCanonicalContext
) {
  try {
    return Response.json(
      controlResultSchema.parse(build(input)),
      { headers }
    )
  } catch (error) {
    const notFound =
      error instanceof Error &&
      error.message === 'EVENT_NOT_FOUND'
    return Response.json(
      controlErrorSchema.parse({
        error:
          notFound ? 'EVENT_NOT_FOUND' : 'INVALID_CONTROL_OUTPUT'
      }),
      { status: notFound ? 404 : 500, headers }
    )
  }
}
