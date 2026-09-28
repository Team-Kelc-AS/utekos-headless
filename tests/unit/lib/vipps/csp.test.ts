import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildReportOnlyCsp } from '@/lib/security/buildReportOnlyCsp'

test('Vipps widget and payment origins are scoped to their report-only directives', () => {
  const policy = buildReportOnlyCsp()
  assert.match(policy, /script-src[^;]*https:\/\/cdn\.vippsmobilepay\.com/)
  assert.match(policy, /frame-src[^;]*https:\/\/pay\.vipps\.no/)
  assert.match(policy, /frame-src[^;]*https:\/\/apitest\.vipps\.no/)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /base-uri 'self'/)
  assert.doesNotMatch(policy, /https:\/\/\*\.vipps/)
})
