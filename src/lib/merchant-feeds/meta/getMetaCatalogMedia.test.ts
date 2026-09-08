import assert from 'node:assert/strict'
import test from 'node:test'

import { getMetaCatalogMedia } from './getMetaCatalogMedia'

test('adds explicit multi-ratio and placement tags to curated product images', () => {
  const media = getMetaCatalogMedia({
    color: 'Havdyp',
    productHandle: 'utekos-techdown',
    curatedImages: [
      {
        url: 'https://utekos.no/catalog/techdown-feed-4x5.png',
        preferences: ['feed_4_5']
      },
      {
        url: 'https://utekos.no/catalog/techdown-stories-9x16.png',
        preferences: ['stories_9_16']
      },
      {
        url: 'https://utekos.no/catalog/techdown-reels-9x16.png',
        preferences: ['reels_9_16']
      }
    ]
  })

  assert.deepEqual(media.images.slice(-3), [
    {
      url: 'https://utekos.no/catalog/techdown-feed-4x5.png',
      tags: [
        'ASPECT_RATIO_4_5_PREFERRED',
        'family_utekos_techdown',
        'color_havdyp'
      ]
    },
    {
      url: 'https://utekos.no/catalog/techdown-stories-9x16.png',
      tags: [
        'ASPECT_RATIO_9_16_PREFERRED',
        'STORY_PREFERRED',
        'family_utekos_techdown',
        'color_havdyp'
      ]
    },
    {
      url: 'https://utekos.no/catalog/techdown-reels-9x16.png',
      tags: [
        'ASPECT_RATIO_9_16_PREFERRED',
        'REELS_PREFERRED',
        'family_utekos_techdown',
        'color_havdyp'
      ]
    }
  ])
})

test('rejects curated image URLs that Meta cannot download securely', () => {
  assert.throws(
    () =>
      getMetaCatalogMedia({
        color: 'Havdyp',
        productHandle: 'utekos-techdown',
        curatedImages: [
          {
            url: 'http://utekos.no/catalog/insecure.png',
            preferences: ['feed_4_5']
          }
        ]
      }),
    /must use HTTPS/
  )
})

test('uses only approved TechDown media and includes one catalog video', () => {
  const media = getMetaCatalogMedia({
    color: 'Havdyp',
    productHandle: 'utekos-techdown'
  })

  assert.equal(media.images.length, 6)
  assert.equal(media.videos.length, 1)
  assert.deepEqual(media.images[0]?.tags, [
    'primary',
    'INSTAGRAM_PREFERRED',
    'family_utekos_techdown',
    'color_havdyp'
  ])
  assert.equal(
    media.videos[0]?.url,
    'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/video-1-1440x2560-56e99ccafb5d.mp4'
  )
})

test('uses only the approved Comfyrobe and Mikrofiber catalog cards', () => {
  const comfyrobe = getMetaCatalogMedia({
    color: 'Fjellnatt',
    productHandle: 'comfyrobe'
  })
  const mikrofiber = getMetaCatalogMedia({
    color: 'Fjellblå',
    productHandle: 'utekos-mikrofiber'
  })

  assert.deepEqual(comfyrobe.images, [
    {
      url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/original/comfy-robe-1440x1800-b91987803ef1.png',
      tags: ['primary', 'family_comfyrobe', 'color_fjellnatt']
    }
  ])
  assert.deepEqual(mikrofiber.images.slice(0, 1), [
    {
      url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-mikrofiber/original/mikrofiber-1440x1800-master-cb3e0d8a5f1f.png',
      tags: [
        'primary',
        'family_utekos_mikrofiber',
        'color_fjellbla'
      ]
    }
  ])
})

test('selects the approved Instagram Feed alternatives independently of Facebook Feed', () => {
  for (const retailerId of [
    '46944403882232',
    '46944403915000',
    '48249962135800'
  ]) {
    const media = getMetaCatalogMedia({
      color: 'Havdyp',
      productHandle: 'utekos-techdown',
      retailerId
    })
    const instagram = media.images.filter(image =>
      image.tags.includes('INSTAGRAM_PREFERRED')
    )
    assert.equal(instagram.length, 1)
    assert.ok(
      instagram[0]?.url.includes('techdown-maritime-1440x1800-')
    )
    assert.ok(
      instagram.every(
        image =>
          !image.tags.includes('ASPECT_RATIO_4_5_PREFERRED')
      )
    )
  }
  for (const retailerId of [
    '42903231037688',
    '42903231103224'
  ]) {
    const media = getMetaCatalogMedia({
      color: 'Fjellblå',
      productHandle: 'utekos-mikrofiber',
      retailerId
    })
    const instagram = media.images.filter(image =>
      image.tags.includes('INSTAGRAM_PREFERRED')
    )
    assert.equal(instagram.length, 2)
    assert.ok(
      instagram[0]?.url.includes('mikrofiber-1440xx1800-1-')
    )
    assert.ok(
      instagram[1]?.url.includes('mikrofiber-1440xx1800-2-')
    )
    assert.ok(
      instagram.every(
        image =>
          !image.tags.includes('ASPECT_RATIO_4_5_PREFERRED')
      )
    )
  }
})

test('keeps Facebook Feed and square images bound to their approved TechDown variant', () => {
  const cases = [
    [
      '46944403882232',
      ['techdown-primary-instafeed-1'],
      'techdown-maritime-2000x2000-middels'
    ],
    [
      '46944403915000',
      ['primarymoss-0', 'primarypumpkin-0'],
      'techdown-maritime-2000x2000-12'
    ],
    [
      '48249962135800',
      ['techdown-alt-2'],
      'techdown-maritime-2000x2000-12'
    ]
  ] as const

  for (const [retailerId, feedFiles, squareFile] of cases) {
    const media = getMetaCatalogMedia({
      color: 'Havdyp',
      productHandle: 'utekos-techdown',
      retailerId
    })
    const feed = media.images.filter(image =>
      image.tags.includes('ASPECT_RATIO_4_5_PREFERRED')
    )
    assert.equal(feed.length, feedFiles.length)
    for (const [index, fragment] of feedFiles.entries())
      assert.ok(feed[index]?.url.includes(fragment))
    assert.ok(media.images[0]?.url.includes(squareFile))
    const stories = media.images.filter(image =>
      image.tags.includes('STORY_PREFERRED')
    )
    assert.equal(stories.length, 2)
    assert.ok(
      stories.some(image =>
        image.url.includes('techdown-primary-terracce-4')
      )
    )
    assert.ok(
      stories.some(image =>
        image.url.includes('techdown-primary-1440x2560')
      )
    )
    assert.ok(
      media.images.every(
        image => !image.url.includes('1440x2560-111')
      )
    )
    assert.equal(media.videos.length, 1)
    assert.equal(
      media.images.filter(image =>
        image.tags.includes('REELS_PREFERRED')
      ).length,
      1
    )
  }
})
