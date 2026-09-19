import { handleAuth } from '@workos-inc/authkit-nextjs'
import { controlAuthConfig } from '@/lib/canonical-control/controlAuthConfig'
import { isControlOperator } from '@/lib/canonical-control/isControlOperator'
import { cookies } from 'next/headers'

export const GET = handleAuth({
  baseURL: 'https://utekos.no',
  returnPathname: '/canonical-control',
  onSuccess: session => {
    const config = controlAuthConfig()
    if (
      !config.success ||
      !isControlOperator(session, {
        userId: config.data.CANONICAL_CONTROL_USER_ID,
        organizationId: config.data.WORKOS_ORGANIZATION_ID
      })
    )
      throw new Error('CONTROL_ACCESS_DENIED')
  },
  onError: async () => {
    const jar = await cookies()
    jar.set('__Host-canonical-control', '', {
      maxAge: 0,
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    })
    return Response.json(
      {
        error: 'CONTROL_LOGIN_FAILED',
        message:
          'Innlogging kunne ikke fullføres. Kun godkjent operatør har tilgang.'
      },
      {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store' }
      }
    )
  }
})
