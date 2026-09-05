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
