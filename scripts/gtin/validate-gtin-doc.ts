import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { isValidGtin } from '../../src/lib/gtin/isValidGtin'
import {
  productStructuredImageManifest,
  type ProductStructuredImage
} from '../../src/lib/products/structured-data/productStructuredImageManifest'

const PRODUCT_IMAGE_PATH = path.join(process.cwd(), 'public/gtin/product-images')

type ImageDimensions = {
  width: number
  height: number
  format: 'png' | 'webp'
}

function readPngDimensions(buffer: Buffer): ImageDimensions | null {
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ])

  if (
    buffer.length < 24 ||
    !buffer.subarray(0, pngSignature.length).equals(pngSignature) ||
    buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    return null
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    format: 'png'
  }
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (
    buffer.length < 30 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null
  }

  const chunkType = buffer.toString('ascii', 12, 16)

  if (chunkType === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
      format: 'webp'
    }
  }

  if (chunkType === 'VP8L' && buffer[20] === 0x2f) {
    const byte1 = buffer[21] ?? 0
    const byte2 = buffer[22] ?? 0
    const byte3 = buffer[23] ?? 0
    const byte4 = buffer[24] ?? 0

    return {
      width: 1 + byte1 + ((byte2 & 0x3f) << 8),
      height:
        1 + (byte2 >> 6) + (byte3 << 2) + ((byte4 & 0x0f) << 10),
      format: 'webp'
    }
  }

  if (
    chunkType === 'VP8 ' &&
    buffer[23] === 0x9d &&
    buffer[24] === 0x01 &&
    buffer[25] === 0x2a
  ) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
      format: 'webp'
    }
  }

  return null
}

function readImageDimensions(imagePath: string) {
  const buffer = fs.readFileSync(imagePath)

  return readPngDimensions(buffer) ?? readWebpDimensions(buffer)
}

function getImageFileName(image: ProductStructuredImage) {
  return path.basename(new URL(image.url).pathname)
}

function validateManifestImage(input: {
  gtin: string
  image: ProductStructuredImage
}) {
  const fileName = getImageFileName(input.image)
  const imagePath = path.join(PRODUCT_IMAGE_PATH, fileName)
  const errors: string[] = []

  if (!fs.existsSync(imagePath)) {
    return [`GTIN ${input.gtin} is missing local image ${imagePath}`]
  }

  const actual = readImageDimensions(imagePath)

  if (!actual) {
    return [`GTIN ${input.gtin} image ${fileName} is not a valid PNG or WebP`]
  }

  const expectedFormat = path.extname(fileName).slice(1)

  if (actual.format !== expectedFormat) {
    errors.push(
      `GTIN ${input.gtin} image ${fileName} content does not match its extension`
    )
  }

  if (
    actual.width !== input.image.width ||
    actual.height !== input.image.height
  ) {
    errors.push(
      `GTIN ${input.gtin} image ${fileName} is ${actual.width}x${actual.height}, expected ${input.image.width}x${input.image.height}`
    )
  }

  return errors
}

const manifestEntries = Object.entries(
  productStructuredImageManifest
)
const manifestFileNames = new Set(
  manifestEntries.flatMap(([, entry]) =>
    entry.images.map(getImageFileName)
  )
)
const directoryFileNames = fs
  .readdirSync(PRODUCT_IMAGE_PATH, { withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(fileName => /\.(?:png|webp)$/i.test(fileName))
  .sort((left, right) => left.localeCompare(right))

const errors = manifestEntries.flatMap(([gtin, entry]) => {
  const entryErrors = isValidGtin(gtin) ? [] : [
    `GTIN ${gtin} has an invalid check digit`
  ]

  return [
    ...entryErrors,
    ...entry.images.flatMap(image =>
      validateManifestImage({ gtin, image })
    )
  ]
})

for (const fileName of directoryFileNames) {
  if (!manifestFileNames.has(fileName)) {
    errors.push(`Image ${fileName} has no GTIN manifest entry`)
  }
}

const eligibleEntries = manifestEntries.filter(
  ([, entry]) => entry.structuredDataEligible
)
const coverage = (
  productStructuredImageAspectRatio: ProductStructuredImage['aspectRatio']
) =>
  eligibleEntries.filter(([, entry]) =>
    entry.images.some(
      image => image.aspectRatio === productStructuredImageAspectRatio
    )
  ).length

console.info(
  `[gtin] image coverage: 1:1 ${coverage('1:1')}/${eligibleEntries.length}, 4:3 ${coverage('4:3')}/${eligibleEntries.length}, 16:9 ${coverage('16:9')}/${eligibleEntries.length}`
)

if (
  coverage('4:3') < eligibleEntries.length ||
  coverage('16:9') < eligibleEntries.length
) {
  console.warn(
    '[gtin] coverage warning: missing 4:3/16:9 images are non-blocking for this release'
  )
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[gtin] error: ${error}`)
  }

  process.exit(1)
}

console.info(
  `[gtin] validated ${manifestEntries.length} GTIN entries, ${eligibleEntries.length} public variants and ${manifestFileNames.size} image files`
)
