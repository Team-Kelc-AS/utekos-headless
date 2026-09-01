import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clientLogPayloadSchema,
  sanitizeOperationalPathname,
  toAppLogInput
} from './clientLogPayloadSchema'

test('client log contract rejects email-like messages, stacks and full URLs', () => {
  const emailMessage = clientLogPayloadSchema.safeParse({
    event: 'client_error',
    level: 'error',
    data: {
      source: 'window_error',
      message: 'customer@example.no'
    },
    context: {
      pathname: '/konto'
    }
  })
  assert.equal(emailMessage.success, false)

  const withStack = clientLogPayloadSchema.safeParse({
    event: 'client_error',
    level: 'error',
    data: {
      source: 'window_error',
      message: 'ChunkLoadError',
      stack: 'secret stack'
    },
    context: {
      pathname: '/konto?email=customer@example.no',
      href: 'https://utekos.no/konto?email=customer@example.no'
    }
  })
  assert.equal(withStack.success, false)
})

test('client log contract keeps only a redacted pathname and sanitized triage fields', () => {
  const parsed = clientLogPayloadSchema.parse({
    event: 'client_error',
    level: 'error',
    data: {
      source: 'window_error',
      message: 'ChunkLoadError: Failed to load chunk',
      filename:
        'https://utekos.no/_next/static/chunks/app.js?dpl=secret',
      line: 12,
      column: 4
    },
    context: {
      pathname: '/ordre/123456789?email=customer@example.no'
    }
  })

  const appLog = toAppLogInput(parsed)
  assert.deepEqual(appLog.context, { route: '/ordre/:dynamic' })
  assert.equal(parsed.event, 'client_error')
  assert.equal(
    parsed.data.source === 'window_error' ?
      parsed.data.message
    : undefined,
    'ChunkLoadError: Failed to load chunk'
  )
  assert.equal(
    parsed.data.source === 'window_error' ?
      parsed.data.filename
    : undefined,
    '/_next/static/chunks/app.js'
  )
  assert.equal(JSON.stringify(appLog).includes('customer@example.no'), false)
  assert.equal(JSON.stringify(appLog).includes('dpl=secret'), false)
})

test('unhandled rejection contract keeps sanitized first-party triage', () => {
  const parsed = clientLogPayloadSchema.parse({
    event: 'client_unhandled_rejection',
    level: 'error',
    data: {
      source: 'unhandled_rejection',
      errorName: 'ZodError',
      reasonType: 'object',
      reasonIsError: true,
      message: 'Invalid product selection'
    },
    context: { pathname: '/comfyrobe?msclkid=secret' }
  })

  assert.deepEqual(toAppLogInput(parsed), {
    event: 'client.unhandled_rejection',
    level: 'ERROR',
    data: parsed.data,
    context: { route: '/comfyrobe' }
  })

  assert.equal(
    clientLogPayloadSchema.safeParse({
      ...parsed,
      data: { ...parsed.data, errorName: 'Customer customer@example.no' }
    }).success,
    false
  )

  assert.equal(
    clientLogPayloadSchema.safeParse({
      ...parsed,
      data: {
        ...parsed.data,
        message: 'Customer customer@example.no'
      }
    }).success,
    false
  )
})

test('operational pathname sanitizer removes query and risky segments', () => {
  assert.equal(
    sanitizeOperationalPathname('/produkter/utekos-dun?gclid=secret'),
    '/produkter/utekos-dun'
  )
  assert.equal(
    sanitizeOperationalPathname('/kunde/customer%40example.no'),
    '/kunde/:dynamic'
  )
})
