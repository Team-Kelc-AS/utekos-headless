import { metaCatalogWebhookPayloadSchema } from '@/lib/merchant-feeds/meta/metaCatalogWebhookPayloadSchema'
import { verifyMetaCatalogWebhookSignature } from '@/lib/merchant-feeds/meta/verifyMetaCatalogWebhookSignature'
import { verifyMetaCatalogWebhookToken } from '@/lib/merchant-feeds/meta/verifyMetaCatalogWebhookToken'

const MAX_WEBHOOK_BYTES = 1_000_000

export type MetaCatalogWebhookDependencies = {
  getAppSecret: () => string | undefined
  getVerifyToken: () => string | undefined
  log: (summary: {
    catalogIds: string[]
    changeCount: number
    entryCount: number
    fields: string[]
  }) => void
}

const defaultDependencies: MetaCatalogWebhookDependencies = {
  getAppSecret: () => process.env.META_APP_SECRET,
  getVerifyToken: () => process.env.META_CATALOG_WEBHOOK_VERIFY_TOKEN,
  log: summary => console.info('meta_catalog.webhook', summary)
}

export function handleMetaCatalogWebhookVerification(
  request: Request,
  dependencies: MetaCatalogWebhookDependencies = defaultDependencies
) {
  const url = new URL(request.url)
  const isSubscription = url.searchParams.get('hub.mode') === 'subscribe'
  const isValidToken = verifyMetaCatalogWebhookToken({
    expected: dependencies.getVerifyToken(),
    supplied: url.searchParams.get('hub.verify_token')
  })
  const challenge = url.searchParams.get('hub.challenge')

  if (!isSubscription || !isValidToken || !challenge) {
    return new Response('Forbidden', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  return new Response(challenge, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

export async function handleMetaCatalogWebhookEvent(
  request: Request,
  dependencies: MetaCatalogWebhookDependencies = defaultDependencies
) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)

  if (contentLength > MAX_WEBHOOK_BYTES) {
    return new Response('Payload Too Large', {
      status: 413,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  const payload = await request.text()

  if (Buffer.byteLength(payload) > MAX_WEBHOOK_BYTES) {
    return new Response('Payload Too Large', {
      status: 413,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  if (
    !verifyMetaCatalogWebhookSignature({
      appSecret: dependencies.getAppSecret(),
      payload,
      signature: request.headers.get('x-hub-signature-256')
    })
  ) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  let json: unknown

  try {
    json = JSON.parse(payload) as unknown
  } catch {
    return new Response('Bad Request', {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  const parsed = metaCatalogWebhookPayloadSchema.safeParse(json)

  if (!parsed.success) {
    return new Response('Bad Request', {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  const changes = parsed.data.entry.flatMap(entry => entry.changes)
  dependencies.log({
    catalogIds: [...new Set(parsed.data.entry.map(entry => entry.id))],
    entryCount: parsed.data.entry.length,
    changeCount: changes.length,
    fields: [...new Set(changes.map(change => change.field))]
  })

  return Response.json(
    { received: true },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleMetaCatalogWebhookVerification(request)
}

export function POST(request: Request) {
  return handleMetaCatalogWebhookEvent(request)
}
