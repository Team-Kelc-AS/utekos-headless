import type { MetaCatalogImagePreference } from './metaCatalogImageTags'

export type MetaCatalogCuratedImage = {
  url: string
  preferences: readonly MetaCatalogImagePreference[]
}

type MetaCatalogMediaManifest = {
  includeDefaultImages: boolean
  images: readonly MetaCatalogCuratedImage[]
  videos: readonly string[]
}

export const META_CATALOG_MEDIA_MANIFEST_BY_HANDLE = {
  comfyrobe: {
    includeDefaultImages: false,
    images: [
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/comfyrobe/original/comfy-robe-1440x1800-b91987803ef1.png',
        preferences: ['catalog_primary']
      }
    ],
    videos: []
  },
  'utekos-dun': {
    includeDefaultImages: true,
    images: [],
    videos: []
  },
  'utekos-mikrofiber': {
    includeDefaultImages: false,
    images: [
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-mikrofiber/original/mikrofiber-1440x1800-master-cb3e0d8a5f1f.png',
        preferences: ['catalog_primary']
      }
    ],
    videos: []
  },
  'utekos-stapper': {
    includeDefaultImages: true,
    images: [],
    videos: []
  },
  'utekos-techdown': {
    includeDefaultImages: false,
    images: [
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/1x1/techdown-cover-2000x2000-33791f3672be.png',
        preferences: ['default_1_1']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/1x1/techdown-2000x2000-3-67970d7e7731.png',
        preferences: ['additional_1_1']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/4x5/utekos-meta-techdown-feed-cover-1440x1800-b60fe9fd0d5d.png',
        preferences: ['feed_4_5']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/4x5/utekos-meta-techdown-feed-detail-1440x1800-095dbefa09d1.png',
        preferences: ['feed_4_5']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/techdown-instastory-primary-cover-1440x2560-9eee64c18450.png',
        preferences: ['stories_9_16']
      },
      {
        url: 'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/techdown-reel-2-1400x2560-ffc4f711566e.png',
        preferences: ['reels_9_16']
      }
    ],
    videos: [
      'https://lgvy0jmfdbczo2dz.public.blob.vercel-storage.com/meta/catalog/v26/utekos-techdown/9x16/video-1-1440x2560-56e99ccafb5d.mp4'
    ]
  }
} as const satisfies Record<string, MetaCatalogMediaManifest>
