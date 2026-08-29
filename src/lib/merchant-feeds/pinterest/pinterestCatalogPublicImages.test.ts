import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { SHOPIFY_FILES_CDN_ORIGIN } from './buildShopifyFilesCdnUrl'
import { getPinterestCatalogImageUrls } from './getPinterestCatalogImageUrls'
import { PINTEREST_MAX_ADDITIONAL_IMAGES } from './pinterestCatalogImageUrlSchema'
import {
  getPinterestCatalogImageSet,
  listPinterestCatalogFirstPartyImageFileNames,
  listPinterestCatalogImageLinks,
  PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY
} from './pinterestCatalogPublicImages'

test('maps TechDown to Shopify Files CDN URLs without query', () => {
  const imageSet = getPinterestCatalogImageSet('utekos-techdown')
  const urls = getPinterestCatalogImageUrls('utekos-techdown')

  assert.equal(
    urls.imageLink,
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp-Master.png`
  )
  assert.deepEqual(urls.additionalImageLinks, [
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp-Kyst.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp-Back.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp-Front-Half.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/Utekos-TechDown-Maritime-Blue-Group-2.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp-Back-Half.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/Utekos-TechDown-Maritime-Blue-Zipper.png`
  ])
  assert.equal(imageSet.imageLink, urls.imageLink)
  assert.ok(
    urls.additionalImageLinks.length <= PINTEREST_MAX_ADDITIONAL_IMAGES
  )
  assert.doesNotMatch(urls.imageLink, /[?#]/)
})

test('maps Mikrofiber to Shopify Files CDN URLs without query', () => {
  const urls = getPinterestCatalogImageUrls('utekos-mikrofiber')

  assert.equal(
    urls.imageLink,
    `${SHOPIFY_FILES_CDN_ORIGIN}/Mikroriber-Card.png`
  )
  assert.deepEqual(urls.additionalImageLinks, [
    `${SHOPIFY_FILES_CDN_ORIGIN}/Mikrofiber-Fjellbla-1.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/Mikrofiber-Fjellbla-3.png`,
    `${SHOPIFY_FILES_CDN_ORIGIN}/Mikrofiber-Fjellbla-4.png`
  ])
  assert.equal(
    new Set(urls.additionalImageLinks).size,
    urls.additionalImageLinks.length
  )
})

test('fails closed for products without dedicated Pinterest images', () => {
  assert.throws(
    () => getPinterestCatalogImageSet('utekos-dun'),
    /missing dedicated public images/
  )
})

test('all catalog image URLs are https without query or hash', () => {
  for (const imageLink of listPinterestCatalogImageLinks()) {
    const url = new URL(imageLink)

    assert.equal(url.protocol, 'https:')
    assert.equal(url.search, '')
    assert.equal(url.hash, '')
    assert.ok(imageLink.length <= 2000)
  }
})

test('first-party Pinterest catalog images exist in public/', () => {
  const directory = path.join(
    process.cwd(),
    'public',
    PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY.slice(1)
  )

  for (const fileName of listPinterestCatalogFirstPartyImageFileNames()) {
    assert.equal(
      existsSync(path.join(directory, fileName)),
      true,
      fileName
    )
  }
})
