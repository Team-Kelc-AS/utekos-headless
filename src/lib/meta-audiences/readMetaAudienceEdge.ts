import { z } from 'zod'
import { readMetaAudienceGraph } from './readMetaAudienceGraph'

export async function readMetaAudienceEdge<T>(
  path: string,
  params: Record<string, string>,
  itemSchema: z.ZodType<T>,
  accessToken: string
): Promise<T[]> {
  const items: T[] = [],
    cursors = new Set<string>()
  const schema = z.object({
    data: z.array(itemSchema),
    paging: z
      .object({
        next: z.string().optional(),
        cursors: z
          .object({ after: z.string().optional() })
          .optional()
      })
      .optional()
  })
  let after: string | undefined
  do {
    const page = await readMetaAudienceGraph(
      path,
      { limit: '100', ...params, ...(after ? { after } : {}) },
      schema,
      accessToken
    )
    items.push(...page.data)
    after =
      page.paging?.next ? page.paging.cursors?.after : undefined
    if (page.paging?.next && !after)
      throw new Error('Incomplete Graph pagination')
    if (after && cursors.has(after))
      throw new Error('Repeated Graph cursor')
    if (after) cursors.add(after)
    if (cursors.size >= 100)
      throw new Error('Graph pagination budget exceeded')
  } while (after)
  return items
}
