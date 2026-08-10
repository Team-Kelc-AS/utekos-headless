import assert from 'node:assert/strict'
import test from 'node:test'

import { createMicrosoftAdsCampaignManagementClient } from './campaign-management.mjs'

const config = {
  environment: 'production',
  developerToken: 'developer-token',
  customerId: '254835341',
  accountId: '188365141'
}

function createClient(calls, response) {
  return createMicrosoftAdsCampaignManagementClient({
    config,
    accessToken: 'access-token',
    fetchImpl: async (url, init) => {
      calls.push({
        body: JSON.parse(String(init.body)),
        method: init.method,
        url: String(url)
      })

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }
  })
}

test('updates only validated conversion goal objects', async () => {
  const calls = []
  const client = createClient(calls, { PartialErrors: [] })

  const result = await client.updateConversionGoals([
    {
      Id: '47546689',
      Type: 'Event',
      ActionExpression: 'begin_checkout',
      ActionOperator: 'Equals',
      ExcludeFromBidding: true
    }
  ])

  assert.deepEqual(result.PartialErrors, [])
  assert.equal(calls[0]?.method, 'PUT')
  assert.match(calls[0]?.url ?? '', /\/ConversionGoals$/)
  assert.equal(
    calls[0]?.body.ConversionGoals[0].ActionExpression,
    'begin_checkout'
  )
})

test('adds a typed conversion goal and returns its provider id', async () => {
  const calls = []
  const client = createClient(calls, {
    ConversionGoalIds: ['47560001'],
    PartialErrors: []
  })

  const result = await client.addConversionGoals([
    {
      Type: 'Event',
      Name: 'Purchase – CanonicalEvent',
      GoalCategory: 'Purchase',
      ActionExpression: 'purchase',
      ActionOperator: 'Equals',
      TagId: '97247724'
    }
  ])

  assert.deepEqual(result.ConversionGoalIds, ['47560001'])
  assert.equal(calls[0]?.method, 'POST')
  assert.match(calls[0]?.url ?? '', /\/ConversionGoals$/)
  assert.equal(
    calls[0]?.body.ConversionGoals[0].ActionExpression,
    'purchase'
  )
})

test('rejects a conversion goal without the required provider category', () => {
  const calls = []
  const client = createClient(calls, {
    ConversionGoalIds: [],
    PartialErrors: []
  })

  assert.throws(
    () =>
      client.addConversionGoals([
        {
          Type: 'Event',
          Name: 'Purchase without category',
          ActionExpression: 'purchase',
          TagId: '97247724'
        }
      ]),
    /Invalid input/
  )
  assert.equal(calls.length, 0)
})

test('rejects an update without a goal id before network I/O', () => {
  const calls = []
  const client = createClient(calls, { PartialErrors: [] })

  assert.throws(
    () =>
      client.updateConversionGoals([
        { Type: 'Event', Status: 'Paused' }
      ]),
    /Invalid input/
  )
  assert.equal(calls.length, 0)
})
