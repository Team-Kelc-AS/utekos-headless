import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCspReport } from './parseCspReport'

test('keeps only directive and hosts from a CSP report', () => {
  assert.deepEqual(parseCspReport({
    'csp-report': {
      'effective-directive': 'connect-src',
      'blocked-uri': 'https://example.com/path?token=secret',
      'document-uri': 'https://utekos.no/checkout?email=hidden',
      'script-sample': 'sensitive source'
    }
  }), {
    directive: 'connect-src',
    blockedHost: 'example.com',
    documentHost: 'utekos.no',
    disposition: 'report'
  })
})

test('never reflects invalid attacker strings containing personal data or secrets', () => {
  const report = parseCspReport({
    'csp-report': {
      'effective-directive': 'connect-src\nemail@example.com',
      'blocked-uri': 'email@example.com phone +4712345678 token=super-secret',
      'document-uri': 'javascript:email@example.com',
      disposition: 'report\nsecret=hidden'
    }
  })

  assert.deepEqual(report, {
    directive: 'unknown',
    blockedHost: 'invalid-uri',
    documentHost: 'non-http-scheme',
    disposition: 'report'
  })
  assert.doesNotMatch(JSON.stringify(report), /example|4712345678|super-secret|hidden/)
})

test('preserves standardized CSP blocked-resource tokens without treating them as malformed URLs', () => {
  for (const blockedResource of [
    'eval',
    'inline',
    'trusted-types-policy',
    'trusted-types-sink',
    'wasm-eval'
  ]) {
    const report = parseCspReport({
      'csp-report': {
        'effective-directive': 'script-src',
        'blocked-uri': blockedResource,
        'document-uri': 'https://utekos.no/'
      }
    })

    assert.equal(report.blockedHost, blockedResource)
  }
})
