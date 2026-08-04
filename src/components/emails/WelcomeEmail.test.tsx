import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NEWSLETTER_WELCOME_HTML,
  NEWSLETTER_WELCOME_SUBJECT,
  NEWSLETTER_WELCOME_TEXT
} from '@/lib/email/newsletterWelcomeBroadcastContent'

test('newsletter welcome content matches Resend broadcast markers', () => {
  assert.equal(
    NEWSLETTER_WELCOME_SUBJECT,
    '20 % på Comfyrobe™ – til deg som følger Utekos'
  )

  assert.match(NEWSLETTER_WELCOME_HTML, /STAYCOMFY/)
  assert.match(
    NEWSLETTER_WELCOME_HTML,
    /Spar totalt 890,80 kr på Comfyrobe™ med rabattkoden STAYCOMFY/
  )
  assert.match(
    NEWSLETTER_WELCOME_HTML,
    /kasse\.utekos\.no\/cart\/[^"]*discount=STAYCOMFY/
  )
  assert.match(
    NEWSLETTER_WELCOME_HTML,
    /href="mailto:kundeservice@utekos\.no\?subject=Avmelding%20fra%20nyhetsbrev"/
  )
  assert.doesNotMatch(
    NEWSLETTER_WELCOME_HTML,
    /RESEND_UNSUBSCRIBE_URL/
  )
  assert.doesNotMatch(NEWSLETTER_WELCOME_HTML, /align="left"/)
  assert.doesNotMatch(NEWSLETTER_WELCOME_HTML, /align:left/)
  assert.match(
    NEWSLETTER_WELCOME_HTML,
    /max-width:600px;align:center;width:100%;margin:0 auto/
  )

  assert.match(NEWSLETTER_WELCOME_TEXT, /STAYCOMFY/)
  assert.match(
    NEWSLETTER_WELCOME_TEXT,
    /kasse\.utekos\.no\/cart\/.*discount=STAYCOMFY/
  )
  assert.doesNotMatch(
    NEWSLETTER_WELCOME_TEXT,
    /RESEND_UNSUBSCRIBE_URL/
  )
})
