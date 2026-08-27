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

test(
  'PDP renders ProductGallery directly from the server component',
  async () => {
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
  }
)

test(
  'redundant ProductGalleryClient wrapper no longer exists',
  () => {
    const wrapperPath = join(
      repoRoot,
      'src/app/produkter/[handle]/components/ProductGalleryClient.tsx'
    )

    assert.equal(
      existsSync(wrapperPath),
      false,
      'ProductGalleryClient.tsx must be deleted'
    )
  }
)

test(
  'desktop gallery grid remains a Server Component',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductGalleryGrid.tsx'
    )

    assert.doesNotMatch(
      source,
      /^\s*['"]use client['"]/m,
      'ProductGalleryGrid must not introduce a Client Component boundary'
    )

    assert.match(
      source,
      /quality=\{\s*90\s*\}/,
      'Desktop gallery images must use quality 90'
    )

    assert.match(
      source,
      /fetchPriority=\{\s*isAboveFoldGridImage\s*\?\s*['"]high['"]\s*:\s*['"]auto['"]\s*\}/,
      'Above-fold desktop images must retain high fetch priority'
    )

    assert.doesNotMatch(
      source,
      /\bloading\s*=/,
      'Desktop grid must not force responsive duplicates to eager-load'
    )
  }
)

test(
  'interactive carousel owns the Client Component boundary',
  async () => {
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
  }
)

test(
  'TechDown mobile gallery uses 2:3 intrinsic next/image slides',
  async () => {
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
      /imageLayout=\{\s*isTechDownProduct \?\s*'intrinsic'\s*:\s*'cover-fill'\s*\}/,
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
      /Product-Page-Img-Color-Bg-1000x5000-1\.webp/,
      'TechDown mobile gallery must start with the first color-bg still'
    )

    assert.match(
      gallerySource,
      /Product-Page-Img-Color-Bg-1000x5000\/8\.webp/,
      'TechDown mobile gallery must end with color-bg still 8'
    )

    assert.doesNotMatch(
      gallerySource,
      /Product-Page-Img-Color-Bg-1000x5000\/7\.webp/,
      'TechDown mobile gallery must skip color-bg still 7'
    )

    const mobileImageImports =
      gallerySource.match(
        /Product-Page-Img-Color-Bg-1000x5000\/(?:Product-Page-Img-Color-Bg-1000x5000-1|[2-8])\.webp/g
      ) ?? []

    assert.equal(
      mobileImageImports.length,
      7,
      'TechDown mobile gallery must contain exactly the seven requested stills'
    )
  }
)

test(
  'TechDown desktop gallery stacks the requested ProductPage stills',
  async () => {
    const pageSource = await readSource(
      'src/app/produkter/[handle]/components/ProductPageView.tsx'
    )
    const stackSource = await readSource(
      'src/app/produkter/[handle]/components/ProductGalleryStack.tsx'
    )
    const gallerySource = await readSource(
      'src/app/produkter/[handle]/utils/gallery-images/techdown/productGalleryImages.ts'
    )

    assert.match(
      pageSource,
      /const useDesktopStack = isTechDownProduct/,
      'TechDown must opt into the desktop image stack'
    )

    assert.match(
      pageSource,
      /<ProductGalleryStack[\s\S]*?images=\{galleryImages\}/,
      'TechDown desktop gallery must render ProductGalleryStack'
    )

    assert.match(
      pageSource,
      /hidden md:block/,
      'TechDown image stack must be limited to md and larger'
    )

    assert.doesNotMatch(
      stackSource,
      /^\s*['"]use client['"]/m,
      'ProductGalleryStack must remain a Server Component'
    )

    assert.match(
      stackSource,
      /flex-col/,
      'Desktop TechDown images must stack vertically'
    )

    assert.match(
      stackSource,
      /quality=\{\s*90\s*\}/,
      'Desktop stack images must use quality 90'
    )

    assert.match(
      stackSource,
      /fetchPriority=\{\s*isLeadImage\s*\?\s*['"]high['"]\s*:\s*['"]auto['"]\s*\}/,
      'Lead desktop stack image must retain high fetch priority'
    )

    assert.doesNotMatch(
      stackSource,
      /\bloading\s*=/,
      'Desktop stack must not force responsive duplicates to eager-load'
    )

    assert.match(
      gallerySource,
      /const TECHDOWN_DESKTOP_IMAGE_WIDTH = 1440/,
      'TechDown desktop next/image width must be 1440'
    )

    assert.match(
      gallerySource,
      /const TECHDOWN_DESKTOP_IMAGE_HEIGHT = 1800/,
      'TechDown desktop next/image height must be 1800'
    )

    assert.match(
      gallerySource,
      /ProductPage-TechDown-1\.jpg/,
      'TechDown desktop gallery must start with ProductPage-TechDown-1'
    )

    assert.match(
      gallerySource,
      /ProductPage-TechDown-7png\.webp/,
      'TechDown desktop gallery must end with ProductPage-TechDown-7png'
    )

    assert.doesNotMatch(
      gallerySource,
      /ProductPage-TechDown-5/,
      'TechDown desktop gallery must skip ProductPage-TechDown-5'
    )

    const desktopImageImports =
      gallerySource.match(
        /ProductPage-TechDown-(?:1|2|3|4|6|7png)\.(?:jpg|webp)/g
      ) ?? []

    assert.equal(
      desktopImageImports.length,
      6,
      'TechDown desktop gallery must contain exactly the six requested stills'
    )
  }
)