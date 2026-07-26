import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceQuickViewReportingState,
  initialQuickViewReportingState
} from './quickViewReportingState'

test('waits for a resolved product and variant before reporting an open', () => {
  const loading = advanceQuickViewReportingState(
    initialQuickViewReportingState,
    { isOpen: true, isResolved: false }
  )
  assert.equal(loading.reportSequence, null)

  const resolved = advanceQuickViewReportingState(
    loading.nextState,
    { isOpen: true, isResolved: true }
  )
  assert.equal(resolved.reportSequence, 1)

  const rerender = advanceQuickViewReportingState(
    resolved.nextState,
    { isOpen: true, isResolved: true }
  )
  assert.equal(rerender.reportSequence, null)
})

test('failed loading reports nothing and a later successful open gets a new sequence', () => {
  const failedOpen = advanceQuickViewReportingState(
    initialQuickViewReportingState,
    { isOpen: true, isResolved: false }
  )
  const closed = advanceQuickViewReportingState(
    failedOpen.nextState,
    { isOpen: false, isResolved: false }
  )
  const reopened = advanceQuickViewReportingState(
    closed.nextState,
    { isOpen: true, isResolved: true }
  )

  assert.equal(failedOpen.reportSequence, null)
  assert.equal(closed.reportSequence, null)
  assert.equal(reopened.reportSequence, 2)
})
