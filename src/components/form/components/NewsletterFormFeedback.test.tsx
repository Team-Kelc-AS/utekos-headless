import assert from 'node:assert/strict'
import test from 'node:test'

import { renderToStaticMarkup } from 'react-dom/server'

import { NewsletterFormFeedback } from '@/components/form/components/NewsletterFormFeedback'

test('renders a persistent accessible newsletter success message', () => {
  const html = renderToStaticMarkup(
    <NewsletterFormFeedback
      state={{
        status: 'success',
        message: 'Rabattmailen er på vei.'
      }}
    />
  )

  assert.match(html, /role="status"/)
  assert.match(html, /aria-live="polite"/)
  assert.match(html, /Rabattmailen er på vei\./)
})

test('renders newsletter errors as an alert', () => {
  const html = renderToStaticMarkup(
    <NewsletterFormFeedback
      state={{ status: 'error', message: 'Prøv igjen.' }}
    />
  )

  assert.match(html, /role="alert"/)
  assert.match(html, /Prøv igjen\./)
})

test('explains when the email address is already registered', () => {
  const html = renderToStaticMarkup(
    <NewsletterFormFeedback
      state={{
        status: 'error',
        message:
          'Denne e-postadressen er allerede registrert. Rabattmailen er sendt tidligere.'
      }}
    />
  )

  assert.match(html, /role="alert"/)
  assert.match(html, /allerede registrert/)
  assert.doesNotMatch(html, /Vi klarte ikke å sende/)
})
