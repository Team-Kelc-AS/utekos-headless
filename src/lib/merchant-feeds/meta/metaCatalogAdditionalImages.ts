import type { MetaCatalogCuratedImage } from './metaCatalogMediaManifest'

const techDownImages: readonly MetaCatalogCuratedImage[] = [
  {
    url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/4x5/techdown-1440x1800-93-afacc4f6eb31.jpg',
    preferences: ['feed_4_5']
  },
  {
    url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/4x5/techdown-1440x1800-90-ab2e0a71e23d.jpg',
    preferences: ['instagram']
  },
  {
    url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/1x1/techdown-2000x2000-90-8af6f3c3d8de.jpg',
    preferences: ['catalog_primary']
  },
  {
    url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/pinktechdown-1440x2560-d6f62c2f62e5.png',
    preferences: ['reels_9_16', 'stories_9_16']
  },
  {
    url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/campingtechdown-1440x2560-ada390abd426.png',
    preferences: ['stories_9_16']
  },
  {
    url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/techdownbakside-8ab6387f18d2.jpg',
    preferences: ['stories_9_16']
  }
]

export const META_CATALOG_ADDITIONAL_IMAGES_BY_VARIANT: Readonly<
  Record<
    string,
    Readonly<Record<string, readonly MetaCatalogCuratedImage[]>>
  >
> = {
  'comfyrobe': {
    '43959919051000': [
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/4x5/comfyrobe-xs-1440x1800-5b5eefd9e44d.png',
        preferences: ['feed_4_5']
      }
    ],
    '43959919116536': [
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/4x5/comfyrobe-xl-1-1440x1800-592e8a2d0dfd.png',
        preferences: ['feed_4_5']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/4x5/comfyrobe-xl-2-1440x1800-164aae173ad0.png',
        preferences: ['feed_4_5']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/1x1/comfyrobe-xl-3-2000x2000-c85a2600ae90.png',
        preferences: ['catalog_primary']
      }
    ]
  },
  'utekos-techdown': {
    '46944403882232': techDownImages,
    '46944403915000': techDownImages,
    '48249962135800': [
      ...techDownImages,
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/storretechdown-1440x2560-01724935e81f.png',
        preferences: ['reels_9_16', 'stories_9_16']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/bondiretechdown-1440x2560-badc796ed3ef.png',
        preferences: ['stories_9_16']
      }
    ]
  }
}
