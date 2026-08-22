import {
  unsubscribeAbandonedCheckoutRecoveryCustomer
} from '@/lib/email/abandonedCheckoutRecovery/unsubscribeAbandonedCheckoutRecoveryCustomer'
import {
  verifyAbandonedCheckoutRecoveryUnsubscribeToken
} from '@/lib/email/abandonedCheckoutRecovery/abandonedCheckoutRecoveryUnsubscribeToken'

type Dependencies = {
  verifyToken: (token: string) => {
    shopifyCustomerId: string
  }
  unsubscribe: (input: {
    shopifyCustomerId: string
  }) => Promise<unknown>
}

const defaultDependencies: Dependencies = {
  verifyToken:
    verifyAbandonedCheckoutRecoveryUnsubscribeToken,
  unsubscribe: unsubscribeAbandonedCheckoutRecoveryCustomer
}

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    'default-src \'none\'; form-action \'self\'; base-uri \'none\'; frame-ancestors \'none\'',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
} as const

function getToken(request: Request): string | null {
  const token = new URL(request.url).searchParams.get('token')

  return token && token.length <= 2048 ? token : null
}

function invalidTokenResponse() {
  return new Response('Ugyldig eller utløpt avmeldingslenke.', {
    status: 400,
    headers: {
      ...responseHeaders,
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

export async function handleAbandonedCheckoutRecoveryUnsubscribeGet(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  const token = getToken(request)

  if (!token) {
    return invalidTokenResponse()
  }

  try {
    dependencies.verifyToken(token)
  } catch {
    return invalidTokenResponse()
  }

  const action = new URL(request.url)
  action.hash = ''
  const safeAction = action.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  return new Response(
    [
      '<!doctype html><html lang="nb"><head>',
      '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>Meld deg av</title></head><body>',
      '<main><h1>Meld deg av</h1>',
      '<p>Bekreft at du ikke vil motta flere e-poster om forlatte handlekurver.</p>',
      `<form method="post" action="${safeAction}"><button type="submit">Meld meg av</button></form>`,
      '</main></body></html>'
    ].join(''),
    {
      headers: {
        ...responseHeaders,
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  )
}

export async function handleAbandonedCheckoutRecoveryUnsubscribePost(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  const token = getToken(request)

  if (!token) {
    return invalidTokenResponse()
  }

  let verified: { shopifyCustomerId: string }

  try {
    verified = dependencies.verifyToken(token)
  } catch {
    return invalidTokenResponse()
  }

  try {
    await dependencies.unsubscribe({
      shopifyCustomerId: verified.shopifyCustomerId
    })
  } catch {
    return new Response(null, {
      status: 503,
      headers: responseHeaders
    })
  }

  return new Response(null, {
    status: 200,
    headers: responseHeaders
  })
}

export function GET(request: Request) {
  return handleAbandonedCheckoutRecoveryUnsubscribeGet(request)
}

export function POST(request: Request) {
  return handleAbandonedCheckoutRecoveryUnsubscribePost(request)
}
