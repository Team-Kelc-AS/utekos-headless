import assert from 'node:assert/strict'
import test from 'node:test'
import { protos } from '@google-ads/datamanager'
import {
  readGoogleDataManagerConfig,
  sendGoogleDataManagerEvent,
  type GoogleDataManagerIngestionClient
} from '@/lib/analytics/server/sendGoogleDataManagerEvent'

const {
  Consent,
  ConsentStatus,
  Encoding: DataManagerEncoding,
  Event: DataManagerEvent,
  IngestEventsRequest,
  ProductAccount
} = protos.google.ads.datamanager.v1

function dataManagerEvent() {
  return DataManagerEvent.create({
    clientId: '97245370.1784201643',
    consent: Consent.create({
      adPersonalization: ConsentStatus.CONSENT_DENIED,
      adUserData: ConsentStatus.CONSENT_DENIED
    }),
    eventName: 'view_item'
  })
}

test('reads a fail-safe Data Manager configuration', () => {
  assert.deepEqual(
    readGoogleDataManagerConfig({
      GOOGLE_ANALYTICS_PROPERTY_ID: ' 123456789 '
    }),
    { propertyId: '123456789', validateOnly: true }
  )

  assert.deepEqual(
    readGoogleDataManagerConfig({
      GOOGLE_ANALYTICS_PROPERTY_ID: '123456789',
      GOOGLE_DATA_MANAGER_VALIDATE_ONLY: 'false'
    }),
    { propertyId: '123456789', validateOnly: false }
  )
})

test('rejects missing or invalid Data Manager configuration', () => {
  assert.throws(
    () => readGoogleDataManagerConfig({}),
    /GOOGLE_ANALYTICS_PROPERTY_ID/
  )

  assert.throws(
    () =>
      readGoogleDataManagerConfig({
        GOOGLE_ANALYTICS_PROPERTY_ID: 'G-FCES3L0M9M'
      }),
    /numeric/
  )

  assert.throws(
    () =>
      readGoogleDataManagerConfig({
        GOOGLE_ANALYTICS_PROPERTY_ID: '123456789',
        GOOGLE_DATA_MANAGER_VALIDATE_ONLY: 'yes'
      }),
    /GOOGLE_DATA_MANAGER_VALIDATE_ONLY/
  )
})

test('sends one event to the configured GA4 destination', async () => {
  let capturedRequest:
    | protos.google.ads.datamanager.v1.IIngestEventsRequest
    | undefined

  let capturedTimeout: number | undefined

  const client: GoogleDataManagerIngestionClient = {
    ingestEvents: async (request, options) => {
      capturedRequest = request
      capturedTimeout = options.timeout

      return [{ requestId: 'google-request-1' }]
    },
    retrieveRequestStatus: async () => [
      { requestStatusPerDestination: [] }
    ]
  }

  const event = dataManagerEvent()

  const result = await sendGoogleDataManagerEvent(
    event,
    { propertyId: '123456789', validateOnly: false },
    { createClient: () => client }
  )

  assert.equal(capturedTimeout, 10_000)
  assert.ok(capturedRequest)
  assert.equal(IngestEventsRequest.verify(capturedRequest), null)

  assert.deepEqual(
    IngestEventsRequest.toObject(
      IngestEventsRequest.create(capturedRequest),
      { defaults: false, enums: String }
    ),
    {
      consent: {
        adPersonalization: 'CONSENT_DENIED',
        adUserData: 'CONSENT_DENIED'
      },
      destinations: [
        {
          loginAccount: {
            accountId: '123456789',
            accountType: 'GOOGLE_ANALYTICS_PROPERTY'
          },
          operatingAccount: {
            accountId: '123456789',
            accountType: 'GOOGLE_ANALYTICS_PROPERTY'
          },
          productDestinationId: 'G-FCES3L0M9M'
        }
      ],
      encoding: 'HEX',
      events: [
        {
          clientId: '97245370.1784201643',
          consent: {
            adPersonalization: 'CONSENT_DENIED',
            adUserData: 'CONSENT_DENIED'
          },
          eventName: 'view_item'
        }
      ],
      validateOnly: false
    }
  )

  assert.deepEqual(result, {
    requestId: 'google-request-1',
    validateOnly: false
  })

  assert.equal(
    ProductAccount.AccountType.GOOGLE_ANALYTICS_PROPERTY,
    capturedRequest.destinations?.[0]?.operatingAccount
      ?.accountType
  )

  assert.equal(capturedRequest.encoding, DataManagerEncoding.HEX)
})

test('allows a validation response without a request ID', async () => {
  const client: GoogleDataManagerIngestionClient = {
    ingestEvents: async () => [{}],
    retrieveRequestStatus: async () => [
      { requestStatusPerDestination: [] }
    ]
  }

  const result = await sendGoogleDataManagerEvent(
    dataManagerEvent(),
    { propertyId: '123456789', validateOnly: true },
    { createClient: () => client }
  )

  assert.deepEqual(result, { validateOnly: true })
})

test('fails closed when event-level consent is missing', async () => {
  let requestCount = 0

  const client: GoogleDataManagerIngestionClient = {
    ingestEvents: async () => {
      requestCount += 1

      return [{ requestId: 'unexpected' }]
    },
    retrieveRequestStatus: async () => [
      { requestStatusPerDestination: [] }
    ]
  }

  await assert.rejects(
    sendGoogleDataManagerEvent(
      DataManagerEvent.create({
        clientId: '97245370.1784201643',
        eventName: 'view_item'
      }),
      { propertyId: '123456789', validateOnly: false },
      { createClient: () => client }
    ),
    /event-level consent/
  )

  assert.equal(requestCount, 0)
})

test('rejects an executed response without a request ID', async () => {
  const client: GoogleDataManagerIngestionClient = {
    ingestEvents: async () => [{}],
    retrieveRequestStatus: async () => [
      { requestStatusPerDestination: [] }
    ]
  }

  await assert.rejects(
    sendGoogleDataManagerEvent(
      dataManagerEvent(),
      { propertyId: '123456789', validateOnly: false },
      { createClient: () => client }
    ),
    /requestId/
  )
})
