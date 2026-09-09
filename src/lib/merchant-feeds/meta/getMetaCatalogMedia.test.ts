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

test('preserves the approved TechDown video and adds three new catalog videos', () => {
  const media = getMetaCatalogMedia({
    color: 'Havdyp',
    productHandle: 'utekos-techdown'
  })

  assert.equal(media.images.length, 6)
  assert.equal(media.videos.length, 4)
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
      url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/original/comfy-1440xx1800-1-36e7954cd457.png',
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
      instagram[0]?.url.includes('techdown-1440x1800-90-')
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

test('replaces TechDown primary square and Facebook Feed images while preserving Stories and Reels', () => {
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

  for (const [retailerId] of cases) {
    const media = getMetaCatalogMedia({
      color: 'Havdyp',
      productHandle: 'utekos-techdown',
      retailerId
    })
    const feed = media.images.filter(image =>
      image.tags.includes('ASPECT_RATIO_4_5_PREFERRED')
    )
    assert.equal(feed.length, 1)
    assert.ok(feed[0]?.url.includes('techdown-1440x1800-93-'))
    assert.ok(
      media.images[0]?.url.includes('techdown-2000x2000-90-')
    )
    assert.equal(
      media.images.filter(image =>
        image.tags.includes('primary')
      ).length,
      1
    )
    assert.ok(media.images[0]?.tags.includes('primary'))
    const stories = media.images.filter(image =>
      image.tags.includes('STORY_PREFERRED')
    )
    assert.equal(
      stories.length,
      retailerId === '48249962135800' ? 7 : 5
    )
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
    assert.equal(media.videos.length, 4)
    assert.equal(
      media.images.filter(image =>
        image.tags.includes('REELS_PREFERRED')
      ).length,
      retailerId === '48249962135800' ? 3 : 2
    )
  }
})

test('replaces Comfyrobe primary images with the correct new size-specific media', () => {
  for (const [retailerId, count, included, excluded] of [
    ['43959919051000', 2, 'comfyrobe-xs-', 'comfyrobe-xl-'],
    ['43959919116536', 4, 'comfyrobe-xl-', 'comfyrobe-xs-']
  ] as const) {
    const media = getMetaCatalogMedia({
      productHandle: 'comfyrobe',
      color: 'Fjellnatt',
      retailerId
    })
    assert.equal(media.images.length, count)
    assert.ok(
      media.images[0]?.url.includes(
        retailerId === '43959919051000' ? 'comfyrobe-xs-' : (
          'comfyrobe-xl-3-'
        )
      )
    )
    assert.equal(
      media.images.filter(image =>
        image.tags.includes('primary')
      ).length,
      1
    )
    const feed = media.images.filter(image =>
      image.tags.includes('ASPECT_RATIO_4_5_PREFERRED')
    )
    assert.equal(feed.length, 1)
    assert.ok(
      feed[0]?.url.includes(
        retailerId === '43959919051000' ? 'comfyrobe-xs-' : (
          'comfyrobe-xl-1-'
        )
      )
    )
    assert.ok(feed[0]?.tags.includes('INSTAGRAM_PREFERRED'))
    assert.ok(
      media.images.some(image => image.url.includes(included))
    )
    assert.ok(
      media.images.every(image => !image.url.includes(excluded))
    )
    assert.equal(media.videos.length, 0)
  }
})

test('keeps size-labelled Storre and Bondire assets off Middels and Stor', () => {
  for (const retailerId of [
    '46944403882232',
    '46944403915000',
    '48249962135800'
  ]) {
    const media = getMetaCatalogMedia({
      productHandle: 'utekos-techdown',
      color: 'Havdyp',
      retailerId
    })
    for (const name of ['storretechdown', 'bondiretechdown']) {
      assert.equal(
        media.images.some(image => image.url.includes(name)),
        retailerId === '48249962135800'
      )
    }
    const pink = media.images.filter(image =>
      image.url.includes('pinktechdown')
    )
    assert.equal(pink.length, 1)
    assert.ok(pink[0]?.tags.includes('REELS_PREFERRED'))
    assert.ok(pink[0]?.tags.includes('STORY_PREFERRED'))
    const back = media.images.filter(image =>
      image.url.includes('techdownbakside-')
    )
    assert.equal(back.length, 1)
    assert.ok(back[0]?.tags.includes('STORY_PREFERRED'))
    assert.ok(!back[0]?.tags.includes('REELS_PREFERRED'))
    assert.equal(
      new Set(media.images.map(image => image.url)).size,
      media.images.length
    )
    assert.ok(media.images.length <= 21)
    assert.ok(
      media.videos[1]?.url.includes(
        '/9x16/catalogtechdownproducts-'
      )
    )
    assert.ok(
      media.videos[2]?.url.includes(
        '/1x1/catalogtechdownproducts-2000x2000-'
      )
    )
    assert.ok(
      media.videos[3]?.url.includes(
        '/1x1/juster-form-nyt-2000x2000-'
      )
    )
  }
})

test('does not append variant additions to an explicit curated override', () => {
  const media = getMetaCatalogMedia({
    productHandle: 'comfyrobe',
    color: 'Fjellnatt',
    retailerId: '43959919116536',
    curatedImages: [
      {
        url: 'https://utekos.no/approved.png',
        preferences: ['catalog_primary']
      }
    ]
  })
  assert.deepEqual(
    media.images.map(image => image.url),
    ['https://utekos.no/approved.png']
  )
})

test('rejects competing replacements for the same image preference', () => {
  assert.throws(
    () =>
      getMetaCatalogMedia({
        productHandle: 'utekos-techdown',
        color: 'Havdyp',
        curatedImages: [
          {
            url: 'https://utekos.no/a.png',
            preferences: ['catalog_primary'],
            replacePreferences: true
          },
          {
            url: 'https://utekos.no/b.png',
            preferences: ['catalog_primary'],
            replacePreferences: true
          }
        ]
      }),
    /Conflicting Meta catalog primary images/
  )
})
