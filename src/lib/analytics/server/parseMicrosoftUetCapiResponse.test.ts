import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMicrosoftUetCapiResponse } from './parseMicrosoftUetCapiResponse'

test('projects Microsoft response evidence without attempted values', () => {
  const summary = parseMicrosoftUetCapiResponse(
    JSON.stringify({
      eventsReceived: 1,
      error: {
        code: 'ValidationError',
        message: 'Optional fields were removed',
        details: [
          {
            attemptedValue: 'sensitive-value',
            errorCode: 'InvalidUrl',
            errorMessage: 'referrerUrl must be a valid URL',
            index: 0,
            isWarning: true,
            propertyName: 'data[0].referrerUrl'
          }
        ]
      }
    })
  )

  assert.equal(summary.eventsReceived, 1)
  assert.equal(summary.validationErrors.length, 0)
  assert.deepEqual(summary.validationWarnings, [
    {
      errorCode: 'InvalidUrl',
      errorMessage: 'referrerUrl must be a valid URL',
      index: 0,
      propertyName: 'data[0].referrerUrl'
    }
  ])
  assert.doesNotMatch(JSON.stringify(summary), /sensitive-value/)
})

test('returns an explicit empty summary for empty or invalid bodies', () => {
  for (const responseText of ['', 'not-json', '[]']) {
    assert.deepEqual(parseMicrosoftUetCapiResponse(responseText), {
      eventsReceived: null,
      responseCode: null,
      responseMessage: null,
      validationErrors: [],
      validationWarnings: []
    })
  }
})
