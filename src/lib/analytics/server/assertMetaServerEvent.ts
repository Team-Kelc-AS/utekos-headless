import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import { z } from 'zod'

const metaServerEventSchema = z
  .object({
    action_source: z.string().trim().min(1),
    event_id: z.string().trim().min(1),
    event_name: z.string().trim().min(1),
    event_time: z.number().int().positive(),
    user_data: z.object({}).passthrough()
  })
  .passthrough()

const metaWebsiteServerEventSchema = metaServerEventSchema.extend({
  action_source: z.literal('website'),
  event_source_url: z
    .url()
    .refine(value => {
      const protocol = new URL(value).protocol
      return protocol === 'http:' || protocol === 'https:'
    }),
  user_data: z
    .object({
      client_user_agent: z.string().trim().min(1)
    })
    .passthrough()
})

export function assertMetaServerEvent(event: ServerEvent): void {
  const normalized = event.normalize()
  const baseResult = metaServerEventSchema.safeParse(normalized)

  if (!baseResult.success) {
    const invalidFields = [
      ...new Set(
        baseResult.error.issues.map(issue =>
          issue.path.length > 0 ? issue.path.join('.') : 'event'
        )
      )
    ].join(', ')

    throw new Error(
      `Meta server event failed required-parameter validation: ${invalidFields}`
    )
  }

  if (baseResult.data.action_source !== 'website') return

  const websiteResult =
    metaWebsiteServerEventSchema.safeParse(normalized)

  if (websiteResult.success) return

  const invalidFields = [
    ...new Set(
      websiteResult.error.issues.map(issue =>
        issue.path.length > 0 ? issue.path.join('.') : 'event'
      )
    )
  ].join(', ')

  throw new Error(
    `Meta website event failed required-parameter validation: ${invalidFields}`
  )
}
