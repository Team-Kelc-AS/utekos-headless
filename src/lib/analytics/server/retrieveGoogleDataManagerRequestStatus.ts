import { protos } from '@google-ads/datamanager'
import {
  createGoogleDataManagerIngestionClient,
  type GoogleDataManagerIngestionClient
} from './createGoogleDataManagerIngestionClient'
import type {
  GoogleDataManagerProviderStatus,
  GoogleDataManagerRequestStatusResult
} from './googleDataManagerStatusTypes'

const GOOGLE_DATA_MANAGER_STATUS_TIMEOUT_MS = 10_000

const {
  ProcessingErrorReason,
  ProcessingWarningReason,
  RequestStatusPerDestination,
  RetrieveRequestStatusResponse
} = protos.google.ads.datamanager.v1

type Dependencies = {
  createClient: () => GoogleDataManagerIngestionClient
}

let cachedClient: GoogleDataManagerIngestionClient | undefined

const defaultDependencies: Dependencies = {
  createClient: () => {
    cachedClient ??= createGoogleDataManagerIngestionClient()

    return cachedClient
  }
}

function statusName(
  value:
    | GoogleDataManagerProviderStatus
    | protos.google.ads.datamanager.v1.RequestStatusPerDestination.RequestStatus
    | null
    | undefined
): GoogleDataManagerProviderStatus {
  if (typeof value === 'string') {
    switch (value) {
      case 'SUCCESS':
      case 'PROCESSING':
      case 'FAILED':
      case 'PARTIAL_SUCCESS':
        return value
      default:
        return 'REQUEST_STATUS_UNKNOWN'
    }
  }

  const name =
    RequestStatusPerDestination.RequestStatus[
      value ??
        RequestStatusPerDestination.RequestStatus
          .REQUEST_STATUS_UNKNOWN
    ]

  switch (name) {
    case 'SUCCESS':
    case 'PROCESSING':
    case 'FAILED':
    case 'PARTIAL_SUCCESS':
      return name
    default:
      return 'REQUEST_STATUS_UNKNOWN'
  }
}

function overallStatus(
  statuses: GoogleDataManagerProviderStatus[]
): GoogleDataManagerProviderStatus {
  if (statuses.includes('FAILED')) return 'FAILED'
  if (statuses.includes('PARTIAL_SUCCESS')) {
    return 'PARTIAL_SUCCESS'
  }
  if (
    statuses.length > 0 &&
    statuses.every(status => status === 'SUCCESS')
  ) {
    return 'SUCCESS'
  }
  if (statuses.includes('PROCESSING')) return 'PROCESSING'

  return 'REQUEST_STATUS_UNKNOWN'
}

function recordCount(value: unknown): number | null {
  if (value === null || value === undefined) return null

  const normalized = Number(value)

  return Number.isSafeInteger(normalized) && normalized >= 0 ?
      normalized
    : null
}

function reasonName(
  value: string | number | null | undefined,
  names: Record<number, string>
) {
  if (typeof value === 'string') return value

  return names[value ?? 0] ?? 'UNSPECIFIED'
}

export async function retrieveGoogleDataManagerRequestStatus(
  requestId: string,
  dependencies: Dependencies = defaultDependencies
): Promise<GoogleDataManagerRequestStatusResult> {
  const normalizedRequestId = requestId.trim()

  if (!normalizedRequestId) {
    throw new Error('Google Data Manager requestId is required')
  }

  const [response] = await dependencies
    .createClient()
    .retrieveRequestStatus(
      { requestId: normalizedRequestId },
      { timeout: GOOGLE_DATA_MANAGER_STATUS_TIMEOUT_MS }
    )

  const normalizedResponse =
    RetrieveRequestStatusResponse.fromObject(response)
  const validationError = RetrieveRequestStatusResponse.verify(
    normalizedResponse
  )

  if (validationError) {
    throw new Error(
      `Invalid Google Data Manager status response: ${validationError}`
    )
  }

  const destinationStatuses = (
    normalizedResponse.requestStatusPerDestination ?? []
  ).map(destination => statusName(destination.requestStatus))
  const eventRecordCounts = (
    normalizedResponse.requestStatusPerDestination ?? []
  ).map(destination =>
    recordCount(destination.eventsIngestionStatus?.recordCount)
  )
  const completeRecordCounts = eventRecordCounts.filter(
    (value): value is number => value !== null
  )
  const aggregatedRecordCount =
    eventRecordCounts.length > 0 &&
    completeRecordCounts.length === eventRecordCounts.length ?
      completeRecordCounts.reduce((sum, value) => sum + value, 0)
    : null
  const errorCounts = (
    normalizedResponse.requestStatusPerDestination ?? []
  ).flatMap(destination =>
    (destination.errorInfo?.errorCounts ?? []).map(count => ({
      reason: reasonName(
        count.reason,
        ProcessingErrorReason as unknown as Record<number, string>
      ),
      recordCount: recordCount(count.recordCount) ?? 0
    }))
  )
  const warningCounts = (
    normalizedResponse.requestStatusPerDestination ?? []
  ).flatMap(destination =>
    (destination.warningInfo?.warningCounts ?? []).map(count => ({
      reason: reasonName(
        count.reason,
        ProcessingWarningReason as unknown as Record<number, string>
      ),
      recordCount: recordCount(count.recordCount) ?? 0
    }))
  )
  const plainResponse = RetrieveRequestStatusResponse.toObject(
    normalizedResponse,
    { defaults: false, enums: String, longs: String }
  )

  return {
    destinationStatuses,
    errorCounts,
    overallStatus: overallStatus(destinationStatuses),
    recordCount: aggregatedRecordCount,
    requestId: normalizedRequestId,
    response: plainResponse,
    warningCounts
  }
}
