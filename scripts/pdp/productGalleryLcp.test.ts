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
    /ratio=\{\s*7 \/ 9\s*\}/,
    'Desktop gallery image must use aspect-ratio 7:9'
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
    /9 \/ 16/,
    'Mobile gallery must not keep the previous 9:16 frame'
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

test('TechDown mobile gallery uses 910:1450 product stills with overlays', async () => {
  const pageSource = await readSource(
    'src/app/produkter/[handle]/components/ProductPageView.tsx'
  )
  const frameSource = await readSource(
    'src/app/produkter/[handle]/components/TechDownMobileGalleryFrame.tsx'
  )
  const gallerySource = await readSource(
    'src/app/produkter/[handle]/utils/gallery-images/techdown/productGalleryImages.ts'
  )

  assert.match(
    pageSource,
    /const galleryAspectRatio = 2 \/ 3/,
    'Other mobile galleries must keep aspect-ratio 2:3'
  )

  assert.match(
    pageSource,
    /TechDownMobileGalleryFrame/,
    'TechDown mobile gallery must use TechDownMobileGalleryFrame'
  )

  assert.match(
    pageSource,
    /isTechDownProduct \?\s*`w-full \$\{galleryDesktopBleedClassName\}`/,
    'TechDown mobile gallery must stay inset inside the page container'
  )

  assert.doesNotMatch(
    pageSource,
    /isTechDownProduct \?\s*`relative left-1\/2 w-screen/,
    'TechDown mobile gallery must not bleed to full viewport width'
  )

  assert.match(
    frameSource,
    /ratio=\{\s*910 \/ 1450\s*\}/,
    'TechDown mobile gallery frame must use aspect-ratio 910:1450'
  )

  assert.match(
    frameSource,
    /bg-primary/,
    'TechDown mobile gallery frame must use the primary mat behind the stills'
  )

  assert.match(
    frameSource,
    /-mx-4/,
    'TechDown mobile gallery frame must absorb the page container gutter'
  )

  assert.match(
    frameSource,
    /px-5/,
    'TechDown mobile gallery frame must inset the stills from the edges'
  )

  assert.match(
    frameSource,
    /bottom-\[calc\(118\/1450\*100%\+1rem\)\]/,
    'Juster Form Nyt must sit inside the orange image frame'
  )

  assert.match(
    frameSource,
    /h-\[calc\(118\/1450\*100%\)\]/,
    'Wordmark and wishlist must share the footer band under the frame'
  )

  assert.match(
    frameSource,
    /TechDownGalleryJusterFormNyt/,
    'TechDown mobile gallery must overlay Juster Form Nyt'
  )

  assert.match(
    frameSource,
    /UtekosWordmark/,
    'TechDown mobile gallery must place the wordmark under the frame'
  )

  assert.match(
    gallerySource,
    /TechDown-ProductCard-Cover_1\.webp/,
    'TechDown mobile gallery must start with TechDown-ProductCard-Cover_1'
  )

  assert.match(
    gallerySource,
    /TechDown-ProductCard--Zipper\.webp/,
    'TechDown mobile gallery must include the zipper still'
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

  const mobileStills = [
    'TechDown-ProductCard-Cover_1.webp',
    'TechDown-ProductCard-2.webp',
    'TechDown-ProductCard-3.webp',
    'TechDown-ProductCard-5.webp',
    'TechDown-ProductCard-Front.webp',
    'TechDown-ProductCard-Inner.webp',
    'TechDown-ProductCard--Zipper.webp'
  ] as const

  const mobileBody = extractExportBody(
    gallerySource,
    'TECHDOWN_MOBILE_GALLERY_IMAGES'
  )

  for (const fileName of mobileStills) {
    assert.match(
      gallerySource,
      new RegExp(fileName.replace('.', '\\.')),
      `TechDown mobile gallery must import ${fileName}`
    )
  }

  assert.doesNotMatch(
    mobileBody,
    /TechDown-1000x1500|TechDownPocket|TechDownZipper\.webp|TechDown_ProductImage_1440x1800/,
    'TechDown mobile gallery must not keep the previous stills'
  )
})

function extractExportBody(
  source: string,
  exportName: string
): string {
  const start = source.indexOf(`export const ${exportName}`)
  assert.ok(start >= 0, `${exportName} must exist`)
  const nextExport = source.indexOf('export const', start + 1)
  return nextExport === -1 ?
      source.slice(start)
    : source.slice(start, nextExport)
}

test('Mikrofiber gallery replaces stills and splits 1-10 / 11-20 by viewport', async () => {
  const pageSource = await readSource(
    'src/app/produkter/[handle]/components/ProductPageView.tsx'
  )
  const gallerySource = await readSource(
    'src/app/produkter/[handle]/utils/gallery-images/mikrofiber/mikrofiberProductGalleryImages.ts'
  )
  const mobileBody = extractExportBody(
    gallerySource,
    'MICROFIBER_MOBILE_GALLERY_IMAGES'
  )
  const desktopBody = extractExportBody(
    gallerySource,
    'MICROFIBER_PRODUCT_GALLERY_IMAGES'
  )

  assert.match(
    pageSource,
    /productData\.handle === 'utekos-mikrofiber' \?/,
    'Mikrofiber must use a dedicated mobile gallery array'
  )

  assert.match(
    pageSource,
    /MICROFIBER_MOBILE_GALLERY_IMAGES/,
    'Mikrofiber mobile carousel must use MICROFIBER_MOBILE_GALLERY_IMAGES'
  )

  assert.match(
    pageSource,
    /className='hidden md:block'/,
    'Desktop gallery must stay hidden below the md iPad breakpoint'
  )

  assert.match(
    pageSource,
    /className='md:hidden'/,
    'Mobile gallery must stay hidden from the md iPad breakpoint and up'
  )

  assert.match(
    mobileBody,
    /mikrofiberMobileStill11,/,
    'Mikrofiber mobile gallery must start with 11.webp'
  )

  assert.match(
    desktopBody,
    /mikrofiberDesktopStill1,/,
    'Mikrofiber desktop gallery must start with 1.webp'
  )

  assert.doesNotMatch(
    gallerySource,
    /cdn\.shopify\.com|Mikrofiber-1000x1500/,
    'Mikrofiber galleries must not keep the previous Shopify or 1000x1500 stills'
  )

  for (const index of [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
    assert.match(
      gallerySource,
      new RegExp(`mikrofiber/${index}\\.webp`),
      `Mikrofiber gallery must import ${index}.webp`
    )
    assert.match(
      mobileBody,
      new RegExp(`mikrofiberMobileStill${index},`),
      `Mikrofiber mobile gallery must include ${index}.webp`
    )
    assert.doesNotMatch(
      desktopBody,
      new RegExp(`mikrofiberMobileStill${index},`),
      `Mikrofiber desktop gallery must not include ${index}.webp`
    )
  }

  for (const index of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    assert.match(
      gallerySource,
      new RegExp(`mikrofiber/${index}\\.webp`),
      `Mikrofiber gallery must import ${index}.webp`
    )
    assert.match(
      desktopBody,
      new RegExp(`mikrofiberDesktopStill${index},`),
      `Mikrofiber desktop gallery must include ${index}.webp`
    )
    assert.doesNotMatch(
      mobileBody,
      new RegExp(`mikrofiberDesktopStill${index},`),
      `Mikrofiber mobile gallery must not include ${index}.webp`
    )
  }
})

test('Comfyrobe gallery replaces product stills and splits desktop / mobile by viewport', async () => {
  const pageSource = await readSource(
    'src/app/produkter/[handle]/components/ProductPageView.tsx'
  )
  const gallerySource = await readSource(
    'src/app/produkter/[handle]/utils/gallery-images/comfyrobeProductGalleryImages.ts'
  )
  const mobileBody = extractExportBody(
    gallerySource,
    'COMFYROBE_MOBILE_GALLERY_IMAGES'
  )
  const desktopBody = extractExportBody(
    gallerySource,
    'COMFYROBE_PRODUCT_GALLERY_IMAGES'
  )

  assert.match(
    pageSource,
    /productData\.handle === 'comfyrobe' \?/,
    'Comfyrobe must use a dedicated mobile gallery array'
  )

  assert.match(
    pageSource,
    /COMFYROBE_MOBILE_GALLERY_IMAGES/,
    'Comfyrobe mobile carousel must use COMFYROBE_MOBILE_GALLERY_IMAGES'
  )

  assert.doesNotMatch(
    pageSource,
    /galleryImages\.slice\(3\)/,
    'Comfyrobe must not leak desktop stills into the mobile carousel'
  )

  assert.match(
    mobileBody,
    /comfyrobeMobile001,/,
    'Comfyrobe mobile gallery must start with Comfyrobe-Mobile-001.webp'
  )

  assert.match(
    desktopBody,
    /comfyrobeDesktop001,/,
    'Comfyrobe desktop gallery must start with Comfyrobe-001.webp'
  )

  assert.doesNotMatch(
    gallerySource,
    /cdn\.shopify\.com/,
    'Comfyrobe galleries must not keep the previous Shopify CDN stills'
  )

  assert.doesNotMatch(
    gallerySource,
    /comfy-mann-400-650|comfy-916|comfy-bak-916/,
    'Comfyrobe mobile gallery must not keep the previous local stills'
  )

  const desktopStills = [
    ['Comfyrobe-001.webp', 'comfyrobeDesktop001'],
    ['Comfyrobe-002.webp', 'comfyrobeDesktop002'],
    ['Comfyrobe-0003.webp', 'comfyrobeDesktop0003'],
    ['Comfyrobe-004.webp', 'comfyrobeDesktop004']
  ] as const

  for (const [fileName, binding] of desktopStills) {
    assert.match(
      gallerySource,
      new RegExp(`comfyrobe/${fileName.replace('.', '\\.')}`),
      `Comfyrobe gallery must import ${fileName}`
    )
    assert.match(
      desktopBody,
      new RegExp(`${binding},`),
      `Comfyrobe desktop gallery must include ${fileName}`
    )
    assert.doesNotMatch(
      mobileBody,
      new RegExp(`${binding},`),
      `Comfyrobe mobile gallery must not include ${fileName}`
    )
  }

  const mobileStills = [
    ['Comfyrobe-Mobile-001.webp', 'comfyrobeMobile001'],
    ['Comfyrobe-Mobile-002.webp', 'comfyrobeMobile002'],
    ['Comfyrobe-Mobile-003.webp', 'comfyrobeMobile003'],
    ['Comfyrobe-Mobile-004.webp', 'comfyrobeMobile004']
  ] as const

  for (const [fileName, binding] of mobileStills) {
    assert.match(
      gallerySource,
      new RegExp(`comfyrobe/${fileName.replace('.', '\\.')}`),
      `Comfyrobe gallery must import ${fileName}`
    )
    assert.match(
      mobileBody,
      new RegExp(`${binding},`),
      `Comfyrobe mobile gallery must include ${fileName}`
    )
    assert.doesNotMatch(
      desktopBody,
      new RegExp(`${binding},`),
      `Comfyrobe desktop gallery must not include ${fileName}`
    )
  }

  assert.match(
    gallerySource,
    /comfyrobe\/Sherpa\.webp/,
    'Comfyrobe gallery must import Sherpa.webp'
  )
  assert.match(
    desktopBody,
    /comfyrobeSherpa,/,
    'Comfyrobe desktop gallery must end with Sherpa.webp'
  )
  assert.match(
    mobileBody,
    /comfyrobeSherpa,/,
    'Comfyrobe mobile gallery must end with Sherpa.webp'
  )
  assert.doesNotMatch(
    gallerySource,
    /Comfyrobe-Sherpa-Colord-BG-1440x2160\.webp/,
    'Comfyrobe galleries must not keep the previous Sherpa still'
  )
})
