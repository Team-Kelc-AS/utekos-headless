import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import createMDX from '@next/mdx'
import { withWorkflow } from 'workflow/next'

const GOOGLE_TAG_GATEWAY_PATH = '/__gtg'
const SERVER_TAG_MANAGER_PATH = '/__sgtm'

const GOOGLE_TAG_MANAGER_ORIGIN =
  'https://www.googletagmanager.com'

const SERVER_TAG_MANAGER_ORIGIN =
  'https://cloud.server.utekos.no'
const LEGACY_TECHDOWN_IMAGE_PATH =
  '/tech-diagonal-halv-maritime-blue-bg.png'
const CURRENT_TECHDOWN_IMAGE_PATH =
  '/utekos-techdown-diagonalt-fullfigur.webp'

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [
      'remark-frontmatter',
      'remark-gfm',
      ['remark-mdx-frontmatter', { name: 'frontmatter' }],

      ['remark-toc', { heading: 'Innhold' }]
    ],

    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'append' }]
    ]
  }
})

const STATIC_ASSET_CACHE_CONTROL =
  'public, max-age=31536000, immutable'
const SENTRY_AUTH_TOKEN =
  process.env.PERFORMANCE_SENTRY_AUTH_TOKEN ||
  process.env.SENTRY_AUTH_TOKEN
const SENTRY_ORG =
  process.env.PERFORMANCE_SENTRY_ORG || process.env.SENTRY_ORG
const SENTRY_PROJECT =
  process.env.PERFORMANCE_SENTRY_PROJECT ||
  process.env.SENTRY_PROJECT
const ENABLE_BUNDLE_ANALYZER = process.env.ANALYZE === 'true'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: ENABLE_BUNDLE_ANALYZER
})

const staticAssetHeaders = [
  { key: 'Cache-Control', value: STATIC_ASSET_CACHE_CONTROL }
]

async function buildSecurityHeaders() {
  const cspModulePath =
    './src/lib/security/buildReportOnlyCsp.ts'
  const { buildReportOnlyCsp } = await import(cspModulePath)
  
  return [
    {
      key: 'Content-Security-Policy',
      value: "frame-ancestors 'self'"
    },
    {
      key: 'Content-Security-Policy-Report-Only',
      value: buildReportOnlyCsp()
    },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Document-Policy', value: 'js-profiling' },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin'
    }
  ]
  /* eslint-enable quotes */
}


const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  poweredByHeader: false,
  partialPrefetching: true,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      '*.mp4': {
        type: 'asset'
      }
    }
  },
  cacheLife: {
    products: { stale: 300, revalidate: 900, expire: 3600 },
    collections: { stale: 600, revalidate: 1800, expire: 7200 },
    content: { stale: 3600, revalidate: 86400, expire: 604800 },
    marketing: {
      stale: 86400,
      revalidate: 604800,
      expire: 2592000
    }
  },

  staticPageGenerationTimeout: 180,

  experimental: {
    turbopackRustReactCompiler: true,
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    serverComponentsHmrCache: true,
    webVitalsAttribution: ['CLS', 'INP', 'LCP', 'FCP', 'TTFB'],
    optimizePackageImports: [
      'zod',
      'facebook-nodejs-business-sdk',
      'lucide-react',
      '@tanstack/react-query',
      'react-hook-form',
      'xstate',
      '@xstate/react',
      'motion',
      'cmdk',
      'embla-carousel-react',
      'embla-carousel-accessibility',
      'embla-carousel-autoplay',
      'embla-carousel-class-names',
      'embla-carousel-fade',
      'embla-carousel-ssr',
      'sonner',
      'vaul'
    ]
  },

  ...(process.env.NODE_ENV === 'development' ?
    {
      logging: {
        fetches: { fullUrl: true, hmrRefreshes: false }
      }
    }
  : {}),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'utekos.no',
        pathname: '/**'
      }
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 80, 85, 90, 95, 100],
    deviceSizes: [
      390, 430, 640, 750, 828, 1080, 1200, 1440, 1920
    ],
    imageSizes: [32, 48, 64, 96, 128, 256, 384]
  },

  async headers() {
    const securityHeaders = await buildSecurityHeaders()

    return [
      { source: '/:path*', headers: securityHeaders },

      {
        source: `${SERVER_TAG_MANAGER_PATH}/:path*`,
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' }
        ]
      },

      {
        source:
          '/:path*.:extension(png|jpg|jpeg|webp|avif|gif|svg|ico|otf|woff2)',
        headers: staticAssetHeaders
      },
      { source: '/videos/:path*', headers: staticAssetHeaders }
    ]
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: LEGACY_TECHDOWN_IMAGE_PATH,
          destination: CURRENT_TECHDOWN_IMAGE_PATH
        },
        {
          source: `${GOOGLE_TAG_GATEWAY_PATH}/:path*`,
          destination: `${GOOGLE_TAG_MANAGER_ORIGIN}/:path*`
        },
        {
          source: `${SERVER_TAG_MANAGER_PATH}/:path*`,
          destination: `${SERVER_TAG_MANAGER_ORIGIN}/:path*`
        },
        {
          source: '/',
          has: [{ type: 'host', value: 'feed.utekos.no' }],
          destination: '/klarna-feed.xml'
        },
        {
          source: '/',
          has: [{ type: 'host', value: 'www.feed.utekos.no' }],
          destination: '/klarna-feed.xml'
        }
      ],
      afterFiles: [],
      fallback: []
    }
  },

  async redirects() {
    return [
      {
        source: '/contact',
        destination: '/kontaktskjema',
        permanent: true
      },
      {
        source: '/products/:path*',
        destination: '/produkter/:path*',
        permanent: true
      },
      {
        source: '/terms',
        destination: '/vilkar-betingelser',
        permanent: true
      },
      {
        source: '/privacy-policy',
        destination: '/personvern',
        permanent: true
      },
      {
        source: '/products',
        destination: '/produkter',
        permanent: true
      },
      {
        source: '/about-us',
        destination: '/om-oss',
        permanent: true
      },
      {
        source: '/about',
        destination: '/om-oss',
        permanent: true
      },
      {
        source: '/discount/NBCC128',
        destination: '/nbcc',
        permanent: true
      },
      {
        source: '/policies/refund-policy',
        destination: '/frakt-og-retur',
        permanent: true
      },
      {
        source: '/policies/privacy-policy',
        destination: '/personvern',
        permanent: true
      },
      {
        source: '/produkter/utekos-teckdawn',
        destination: '/produkter/utekos-techdown',
        permanent: true
      },
      {
        source: '/produkter/utekos-techdawn',
        destination: '/produkter/utekos-techdown',
        permanent: true
      },
      {
        source: '/pages/camping',
        destination: '/inspirasjon',
        permanent: true
      },
      {
        source: '/pages/contact',
        destination: '/kontaktskjema',
        permanent: true
      },
      {
        source: '/pages/kundeservice',
        destination: '/kontaktskjema',
        permanent: true
      }
    ]
  },

  webpack: config => {
    config.module.rules.push({
      test: /\.mp4$/iu,
      type: 'asset/resource'
    })

    return config
  }
}

const sentryOptions = {
  ...(SENTRY_ORG ? { org: SENTRY_ORG } : {}),
  ...(SENTRY_PROJECT ? { project: SENTRY_PROJECT } : {}),
  ...(SENTRY_AUTH_TOKEN ? { authToken: SENTRY_AUTH_TOKEN } : {}),
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.CI },
  webpack: { treeshake: { removeDebugLogging: true } }
}

const configuredNextConfig = withWorkflow(
  withBundleAnalyzer(withMDX(nextConfig))
)

export default withSentryConfig(
  configuredNextConfig,
  sentryOptions
)
