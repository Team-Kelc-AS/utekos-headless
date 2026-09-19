import { cookies } from 'next/headers'

export async function POST(request: Request) {
  if (
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return new Response(null, { status: 403 })
  const jar = await cookies()
  jar.set('__Host-canonical-control', '', {
    maxAge: 0,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  })
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'private, no-store' }
  })
}
