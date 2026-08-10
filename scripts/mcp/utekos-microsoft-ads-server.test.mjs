import assert from 'node:assert/strict'
import test from 'node:test'

import { createUtekosMicrosoftAdsMcpServer } from './utekos-microsoft-ads-server.mjs'

const config = {
  environment: 'production',
  developerToken: 'developer-token',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  refreshToken: 'refresh-token',
  customerId: '254835341',
  accountId: '188365141',
  masterAccountId: '188445594'
}

test('creates and reuses a separate audit cache for each account', async () => {
  const collectedAccountIds = []
  const operator = createUtekosMicrosoftAdsMcpServer({
    loadConfig: () => config,
    collectAudit: async ({ config: selectedConfig }) => {
      collectedAccountIds.push(selectedConfig.accountId)
      return { accountId: selectedConfig.accountId }
    }
  })

  await operator.getAuditCache().get()
  await operator.getAuditCache('188445594').get()
  await operator.getAuditCache('188445594').get()

  assert.deepEqual(collectedAccountIds, ['188365141', '188445594'])
  assert.equal(operator.auditCaches.size, 2)
})

test('rejects an account that is not explicitly configured', () => {
  const operator = createUtekosMicrosoftAdsMcpServer({
    loadConfig: () => config
  })

  assert.throws(
    () => operator.getAuditCache('999999999'),
    /not in the configured account allowlist/
  )
})
