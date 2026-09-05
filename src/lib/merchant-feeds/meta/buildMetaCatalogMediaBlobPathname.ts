import { basename, extname } from 'node:path'

import { z } from 'zod'

const inputSchema = z.strictObject({
  aspectRatio: z.enum(['1:1', '4:5', '9:16', 'original']),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  fileName: z.string().trim().min(1),
  format: z.enum(['jpeg', 'png']),
  productHandle: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

export function buildMetaCatalogMediaBlobPathname(
  input: z.input<typeof inputSchema>
) {
  const parsed = inputSchema.parse(input)
  const fileStem = basename(
    parsed.fileName,
    extname(parsed.fileName)
  )
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  if (!fileStem) {
    throw new Error(
      `Meta catalog media file name cannot produce a safe pathname: ${parsed.fileName}`
    )
  }

  const extension = parsed.format === 'jpeg' ? 'jpg' : 'png'
  const ratioDirectory = parsed.aspectRatio.replace(':', 'x')

  return `meta/catalog/v26/${parsed.productHandle}/${ratioDirectory}/${fileStem}-${parsed.contentHash.slice(0, 12)}.${extension}`
}
