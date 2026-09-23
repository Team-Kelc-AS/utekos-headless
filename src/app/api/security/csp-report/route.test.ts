import assert from 'node:assert/strict'
import test from 'node:test'
import { POST } from './route'

test('records production report-only CSP observations as info, not warnings', async () => {
  const originalInfo = console.info
  const originalWarn = console.warn
  const infoCalls: unknown[][] = []
  const warnCalls: unknown[][] = []
  console.info = (...arguments_) => {
    infoCalls.push(arguments_)
  }
  console.warn = (...arguments_) => {
    warnCalls.push(arguments_)
  }

  try {
    const response = await POST(
      new Request('https://utekos.no/api/security/csp-report', {
        body: JSON.stringify({
          'csp-report': {
            'blocked-uri': 'https://cdn.example.test/script.js',
            'document-uri': 'https://utekos.no/',
            disposition: 'report',
            'effective-directive': 'script-src-elem'
          }
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      })
    )

    assert.equal(response.status, 204)
    assert.equal(infoCalls.length, 1)
    assert.equal(infoCalls[0]?.[0], 'csp-report')
    assert.equal(warnCalls.length, 0)
  } finally {
    console.info = originalInfo
    console.warn = originalWarn
  }
})
