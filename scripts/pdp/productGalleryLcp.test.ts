import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(
  relativePath: string
): Promise<string> {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test('PDP renders ProductGallery directly from the server component', async () => {
  const source = await readSource(
    'src/app/produkter/[handle]/components/ProductPageView.tsx'
  )

  assert.match(
    source,
    /import\s+\{\s*ProductGallery\s*\}\s+from\s+['"]@\/components\/jsx\/ProductGallery['"]/,
    'ProductPageView must import ProductGallery directly'
  )

  assert.doesNotMatch(
    source,
    /ProductGalleryClient/,
    'ProductPageView must not retain the redundant ProductGalleryClient wrapper'
  )

  assert.match(
    source,
    /<ProductGallery[\s\S]*?title=\{title\}[\s\S]*?\/>/,
    'ProductPageView must render ProductGallery directly'
  )
})

test('redundant ProductGalleryClient wrapper no longer exists', () => {
  const wrapperPath = join(
    repoRoot,
    'src/app/produkter/[handle]/components/ProductGalleryClient.tsx'
  )

  assert.equal(
    existsSync(wrapperPath),
    false,
    'ProductGalleryClient.tsx must be deleted'
  )
})

test('desktop gallery frame remains a Server Component', async () => {
  const frameSource = await readSource(
    'src/app/produkter/[handle]/components/ProductDesktopGalleryFrame.tsx'
  )
  const pageSource = await readSource(
    'src/app/produkter/[handle]/components/ProductPageView.tsx'
  )

  assert.doesNotMatch(
    frameSource,
    /^\s*['"]use client['"]/m,
    'ProductDesktopGalleryFrame must not introduce a Client Component boundary'
  )

  assert.match(
    frameSource,
    /ratio=\{\s*9 \/ 10\s*\}/,
    'Desktop gallery image must use aspect-ratio 9:10'
  )

  assert.match(
    frameSource,
    /rounded-2xl/,
    'Desktop gallery frame must use a 16px corner radius'
  )

  assert.match(
    frameSource,
    /rounded-lg/,
    'Desktop gallery image must use an 8px corner radius'
  )

  assert.match(
    pageSource,
    /framed/,
    'ProductPageView must render the framed desktop gallery'
  )

  assert.doesNotMatch(
    pageSource,
    /ProductGalleryGrid/,
    'ProductPageView must not render the desktop image grid'
  )
})

test('interactive carousel owns the Client Component boundary', async () => {
  const source = await readSource(
    'src/components/jsx/ProductGallery.tsx'
  )
  const imageSource = await readSource(
    'src/components/jsx/ProductGallerySlideImage.tsx'
  )

  assert.match(
    source,
    /^\s*['"]use client['"]/m,
    'Interactive ProductGallery must remain a Client Component'
  )

  assert.doesNotMatch(
    source,
    /from\s+['"]next\/dynamic['"]/,
    'ProductGallery must not use client-only dynamic rendering'
  )

  assert.doesNotMatch(
    source,
    /ssr\s*:\s*false/,
    'ProductGallery must remain server-prerenderable'
  )

  assert.match(
    imageSource,
    /quality=\{\s*95\s*\}/,
    'ProductGallery images must use quality 95'
  )

  assert.match(
    imageSource,
    /index === 0 \? 'high' : 'auto'/,
    'First carousel image must retain high fetch priority'
  )

  assert.doesNotMatch(
    imageSource,
    /\bloading\s*=/,
    'Responsive carousel images must use native default loading behavior'
  )
})

test('TechDown mobile gallery uses 2:3 intrinsic next/image slides', async () => {
  const pageSource = await readSource(
    'src/app/produkter/[handle]/components/ProductPageView.tsx'
  )
  const imageSource = await readSource(
    'src/components/jsx/ProductGallerySlideImage.tsx'
  )
  const gallerySource = await readSource(
    'src/app/produkter/[handle]/utils/gallery-images/techdown/productGalleryImages.ts'
  )

  assert.match(
    pageSource,
    /isTechDownProduct \? 2 \/ 3/,
    'TechDown mobile gallery frame must use aspect-ratio 2:3'
  )

  assert.match(
    pageSource,
    /imageLayout=\{\s*isTechDownProduct \?\s*'intrinsic'\s*:\s*\(?\s*'cover-fill'\s*\)?\s*\}/,
    'TechDown mobile gallery must use intrinsic next/image sizing'
  )

  assert.match(
    imageSource,
    /width=\{image\.width\}/,
    'Intrinsic slides must set next/image width'
  )

  assert.match(
    imageSource,
    /height=\{image\.height\}/,
    'Intrinsic slides must set next/image height'
  )

  assert.match(
    imageSource,
    /object-contain object-center/,
    'Intrinsic slides must not crop with object-cover'
  )

  assert.match(
    gallerySource,
    /const TECHDOWN_MOBILE_IMAGE_WIDTH = 1000/,
    'TechDown mobile next/image width must be 1000'
  )

  assert.match(
    gallerySource,
    /const TECHDOWN_MOBILE_IMAGE_HEIGHT = 1500/,
    'TechDown mobile next/image height must be 1500'
  )

  assert.match(
    gallerySource,
    /TechDown-1000x1500-1\.jpg/,
    'TechDown mobile gallery must start with TechDown-1000x1500-1'
  )

  assert.match(
    gallerySource,
    /TechDown-1000x1500-Zipper\.jpg/,
    'TechDown mobile gallery must end with the zipper still'
  )

  assert.match(
    gallerySource,
    /TechDown-1800x2000\.webp/,
    'TechDown desktop gallery must use TechDown-1800x2000'
  )

  assert.match(
    gallerySource,
    /TechDown2-1800x2000\.webp/,
    'TechDown desktop gallery must use TechDown2-1800x2000'
  )

  const mobileImageImports =
    gallerySource.match(
      /TechDown-1000x1500-(?:[1-5]|Zipper)\.jpg/g
    ) ?? []

  assert.equal(
    mobileImageImports.length,
    6,
    'TechDown mobile gallery must contain exactly the six requested stills'
  )
})
