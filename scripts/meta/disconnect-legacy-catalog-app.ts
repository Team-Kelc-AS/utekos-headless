import {
  disconnectLegacyMetaCatalogApp,
  META_LEGACY_CATALOG_APP_ID
} from '../../src/lib/merchant-feeds/meta/disconnectLegacyMetaCatalogApp'
import { META_CATALOG_ID } from '../../src/lib/merchant-feeds/meta/metaCatalogConstants'

async function main() {
  const apply = process.argv.includes('--apply')
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    catalogId: META_CATALOG_ID,
    legacyAppId: META_LEGACY_CATALOG_APP_ID
  }

  if (!apply) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const accessToken = process.env.CATALOG_API_TOKEN?.trim()

  if (!accessToken) {
    throw new Error('CATALOG_API_TOKEN is required for --apply')
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        ...(await disconnectLegacyMetaCatalogApp({ accessToken }))
      },
      null,
      2
    )
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
