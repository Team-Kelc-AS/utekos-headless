import { NextResponse } from 'next/server'

import { executeCartCommandFromRoute } from '@/lib/actions/cart/executeCartCommandFromRoute'
import { addCartLinesRequestSchema } from '@/lib/cart/addCartLinesRequestSchema'

const NO_STORE_HEADERS = {
  'cache-control': 'private, no-store, max-age=0'
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Ugyldig forespørsel.',
        error: 'INVALID_REQUEST',
        cart: null
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const parsed = addCartLinesRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Ugyldig handlekurvdata.',
        error: 'INVALID_CART_INPUT',
        cart: null
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const result = await executeCartCommandFromRoute({
    type: 'add-lines',
    lines: parsed.data.lines,
    ...(parsed.data.discountCode ?
      { discountCode: parsed.data.discountCode }
    : {})
  })

  return NextResponse.json(result, {
    status: result.success ? 200 : 422,
    headers: NO_STORE_HEADERS
  })
}
