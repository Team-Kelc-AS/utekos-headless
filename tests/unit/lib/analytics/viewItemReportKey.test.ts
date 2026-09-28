import assert from 'node:assert/strict'
import test from 'node:test'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'

test('deduplicates one resolved product and variant context', () => {
  assert.equal(
    createViewItemReportKey('product-1', 'variant-1'),
    createViewItemReportKey('product-1', 'variant-1')
  )
})

test('treats a newly resolved variant context as a new view', () => {
  assert.notEqual(
    createViewItemReportKey('product-1', 'variant-1'),
    createViewItemReportKey('product-1', 'variant-2')
  )
})
