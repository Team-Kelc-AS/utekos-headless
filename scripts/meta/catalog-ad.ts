import { FacebookAdsApi } from 'facebook-nodejs-business-sdk'

import { buildMetaCatalogAd } from '../../src/lib/merchant-feeds/meta/buildMetaCatalogAd'
import { META_GRAPH_API_VERSION } from '../../src/lib/merchant-feeds/meta/metaCatalogConstants'
import { submitMetaCatalogAd } from '../../src/lib/merchant-feeds/meta/submitMetaCatalogAd'

async function main() {
  const argv = process.argv.slice(2)
  const validate = argv.includes('--validate')
  const apply = argv.includes('--apply')

  if (validate && apply) {
    throw new Error('Use either --validate or --apply, not both')
  }

  const args = Object.fromEntries(
    argv
      .filter(value => value.startsWith('--') && value.includes('='))
      .map(value => {
        const separatorIndex = value.indexOf('=')

        return [
          value.slice(2, separatorIndex),
          value.slice(separatorIndex + 1)
        ]
      })
  )
  const adAccountId =
    args['ad-account-id'] ?? process.env.META_AD_ACCOUNT_ID ?? ''
  const request = buildMetaCatalogAd({
    adName:
      args.name ?? process.env.META_CATALOG_AD_NAME ?? '',
    adSetId:
      args['ad-set-id'] ??
      process.env.META_CATALOG_AD_SET_ID ??
      '',
    includeProductVideo: argv.includes('--include-product-video'),
    instagramUserId:
      args['instagram-user-id'] ??
      process.env.META_INSTAGRAM_USER_ID,
    link:
      args.link ?? process.env.META_CATALOG_AD_LINK ?? '',
    message:
      args.message ?? process.env.META_CATALOG_AD_MESSAGE ?? '',
    pageId:
      args['page-id'] ?? process.env.META_PAGE_ID ?? '',
    pixelId:
      args['pixel-id'] ?? process.env.META_PIXEL_ID ?? '',
    productSetId:
      args['product-set-id'] ??
      process.env.META_CATALOG_PRODUCT_SET_ID ??
      ''
  })
  const mode = apply ? 'apply' : validate ? 'validate' : 'plan'
  const report = {
    mode,
    graphApiVersion: META_GRAPH_API_VERSION,
    businessSdkVersion: FacebookAdsApi.SDK_VERSION,
    adAccountId,
    request
  }

  if (mode === 'plan') {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const accessToken = (
    process.env.META_SYSTEM_USER_TOKEN ??
    process.env.CATALOG_API_TOKEN ??
    process.env.META_ACCESS_TOKEN ??
    ''
  ).trim()

  if (!accessToken) {
    throw new Error('A valid Meta access token is required')
  }

  const validation = await submitMetaCatalogAd({
    accessToken,
    adAccountId,
    mode: 'validate',
    request
  })

  if (mode === 'validate') {
    console.log(JSON.stringify({ ...report, validation }, null, 2))
    return
  }

  const creation = await submitMetaCatalogAd({
    accessToken,
    adAccountId,
    mode: 'create',
    request
  })

  console.log(
    JSON.stringify({ ...report, validation, creation }, null, 2)
  )
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
})
