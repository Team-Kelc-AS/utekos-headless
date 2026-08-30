import { z } from 'zod'
import { canonicalAddToCartSchema } from '@/lib/analytics/addToCartEvent'
import { canonicalBeginCheckoutSchema } from '@/lib/analytics/beginCheckoutEvent'
import { canonicalPageViewSchema } from '@/lib/analytics/pageViewEvent'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'

const noStoreHeaders = { 'Cache-Control': 'no-store' } as const

const launchGuardContractProbeSchema = z.strictObject({
  contract: z.enum([
    'page_view',
    'add_to_cart',
    'begin_checkout'
  ])
})

const collectorContracts = {
  page_view: canonicalPageViewSchema,
  add_to_cart: canonicalAddToCartSchema,
  begin_checkout: canonicalBeginCheckoutSchema
} as const

type Dependencies = { getCronSecret: () => string | undefined }

const defaultDependencies: Dependencies = {
  getCronSecret: () => process.env.CRON_SECRET
}

export async function handleLaunchGuardContractProbe(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  if (
    !hasValidCronAuthorization(
      request.headers.get('authorization'),
      dependencies.getCronSecret()
    )
  ) {
    return Response.json(
      { ok: false },
      { status: 401, headers: noStoreHeaders }
    )
  }

  if (
    request.headers.get('x-utekos-automation') !== 'synthetic'
  ) {
    return Response.json(
      { ok: false },
      { status: 403, headers: noStoreHeaders }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { ok: false, error: 'invalid_probe_contract' },
      { status: 400, headers: noStoreHeaders }
    )
  }

  const input = launchGuardContractProbeSchema.safeParse(body)
  if (!input.success) {
    return Response.json(
      { ok: false, error: 'invalid_probe_contract' },
      { status: 400, headers: noStoreHeaders }
    )
  }

  const acceptsInvalidFixture = collectorContracts[
    input.data.contract
  ].safeParse({}).success

  if (acceptsInvalidFixture) {
    return Response.json(
      { ok: false, error: 'invalid_fixture_accepted' },
      { status: 500, headers: noStoreHeaders }
    )
  }

  return Response.json(
    { ok: true, result: 'invalid_contract_rejected' },
    { status: 200, headers: noStoreHeaders }
  )
}

export function POST(request: Request) {
  return handleLaunchGuardContractProbe(request)
}
