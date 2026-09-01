import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleProviderDispatchHealthCron,
  maxDuration
} from './route'

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/provider-dispatch-health',
    authorization ? { headers: { authorization } } : undefined
  )
}

function dependencies() {
  return {
    createRunId: () => '11111111-1111-4111-8111-111111111111',
    getCronSecret: () => 'correct-secret',
    getEnabled: () => undefined,
    getOrigin: () => 'https://utekos.no',
    now: () => new Date('2026-08-29T12:00:00.000Z'),
    reportStartFailure: () => undefined,
    startWorkflow: async () => ({ runId: 'workflow-run' })
  }
}

test('starts the durable five-minute guard within the cron duration', async () => {
  assert.equal(maxDuration, 60)
  let input: Record<string, string> | undefined
  const response = await handleProviderDispatchHealthCron(
    request('Bearer correct-secret'),
    {
      ...dependencies(),
      startWorkflow: async received => {
        input = received
        return { runId: 'workflow-run' }
      }
    }
  )

  assert.equal(response.status, 202)
  assert.deepEqual(input, {
    origin: 'https://utekos.no',
    requestedAt: '2026-08-29T12:00:00.000Z',
    runId: '11111111-1111-4111-8111-111111111111'
  })
  assert.deepEqual(await response.json(), {
    ok: true,
    enabled: true,
    launch_guard_run_id: '11111111-1111-4111-8111-111111111111',
    workflow_run_id: 'workflow-run'
  })
})

test('rejects requests without the configured cron secret', async () => {
  const response = await handleProviderDispatchHealthCron(
    request('Bearer wrong-secret'),
    dependencies()
  )

  assert.equal(response.status, 401)
})

test('supports an explicit kill switch without starting work', async () => {
  const response = await handleProviderDispatchHealthCron(
    request('Bearer correct-secret'),
    {
      ...dependencies(),
      getEnabled: () => 'false',
      startWorkflow: async () => {
        throw new Error('must not start')
      }
    }
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ok: true,
    enabled: false
  })
})

test('reports a workflow start failure before returning a visible 503', async () => {
  const captured: string[] = []
  const response = await handleProviderDispatchHealthCron(
    request('Bearer correct-secret'),
    {
      ...dependencies(),
      reportStartFailure: error => {
        captured.push(error instanceof Error ? error.message : 'unknown')
      },
      startWorkflow: async () => {
        throw new Error('unavailable')
      }
    }
  )

  assert.equal(response.status, 503)
  assert.deepEqual(captured, ['unavailable'])
})
