import * as React from 'react'
import { Body, Head, Html } from 'react-email'

import { NEWSLETTER_WELCOME_HTML } from '@/lib/email/newsletterWelcomeBroadcastContent'

interface WelcomeEmailProps {
  email?: string
}

function extractBroadcastBodyHtml(documentHtml: string): string {
  const match = documentHtml.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)
  return match?.[1] ?? documentHtml
}

const broadcastBodyHtml = extractBroadcastBodyHtml(
  NEWSLETTER_WELCOME_HTML
)

/**
 * Preview wrapper for `pnpm run email`.
 * Send path uses NEWSLETTER_WELCOME_HTML directly via sendWelcomeEmail.
 */
export function WelcomeEmail(_?: WelcomeEmailProps) {
  return (
    <Html lang='nb' dir='ltr'>
      <Head />
      <Body
        style={{
          margin: 0,
          backgroundColor: '#001211',
          color: '#f0eee9'
        }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: broadcastBodyHtml }}
        />
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  email: 'kunde@eksempel.no'
} satisfies WelcomeEmailProps

export default WelcomeEmail
