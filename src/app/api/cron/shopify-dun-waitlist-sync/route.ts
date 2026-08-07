import {
    runDunWaitlistShopifySyncBatch,
    type DunWaitlistShopifySyncSummary
  } from '@/lib/shopify/runDunWaitlistShopifySyncBatch'
  import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
  
  const CRON_BATCH_SIZE = 10
  
  export const maxDuration = 60
  
  type RunBatch = (input: {
    maxItems: number
  }) => Promise<DunWaitlistShopifySyncSummary>
  
  export type DunWaitlistShopifySyncCronDependencies = {
    getCronSecret: () => string | undefined
    runBatch: RunBatch
  }
  
  const defaultDependencies: DunWaitlistShopifySyncCronDependencies =
    {
      getCronSecret: () =>
        process.env.CRON_SECRET,
      runBatch:
        runDunWaitlistShopifySyncBatch
    }
  
  export async function handleDunWaitlistShopifySyncCron(
    request: Request,
    dependencies: DunWaitlistShopifySyncCronDependencies =
      defaultDependencies
  ) {
    const authorized =
      hasValidCronAuthorization(
        request.headers.get('authorization'),
        dependencies.getCronSecret()
      )
  
    if (!authorized) {
      return Response.json(
        { ok: false },
        {
          headers: {
            'Cache-Control': 'no-store'
          },
          status: 401
        }
      )
    }
  
    const summary =
      await dependencies.runBatch({
        maxItems: CRON_BATCH_SIZE
      })
  
    return Response.json(
      {
        ...summary,
        ok: true
      },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
  
  export function GET(request: Request) {
    return handleDunWaitlistShopifySyncCron(
      request
    )
  }