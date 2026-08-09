import { unsubscribeAbandonedCheckoutRecovery } from '@/lib/email/abandonedCheckoutRecovery/unsubscribeAbandonedCheckoutRecovery'

function noStoreResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  let token = url.searchParams.get('token')
  let redirect = false

  if (!token) {
    const formData = await request.formData()
    const formToken = formData.get('token')
    token = typeof formToken === 'string' ? formToken : null
    redirect = formData.get('redirect') === '1'
  }

  if (!token) {
    return noStoreResponse({ ok: false }, 400)
  }

  try {
    await unsubscribeAbandonedCheckoutRecovery(token)

    if (redirect) {
      return Response.redirect(
        new URL('/avmelding?status=success', request.url),
        303
      )
    }

    return noStoreResponse({ ok: true }, 200)
  } catch (error) {
    if (redirect) {
      return Response.redirect(
        new URL('/avmelding?status=error', request.url),
        303
      )
    }

    const message = error instanceof Error ? error.message : ''
    const status =
      message.endsWith('_token_invalid') ||
      message.endsWith('_dispatch_invalid') ?
        400
      : 503

    return noStoreResponse({ ok: false }, status)
  }
}
