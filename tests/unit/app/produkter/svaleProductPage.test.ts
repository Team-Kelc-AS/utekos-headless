import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  SVALE_MOBILE_GALLERY_IMAGES,
  SVALE_PRODUCT_GALLERY_IMAGES
} from '@/app/produkter/[handle]/utils/gallery-images/svale/svaleProductGalleryImages'
import {
  getProductPageContent,
  getProductPageDescriptionText
} from '@/db/data/products/product-page-content'
import { isStorefrontVisibleProductHandle } from '@/lib/products/presentation'
import { svaleImages } from '@/app/(svale)/produkter/svale/svaleImages'

test('keeps Svale hidden from storefront surfaces before launch', () => {
  assert.equal(
    isStorefrontVisibleProductHandle('utekos-svale'),
    false
  )

  const overviewSource = readFileSync(
    'src/app/(store)/produkter/(oversikt)/components/HelpChooseSection.tsx',
    'utf8'
  )
  assert.match(
    overviewSource,
    /isProductPageRequestAllowed\(\s*carousel\.handle,\s*process\.env\.NODE_ENV\s*\)/
  )

  const productPageSource = readFileSync(
    'src/app/(store)/produkter/[handle]/components/AsyncProductContent.tsx',
    'utf8'
  )
  assert.match(
    productPageSource,
    /isProductPageRequestAllowed\(handle, process\.env\.NODE_ENV\)/
  )

  const metadataSource = readFileSync(
    'src/app/(store)/produkter/[handle]/utils/generateProductMetadata.ts',
    'utf8'
  )
  assert.match(
    metadataSource,
    /isProductPageRequestAllowed\([\s\S]*process\.env\.NODE_ENV[\s\S]*\)/
  )
})

test('uses the verified Svale galleries without changing image ratios', () => {
  const overridesSource = readFileSync(
    'src/app/(store)/produkter/[handle]/utils/gallery-images/productGalleryImageOverrides.ts',
    'utf8'
  )
  const pageSource = readFileSync(
    'src/app/(store)/produkter/[handle]/components/ProductPageView.tsx',
    'utf8'
  )
  const slideImageSource = readFileSync(
    'src/components/jsx/ProductGallerySlideImage.tsx',
    'utf8'
  )
  assert.match(
    overridesSource,
    /'utekos-svale': SVALE_PRODUCT_GALLERY_IMAGES/
  )
  assert.match(
    pageSource,
    /productData\.handle === 'utekos-svale' \?\s*SVALE_MOBILE_GALLERY_IMAGES/
  )
  assert.match(
    pageSource,
    /className='hidden md:block'[\s\S]*isSvaleProduct \?[\s\S]*imageLayout='contain-fill'/
  )
  assert.match(
    pageSource,
    /className='md:hidden'[\s\S]*imageLayout=\{\s*isSvaleProduct \? 'intrinsic'/
  )
  assert.match(
    pageSource,
    /rounded-xl bg-moonstruck[\s\S]*imageBackgroundClassName='bg-moonstruck'/
  )
  assert.match(pageSource, /isSvaleProduct \? 'intrinsic'/)
  assert.match(
    slideImageSource,
    /imageLayout === 'intrinsic' &&[\s\S]*'object-contain object-center'/
  )
  assert.match(
    slideImageSource,
    /imageLayout === 'contain-fill' &&[\s\S]*'object-contain object-center'/
  )
  assert.match(
    slideImageSource,
    /case 'contain-fill':[\s\S]*?<Image[\s\S]*?fill/
  )
  assert.match(
    slideImageSource,
    /style=\{\{ width: '100%', height: 'auto' \}\}/
  )
  assert.deepEqual(
    SVALE_MOBILE_GALLERY_IMAGES.map(image => image.url),
    [
      '/Svale_1.webp',
      '/Svale_2.webp',
      '/Svale_3.webp',
      '/Svale_4.webp',
      '/Svale_6.webp'
    ]
  )

  for (const image of SVALE_MOBILE_GALLERY_IMAGES) {
    assert.equal(image.width, 1000)
    assert.equal(image.height, 1500)
    assert.equal(image.width / image.height, 2 / 3)
    assert.ok(image.altText.length > 0)
  }

  assert.deepEqual(
    SVALE_PRODUCT_GALLERY_IMAGES.map(image => image.url),
    [
      '/Svale_Vertical_Transparent.webp',
      '/Svale_Vertical_Left_Transparent.webp',
      '/Svale_Hoodie_1440x1800.webp',
      '/Svale_Details_Zipper_1440x1800.webp',
      '/Svale_Details_Logo.webp'
    ]
  )

  for (const image of SVALE_PRODUCT_GALLERY_IMAGES) {
    assert.ok(image.width > 0)
    assert.ok(image.height > 0)
    assert.ok(image.altText.length > 0)
  }
})

test('keeps TechDown body copy and product information for Svale pre-launch', () => {
  const svale = getProductPageContent('utekos-svale')
  const techDown = getProductPageContent('utekos-techdown')

  assert.ok(svale)
  assert.ok(techDown)
  assert.equal(svale.description.title, 'Utekos Svale')
  assert.equal(svale.description.lead, techDown.description.lead)
  assert.deepEqual(
    svale.description.blocks,
    techDown.description.blocks
  )
  assert.deepEqual(svale.accordion, techDown.accordion)
  assert.equal(
    getProductPageDescriptionText('utekos-svale'),
    getProductPageDescriptionText('utekos-techdown')
  )
})

test('gives Svale the TechDown mobile route structure without TechDown commerce data', () => {
  const pageSource = readFileSync(
    'src/app/(svale)/produkter/svale/page.tsx',
    'utf8'
  )
  const mobileOnlySource = readFileSync(
    'src/app/(svale)/SvaleMobileOnly.tsx',
    'utf8'
  )
  const selectorSource = readFileSync(
    'src/app/(svale)/produkter/svale/SvaleSizeSelector.tsx',
    'utf8'
  )
  const contentSource = readFileSync(
    'src/app/(svale)/produkter/svale/SvaleContent.tsx',
    'utf8'
  )

  assert.match(
    pageSource,
    /generateProductMetadata\('utekos-svale'\)/
  )
  assert.match(
    pageSource,
    /isProductPageRequestAllowed\([\s\S]*'utekos-svale'/
  )
  assert.match(
    mobileOnlySource,
    /DESKTOP_PATH = '\/produkter\/utekos-svale'/
  )
  assert.doesNotMatch(mobileOnlySource, /utekos-techdown/)
  assert.match(selectorSource, /handle: 'utekos-svale'/)
  assert.match(selectorSource, /showSelectedPrice/)
  assert.match(
    selectorSource,
    /trackingEventName='SvaleAddToCartClick'/
  )
  assert.doesNotMatch(
    contentSource,
    /TechdownReviews|Storrelseshjelp/
  )

  assert.deepEqual(
    svaleImages.map(image => image.main),
    [
      '/Svale_1.webp',
      '/Svale_2.webp',
      '/Svale_3.webp',
      '/Svale_4.webp',
      '/Svale_6.webp'
    ]
  )

  for (const image of svaleImages) {
    assert.equal(image.width, 1000)
    assert.equal(image.height, 1500)
    assert.equal(image.width / image.height, 2 / 3)
  }
})
