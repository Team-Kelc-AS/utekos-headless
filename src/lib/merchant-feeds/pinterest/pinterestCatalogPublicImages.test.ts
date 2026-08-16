import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getPinterestCatalogImageUrls } from './getPinterestCatalogImageUrls'
import {
  getPinterestCatalogImageSet,
  listPinterestCatalogImageFileNames,
  PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY,
  PINTEREST_MAX_ADDITIONAL_IMAGES
} from './pinterestCatalogPublicImages'

test('maps TechDown to first-party 1000x1500 public images', () => {
  const imageSet = getPinterestCatalogImageSet('utekos-techdown')
  const urls = getPinterestCatalogImageUrls('utekos-techdown')

  assert.equal(
    imageSet.additionalFileNames.length,
    PINTEREST_MAX_ADDITIONAL_IMAGES
  )
  assert.equal(
    urls.imageLink,
    'https://utekos.no/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-TechDown-Maritime-Blue-Unisex.png'
  )
  assert.equal(
    urls.additionalImageLinks[0],
    'https://utekos.no/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-TechDown-Zipper-Closeup.png'
  )
  assert.equal(urls.additionalImageLinks.length, 10)
})

test('fails closed for products without dedicated Pinterest images', () => {
  assert.throws(
    () => getPinterestCatalogImageSet('utekos-dun'),
    /missing dedicated public images/
  )
})

test('all mapped Pinterest catalog images exist in public/', () => {
  const directory = path.join(
    process.cwd(),
    'public',
    PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY.slice(1)
  )

  for (const fileName of listPinterestCatalogImageFileNames()) {
    assert.equal(
      existsSync(path.join(directory, fileName)),
      true,
      fileName
    )
  }
})
