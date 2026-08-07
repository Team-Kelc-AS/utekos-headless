import { protos } from '@google-ads/datamanager'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import { GA_MEASUREMENT_ID } from '../../../api/constants/monitoring'
import {
  createGoogleDataManagerIngestionClient,
  type GoogleDataManagerIngestionClient
} from './createGoogleDataManagerIngestionClient'

export type {
  GoogleDataManagerIngestionClient
} from './createGoogleDataManagerIngestionClient'

const GOOGLE_DATA_MANAGER_TIMEOUT_MS = 10_000

const {
  Destination,
  Encoding: DataManagerEncoding,
  IngestEventsRequest,
  ProductAccount
} = protos.google.ads.datamanager.v1

type Environment = Readonly<
  Record<string, string | undefined>
>

export type GoogleDataManagerConfig = {
  propertyId: string
  validateOnly: boolean
}

type GoogleDataManagerSenderDependencies = {
  createClient:
    () => GoogleDataManagerIngestionClient
}

export type GoogleDataManagerSendResult = {
  requestId?: string
  validateOnly: boolean
}

let cachedClient:
  | GoogleDataManagerIngestionClient
  | undefined

const defaultDependencies:
  GoogleDataManagerSenderDependencies = {
    createClient: () => {
      cachedClient ??=
        createGoogleDataManagerIngestionClient()

      return cachedClient
    }
  }

function requiredEnvironmentValue(
  environment: Environment,
  name: string
) {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required Google Data Manager configuration: ${name}`
    )
  }

  return value
}

function readValidateOnly(
  environment: Environment
) {
  const value =
    environment
      .GOOGLE_DATA_MANAGER_VALIDATE_ONLY
      ?.trim()
      .toLowerCase()

  if (!value) return true
  if (value === 'true') return true
  if (value === 'false') return false

  throw new Error(
    'GOOGLE_DATA_MANAGER_VALIDATE_ONLY must be true or false'
  )
}

export function readGoogleDataManagerConfig(
  environment: Environment = process.env
): GoogleDataManagerConfig {
  const propertyId = requiredEnvironmentValue(
    environment,
    'GOOGLE_ANALYTICS_PROPERTY_ID'
  )

  if (!/^\d+$/.test(propertyId)) {
    throw new Error(
      'GOOGLE_ANALYTICS_PROPERTY_ID must be numeric'
    )
  }

  return {
    propertyId,
    validateOnly:
      readValidateOnly(environment)
  }
}

export async function sendGoogleDataManagerEvent(
  event:
    protos.google.ads.datamanager.v1.Event,
  config: GoogleDataManagerConfig,
  dependencies:
    GoogleDataManagerSenderDependencies =
      defaultDependencies
): Promise<GoogleDataManagerSendResult> {
  if (!event.consent) {
    throw new Error(
      'Google Data Manager event-level consent is required'
    )
  }

  const analyticsPropertyAccount =
    ProductAccount.create({
      accountId: config.propertyId,
      accountType:
        ProductAccount.AccountType
          .GOOGLE_ANALYTICS_PROPERTY
    })

  const destination = Destination.create({
    loginAccount: analyticsPropertyAccount,
    operatingAccount: analyticsPropertyAccount,
    productDestinationId:
      GA_MEASUREMENT_ID
  })

  const request =
    IngestEventsRequest.create({
      consent: event.consent,
      destinations: [destination],
      encoding:
        DataManagerEncoding.HEX,
      events: [event],
      validateOnly:
        config.validateOnly
    })

  const validationError =
    IngestEventsRequest.verify(request)

  if (validationError) {
    throw new Error(
      `Invalid Google Data Manager request: ${validationError}`
    )
  }

  const [response] = await startAnalyticsSpan(
    {
      name: 'Google Data Manager ingestEvents',
      op: 'rpc.client',
      attributes: {
        'rpc.system': 'grpc',
        'rpc.service':
          'google.ads.datamanager.v1.IngestionService',
        'rpc.method': 'ingestEvents',
        validate_only: config.validateOnly
      }
    },
    () =>
      dependencies.createClient().ingestEvents(request, {
        timeout: GOOGLE_DATA_MANAGER_TIMEOUT_MS
      })
  )

  const requestId =
    response.requestId?.trim() ||
    undefined

  if (
    !config.validateOnly &&
    !requestId
  ) {
    throw new Error(
      'Google Data Manager response did not include requestId'
    )
  }

  return {
    validateOnly:
      config.validateOnly,
    ...(requestId ?
      { requestId }
    : {})
  }
}
