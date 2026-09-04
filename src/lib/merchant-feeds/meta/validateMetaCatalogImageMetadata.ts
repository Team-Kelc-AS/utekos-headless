import { z } from 'zod'

import type { MetaCatalogImagePreference } from './metaCatalogImageTags'

const inputSchema = z.strictObject({
  fileName: z.string().trim().min(1),
  format: z.string().trim().min(1),
  height: z.number().int().positive(),
  preference: z.enum([
    'instagram',
    'feed_4_5',
    'full_screen_9_16',
    'stories_9_16',
    'reels_9_16'
  ] satisfies readonly MetaCatalogImagePreference[]),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().positive()
})

const MAX_IMAGE_SIZE_BYTES = 30 * 1024 * 1024

export function validateMetaCatalogImageMetadata(
  input: z.input<typeof inputSchema>
) {
  const parsed = inputSchema.parse(input)

  if (parsed.format !== 'png' && parsed.format !== 'jpeg') {
    throw new Error(
      `Meta catalog image ${parsed.fileName} must be PNG or JPEG; received ${parsed.format}`
    )
  }

  if (parsed.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Meta catalog image ${parsed.fileName} must not exceed 30 MB`
    )
  }

  const isExact4x5 = parsed.width * 5 === parsed.height * 4
  const isExact9x16 = parsed.width * 16 === parsed.height * 9
  const isSquare = parsed.width === parsed.height
  let aspectRatio: '1:1' | '4:5' | '9:16'
  let minimumWidth: number
  let minimumHeight: number

  if (parsed.preference === 'feed_4_5') {
    if (!isExact4x5) {
      throw new Error(
        `Meta catalog image ${parsed.fileName} must be exact 4:5; received ${parsed.width} x ${parsed.height}`
      )
    }

    aspectRatio = '4:5'
    minimumWidth = 1080
    minimumHeight = 1350
  } else if (parsed.preference === 'instagram') {
    if (!isSquare && !isExact4x5) {
      throw new Error(
        `Meta Instagram catalog image ${parsed.fileName} must be exact 1:1 or 4:5; received ${parsed.width} x ${parsed.height}`
      )
    }

    aspectRatio = isSquare ? '1:1' : '4:5'
    minimumWidth = 1080
    minimumHeight = isSquare ? 1080 : 1350
  } else {
    if (!isExact9x16) {
      throw new Error(
        `Meta catalog image ${parsed.fileName} must be exact 9:16; received ${parsed.width} x ${parsed.height}`
      )
    }

    aspectRatio = '9:16'
    minimumWidth = 1080
    minimumHeight = 1920
  }

  if (
    parsed.width < minimumWidth ||
    parsed.height < minimumHeight
  ) {
    throw new Error(
      `Meta catalog image ${parsed.fileName} must be at least ${minimumWidth} x ${minimumHeight}; received ${parsed.width} x ${parsed.height}`
    )
  }

  return {
    ...parsed,
    aspectRatio
  }
}
