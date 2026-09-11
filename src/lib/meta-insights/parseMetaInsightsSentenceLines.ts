import { z } from 'zod'

const lineSchema = z
  .object({
    content: z.string().optional(),
    children: z.array(z.string()).optional()
  })
  .passthrough()

const bodySchema = z
  .object({
    targetingsentencelines: z.array(lineSchema).optional()
  })
  .passthrough()

export function parseMetaInsightsSentenceLines(value: unknown) {
  const parsed = bodySchema.parse(value)
  return (parsed.targetingsentencelines ?? []).map(line => ({
    content: line.content ?? '',
    children: line.children ?? []
  }))
}
