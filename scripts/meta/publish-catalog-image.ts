import { createHash } from 'node:crypto'
import { basename, resolve } from 'node:path'
import { readFile, stat } from 'node:fs/promises'

import sharp from 'sharp'
import { z } from 'zod'

import { buildMetaCatalogMediaBlobPathname } from '../../src/lib/merchant-feeds/meta/buildMetaCatalogMediaBlobPathname'
import { publishMetaCatalogImage } from '../../src/lib/merchant-feeds/meta/publishMetaCatalogImage'
import { validateMetaCatalogImageMetadata } from '../../src/lib/merchant-feeds/meta/validateMetaCatalogImageMetadata'

const cliInputSchema = z.strictObject({
  apply: z.boolean(),
  file: z.string().trim().min(1),
  preference: z.enum([
    'catalog_primary',
    'instagram',
    'feed_4_5',
    'full_screen_9_16',
    'stories_9_16',
    'reels_9_16'
  ]),
  productHandle: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

const publicReadbackSchema = z.object({
  body: z.instanceof(ArrayBuffer),
  contentType: z.string().min(1),
  status: z.number().int().min(200).max(299)
})

async function main() {
  const values = process.argv.slice(2)
  const args = Object.fromEntries(
    values
      .filter(
        value => value.startsWith('--') && value.includes('=')
      )
      .map(value => {
        const separatorIndex = value.indexOf('=')

        return [
          value.slice(2, separatorIndex),
          value.slice(separatorIndex + 1)
        ]
      })
  )
  const input = cliInputSchema.parse({
    apply: values.includes('--apply'),
    file: args.file,
    preference: args.preference,
    productHandle: args['product-handle']
  })
  const filePath = resolve(input.file)
  const [body, fileStat, metadata] = await Promise.all([
    readFile(filePath),
    stat(filePath),
    sharp(filePath).metadata()
  ])
  const width = metadata.autoOrient?.width ?? metadata.width
  const height = metadata.autoOrient?.height ?? metadata.height

  if (
    !fileStat.isFile() ||
    !metadata.format ||
    !width ||
    !height
  ) {
    throw new Error(
      `Unable to read complete image metadata from ${filePath}`
    )
  }

  const validation = validateMetaCatalogImageMetadata({
    fileName: filePath,
    format: metadata.format,
    height,
    preference: input.preference,
    sizeBytes: fileStat.size,
    width
  })
  const format = z.enum(['jpeg', 'png']).parse(validation.format)
  const contentHash = createHash('sha256')
    .update(body)
    .digest('hex')
  const pathname = buildMetaCatalogMediaBlobPathname({
    aspectRatio: validation.aspectRatio,
    contentHash,
    fileName: basename(filePath),
    format,
    productHandle: input.productHandle
  })
  const plan = {
    action: input.apply ? 'publish' : 'plan',
    contentHash,
    contentType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    height,
    pathname,
    preference: input.preference,
    sizeBytes: fileStat.size,
    width
  } as const

  if (!input.apply) {
    console.log(JSON.stringify(plan, null, 2))
    return
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()

  if (!token)
    throw new Error('BLOB_READ_WRITE_TOKEN is required')

  const blob = await publishMetaCatalogImage({
    body,
    contentType: plan.contentType,
    pathname,
    token
  })
  const response = await fetch(blob.url, { cache: 'no-store' })
  const readback = publicReadbackSchema.parse({
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type'),
    status: response.status
  })
  const readbackHash = createHash('sha256')
    .update(Buffer.from(readback.body))
    .digest('hex')

  if (
    readbackHash !== contentHash ||
    readback.contentType !== plan.contentType
  ) {
    throw new Error(
      `Vercel Blob public readback failed for ${pathname}`
    )
  }

  console.log(
    JSON.stringify(
      {
        ...plan,
        action: blob.reused ? 'verified-existing' : 'published',
        etag: blob.etag,
        publicReadbackHash: readbackHash,
        url: blob.url
      },
      null,
      2
    )
  )
}

main().catch(error => {
  console.error(
    error instanceof Error ?
      error.message
    : 'Unknown publication error'
  )
  process.exitCode = 1
})
