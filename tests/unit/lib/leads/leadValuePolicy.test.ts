import assert from 'node:assert/strict'
import test from 'node:test'
import { LEAD_FORM_IDS } from '@/lib/leads/leadFormIds'
import {
  LEAD_VALUE_POLICY,
  monetaryValueForLead
} from '@/lib/leads/leadValuePolicy'

test('the value policy covers every canonical Lead producer with positive NOK values', () => {
  const formIds = Object.values(LEAD_FORM_IDS).sort()
  const valuedFormIds = Object.keys(LEAD_VALUE_POLICY.values).sort()

  assert.deepEqual(valuedFormIds, formIds)
  assert.match(LEAD_VALUE_POLICY.currency, /^[A-Z]{3}$/)
  assert.equal(LEAD_VALUE_POLICY.currency, 'NOK')

  for (const formId of formIds) {
    const monetaryValue = monetaryValueForLead(formId)

    assert.equal(monetaryValue.currency, 'NOK')
    assert.equal(Number.isFinite(monetaryValue.value), true)
    assert.ok(monetaryValue.value > 0)
  }
})

test('the current model is versioned and backed by mature attributed cohorts', () => {
  assert.equal(LEAD_VALUE_POLICY.attributionWindowDays, 30)
  assert.match(
    LEAD_VALUE_POLICY.version,
    /^2026-09-28-net-revenue-30d-v1$/
  )

  assert.deepEqual(
    LEAD_VALUE_POLICY.values[LEAD_FORM_IDS.newsletterSignup],
    {
      value: 396.61,
      maturedLeads: 66,
      attributedPurchases: 18
    }
  )
  assert.deepEqual(
    LEAD_VALUE_POLICY.values[
      LEAD_FORM_IDS.productWaitlistUtekosDun
    ],
    {
      value: 415.65,
      maturedLeads: 19,
      attributedPurchases: 3
    }
  )
})
