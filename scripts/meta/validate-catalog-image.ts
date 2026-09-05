import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'

import sharp from 'sharp'
import { z } from 'zod'

import { validateMetaCatalogImageMetadata } from '../../src/lib/merchant-feeds/meta/validateMetaCatalogImageMetadata'

const cliInputSchema = z.strictObject({
  file: z.string().trim().min(1),
  preference: z.enum([
    'catalog_primary',
    'instagram',
    'feed_4_5',
    'full_screen_9_16',
    'stories_9_16',
    'reels_9_16'
  ])
})

async function main() {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter(value => value.startsWith('--') && value.includes('='))
      .map(value => {
        const separatorIndex = value.indexOf('=')

        return [
          value.slice(2, separatorIndex),
          value.slice(separatorIndex + 1)
        ]
      })
  )
  const input = cliInputSchema.parse({
    file: args.file,
    preference: args.preference
  })
  const filePath = resolve(input.file)
  const fileStat = await stat(filePath)

  if (!fileStat.isFile()) {
    throw new Error(`Meta catalog image is not a file: ${filePath}`)
  }

  const metadata = await sharp(filePath).metadata()
  const width = metadata.autoOrient?.width ?? metadata.width
  const height = metadata.autoOrient?.height ?? metadata.height

  if (!metadata.format || !width || !height) {
    throw new Error(
      `Unable to read complete image metadata from ${filePath}`
    )
  }

  const report = validateMetaCatalogImageMetadata({
    fileName: filePath,
    format: metadata.format,
    height,
    preference: input.preference,
    sizeBytes: fileStat.size,
    width
  })

  console.log(JSON.stringify({ status: 'valid', ...report }, null, 2))
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.message : 'Unknown image validation error'
  )
  process.exitCode = 1
})
