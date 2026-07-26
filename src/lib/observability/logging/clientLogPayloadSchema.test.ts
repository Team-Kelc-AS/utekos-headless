import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clientLogPayloadSchema,
  sanitizeOperationalPathname,
  toAppLogInput
} from './clientLogPayloadSchema'

test('client log contract rejects free text, stacks and full URLs', () => {
  const result = clientLogPayloadSchema.safeParse({
    event: 'client_error',
    level: 'error',
    data: {
      source: 'window_error',
      message: 'customer@example.no',
      stack: 'secret stack'
    },
    context: {
      pathname: '/konto?email=customer@example.no',
      href: 'https://utekos.no/konto?email=customer@example.no'
    }
  })

  assert.equal(result.success, false)
})

test('client log contract keeps only a redacted pathname', () => {
  const parsed = clientLogPayloadSchema.parse({
    event: 'client_error',
    level: 'error',
    data: {
      source: 'window_error',
      line: 12,
      column: 4
    },
    context: {
      pathname: '/ordre/123456789?email=customer@example.no'
    }
  })

  const appLog = toAppLogInput(parsed)
  assert.deepEqual(appLog.context, { route: '/ordre/:dynamic' })
  assert.equal(JSON.stringify(appLog).includes('customer@example.no'), false)
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
