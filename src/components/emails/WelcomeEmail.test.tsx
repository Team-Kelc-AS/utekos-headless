import assert from 'node:assert/strict'
import test from 'node:test'

import { render } from '@react-email/render'

import { WelcomeEmail } from '@/components/emails/WelcomeEmail'

test('renders canonical public images and a clickable Comfyrobe CTA', async () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

  try {
    const html = await render(
      <WelcomeEmail email='kunde@eksempel.no' />
    )

    assert.match(
      html,
      /src="https:\/\/utekos\.no\/icon\.png\?v=staycomfy-v2"/
    )
    assert.match(
      html,
      /src="https:\/\/utekos\.no\/WelcomeMailComfy\.jpg\?v=staycomfy-v2"/
    )
    assert.match(
      html,
      /href="https:\/\/utekos\.no\/comfyrobe\?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=staycomfy"[^>]*target="_blank"/
    )
    assert.doesNotMatch(html, /localhost:3000/)
  } finally {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
    }
  }
})
