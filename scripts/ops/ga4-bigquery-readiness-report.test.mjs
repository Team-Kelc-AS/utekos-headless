import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGa4BigQueryReadinessReport,
  formatGa4BigQueryReadinessReport
} from './ga4-bigquery-readiness-report.mjs'

test('reports missing GA4 BigQuery dataset as a read-only critical gate', () => {
  const report = buildGa4BigQueryReadinessReport(
    { dataset: null, tables: [] },
    {
      generatedAt: '2026-07-08T20:50:00.000Z',
      projectId: 'project-c683eb2c-20ae-4ec2-ac3',
      datasetId: 'analytics_489598217',
      propertyId: '489598217'
    }
  )

  assert.equal(report.mode, 'read-only')
  assert.equal(report.mutationPerformed, false)
  assert.equal(report.ok, false)
  assert.equal(report.datasetExists, false)
  assert.deepEqual(
    report.alerts.map(alert => alert.code),
    ['ga4_bigquery_dataset_missing']
  )
})

test('passes when GA4 BigQuery dataset has daily events table', () => {
  const report = buildGa4BigQueryReadinessReport(
    {
      dataset: {
        id: 'project-c683eb2c-20ae-4ec2-ac3:analytics_489598217',
        datasetReference: {
          projectId: 'project-c683eb2c-20ae-4ec2-ac3',
          datasetId: 'analytics_489598217'
        },
        location: 'EU',
        creationTime: '1783540000000',
        lastModifiedTime: '1783543600000'
      },
      tables: [
        {
          tableReference: { tableId: 'events_20260708' },
          type: 'TABLE',
          creationTime: '1783543600000'
        }
      ]
    },
    { generatedAt: '2026-07-08T20:50:00.000Z' }
  )

  assert.equal(report.ok, true)
  assert.equal(report.datasetExists, true)
  assert.equal(report.dataset?.location, 'EU')
  assert.equal(report.tableSummary.eventTables, 1)
  assert.equal(
    report.tableSummary.latestEventTable,
    'events_20260708'
  )
  assert.deepEqual(report.alerts, [])
})

test('warns when dataset exists without GA4 event tables', () => {
  const report = buildGa4BigQueryReadinessReport(
    {
      dataset: {
        datasetReference: {
          projectId: 'project-c683eb2c-20ae-4ec2-ac3',
          datasetId: 'analytics_489598217'
        },
        location: 'EU'
      },
      tables: [
        { tableReference: { tableId: 'not_ga4' }, type: 'TABLE' }
      ]
    },
    { generatedAt: '2026-07-08T20:50:00.000Z' }
  )

  assert.equal(report.ok, false)
  assert.equal(report.datasetExists, true)
  assert.equal(report.tableSummary.totalTables, 1)
  assert.deepEqual(
    report.alerts.map(alert => alert.code),
    ['ga4_bigquery_events_tables_missing']
  )
})

test('formats deterministic readiness output', () => {
  const report = buildGa4BigQueryReadinessReport(
    { dataset: null, tables: [] },
    {
      generatedAt: '2026-07-08T20:50:00.000Z',
      projectId: 'project-c683eb2c-20ae-4ec2-ac3',
      datasetId: 'analytics_489598217',
      propertyId: '489598217'
    }
  )
  const output = formatGa4BigQueryReadinessReport(report)

  assert.match(output, /Utekos GA4 BigQuery readiness report/)
  assert.match(output, /Mutation performed: no/)
  assert.match(output, /CRITICAL ga4_bigquery_dataset_missing/)
})

test('reports concrete GA4 purchase-quality failures', () => {
  const report = buildGa4BigQueryReadinessReport({
    dataset: {
      datasetReference: {
        projectId: 'project-c683eb2c-20ae-4ec2-ac3',
        datasetId: 'analytics_489598217'
      },
      location: 'EU'
    },
    tables: [
      {
        tableReference: { tableId: 'events_20260723' },
        type: 'TABLE'
      }
    ],
    purchaseQualityTableSuffixes: [
      '20260721',
      '20260722',
      '20260723'
    ],
    purchaseQuality: {
      total_purchase_events: '8',
      missing_transaction_id: '2',
      missing_user_identifier: '2',
      missing_session_id: '4',
      duplicate_transaction_ids: '1',
      duplicate_purchase_events: '1',
      noncanonical_transaction_id: '1',
      missing_revenue: '2',
      missing_items: '2'
    }
  })

  assert.equal(report.ok, false)
  assert.deepEqual(
    report.alerts.map(alert => alert.code),
    [
      'ga4_purchase_transaction_id_missing',
      'ga4_purchase_user_identifier_missing',
      'ga4_purchase_session_id_missing',
      'ga4_purchase_transaction_id_duplicate',
      'ga4_purchase_transaction_id_noncanonical',
      'ga4_purchase_revenue_missing',
      'ga4_purchase_items_missing'
    ]
  )
  assert.equal(report.purchaseQuality?.totalPurchaseEvents, 8)
  assert.equal(
    report.purchaseQuality?.duplicatePurchaseEvents,
    1
  )
})

test('passes purchase-quality checks for canonical complete purchases', () => {
  const report = buildGa4BigQueryReadinessReport({
    dataset: {
      datasetReference: {
        projectId: 'project-c683eb2c-20ae-4ec2-ac3',
        datasetId: 'analytics_489598217'
      },
      location: 'EU'
    },
    tables: [
      {
        tableReference: { tableId: 'events_20260723' },
        type: 'TABLE'
      }
    ],
    purchaseQualityTableSuffixes: ['20260723'],
    purchaseQuality: {
      total_purchase_events: '2',
      missing_transaction_id: '0',
      missing_user_identifier: '0',
      missing_session_id: '0',
      duplicate_transaction_ids: '0',
      duplicate_purchase_events: '0',
      noncanonical_transaction_id: '0',
      missing_revenue: '0',
      missing_items: '0'
    }
  })

  assert.equal(report.ok, true)
  assert.deepEqual(report.alerts, [])
  assert.match(
    formatGa4BigQueryReadinessReport(report),
    /missing transaction_id: 0/
  )
})
