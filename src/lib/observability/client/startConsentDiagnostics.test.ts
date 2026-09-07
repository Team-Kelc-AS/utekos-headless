import assert from 'node:assert/strict'
import test from 'node:test'
import { startConsentDiagnostics } from './startConsentDiagnostics'
import type { ConsentDiagnosticCode } from 'types/observability/log/ConsentDiagnosticCode'

test('distinguishes unavailable CMP, visible dialog and real decision without inferring consent', () => {
  const target = new EventTarget()
  const timers: (() => void)[] = []
  let state: { hasResponse?: boolean } | undefined
  let visible = false
  const codes: ConsentDiagnosticCode[] = []
  const cleanup = startConsentDiagnostics({
    target,
    getState: () => state,
    isDialogVisible: () => visible,
    report: code => {
      codes.push(code)
    },
    schedule: ((callback: () => void) => {
      timers.push(callback)
      return timers.length
    }) as unknown as typeof setTimeout,
    cancel: () => {}
  })
  timers[0]?.()
  assert.deepEqual(codes, [])
  timers.at(-1)?.()
  assert.deepEqual(codes, ['cmp_unavailable'])
  state = { hasResponse: false }
  target.dispatchEvent(new Event('CookiebotOnConsentReady'))
  assert.equal(codes.at(-1), 'awaiting_decision')
  visible = true
  timers[1]?.()
  assert.equal(codes.at(-1), 'dialog_visible')
  state.hasResponse = true
  target.dispatchEvent(new Event('CookiebotOnDecline'))
  assert.equal(codes.at(-1), 'decision_observed')
  cleanup()
  const count = codes.length
  target.dispatchEvent(new Event('CookiebotOnAccept'))
  assert.equal(codes.length, count)
})
