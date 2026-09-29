import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  TECHDOWN_CANONICAL_URL,
  TECHDOWN_META_CONTENT_ID_BY_SIZE,
  TECHDOWN_META_PRODUCT_CATALOG_ID,
  techdownMetadata
} from '@/app/(techdown)/techdownMeta'

test('pins the TechDown Meta catalog identity to the verified Shopify variants', async () => {
  assert.equal(
    TECHDOWN_META_PRODUCT_CATALOG_ID,
    '690208780604782'
  )
  assert.deepEqual(TECHDOWN_META_CONTENT_ID_BY_SIZE, {
    Middels: '46944403882232',
    Stor: '46944403915000',
    Større: '48249962135800'
  })

  const pixelSource = await readFile(
    'public/analytics/meta-pixel-canonical-v1.js',
    'utf8'
  )
  assert.match(
    pixelSource,
    /TECHDOWN_PRODUCT_CATALOG_ID = '690208780604782'/
  )
  for (const contentId of Object.values(
    TECHDOWN_META_CONTENT_ID_BY_SIZE
  )) {
    assert.match(pixelSource, new RegExp(`'${contentId}': true`))
  }
})

test('places the official lazy Facebook Page Plugin after reviews', async () => {
  assert.equal(
    TECHDOWN_CANONICAL_URL,
    'https://utekos.no/produkter/utekos-techdown'
  )

  const source = await readFile(
    'src/app/(techdown)/produkter/techdown/TechdownFacebookPage.tsx',
    'utf8'
  )
  const pluginSource = await readFile(
    'src/app/(techdown)/produkter/techdown/TechdownFacebookPagePlugin.tsx',
    'utf8'
  )

  assert.doesNotMatch(source, /fb-share-button/)
  assert.doesNotMatch(
    source,
    /'use client'|useEffect|facebook-jssdk|window\.FB/
  )
  assert.doesNotMatch(source, /app_id|UTEKOS_FACEBOOK_APP_ID/)
  assert.doesNotMatch(pluginSource, /facebook-jssdk|window\.FB/)
  assert.doesNotMatch(pluginSource, /app_id|UTEKOS_FACEBOOK_APP_ID/)
  assert.match(
    source,
    /UTEKOS_FACEBOOK_PAGE_URL =\s*'https:\/\/www\.facebook\.com\/utekosen'/
  )
  assert.match(source, /TechdownFacebookPagePlugin/)
  assert.match(pluginSource, /facebook\.com\/plugins\/page\.php/)
  assert.match(pluginSource, /tabs:\s*'timeline'/)
  assert.match(pluginSource, /MAX_PLUGIN_WIDTH = 500/)
  assert.match(pluginSource, /MIN_PLUGIN_WIDTH = 180/)
  assert.match(pluginSource, /MOBILE_PLUGIN_ASPECT_RATIO = 9 \/ 16/)
  assert.match(pluginSource, /DESKTOP_PLUGIN_ASPECT_RATIO = 5 \/ 7/)
  assert.match(pluginSource, /MOBILE_BREAKPOINT_PX = 768/)
  assert.match(pluginSource, /adapt_container_width:\s*'true'/)
  assert.match(pluginSource, /show_facepile:\s*'true'/)
  assert.match(pluginSource, /ResizeObserver/)
  assert.match(pluginSource, /loading='lazy'/)
  assert.match(source, />\s*Følg Utekos på Facebook\s*</)
  assert.match(source, /target='_blank'/)
  assert.match(source, /rel='noopener noreferrer'/)

  const pageSource = await readFile(
    'src/app/(techdown)/produkter/techdown/page.mdx',
    'utf8'
  )
  assert.ok(
    pageSource.indexOf('<TechdownFacebookPage />') >
      pageSource.indexOf('<TechdownReviews />')
  )
})

test('publishes an explicit crawler preview without changing the source image ratio', () => {
  assert.equal(
    techdownMetadata.alternates?.canonical,
    TECHDOWN_CANONICAL_URL
  )
  assert.equal(techdownMetadata.openGraph?.url, TECHDOWN_CANONICAL_URL)

  const images = techdownMetadata.openGraph?.images
  assert.ok(Array.isArray(images))
  const image = images[0]
  assert.equal(typeof image, 'object')
  assert.deepEqual(image, {
    url: '/TechDown_32.jpg',
    width: 2200,
    height: 1467,
    alt: 'To personer i marineblå Utekos TechDown™ i hengekøyer i skogen.'
  })
})
