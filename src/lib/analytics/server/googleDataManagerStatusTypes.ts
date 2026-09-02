export type GoogleDataManagerProviderStatus =
  | 'REQUEST_STATUS_UNKNOWN'
  | 'SUCCESS'
  | 'PROCESSING'
  | 'FAILED'
  | 'PARTIAL_SUCCESS'

export type GoogleDataManagerDiagnosticCount = {
  reason: string
  recordCount: number
}

export type GoogleDataManagerRequestStatusResult = {
  destinationStatuses: GoogleDataManagerProviderStatus[]
  errorCounts: GoogleDataManagerDiagnosticCount[]
  overallStatus: GoogleDataManagerProviderStatus
  recordCount: number | null
  requestId: string
  response: Record<string, unknown>
  warningCounts: GoogleDataManagerDiagnosticCount[]
}

export type GoogleDataManagerStatusClaim = {
  attemptId: string
  leaseToken: string
  requestId: string
  statusCheckAttempts: number
}

type StatusOutcomeWithResult = {
  claim: GoogleDataManagerStatusClaim
  latencyMs: number
  result: GoogleDataManagerRequestStatusResult
  status:
    | 'succeeded'
    | 'succeeded_with_warnings'
    | 'failed'
    | 'partial_success'
    | 'processing_failure'
}

type RetryableStatusOutcome = {
  claim: GoogleDataManagerStatusClaim
  latencyMs: number
  nextCheckAt: string
  result: GoogleDataManagerRequestStatusResult
  status: 'processing' | 'unknown'
}

type RetryStatusOutcome = {
  claim: GoogleDataManagerStatusClaim
  errorMessage: string
  latencyMs: number
  nextCheckAt: string
  status: 'retry'
}

export type GoogleDataManagerStatusOutcome =
  | StatusOutcomeWithResult
  | RetryableStatusOutcome
  | RetryStatusOutcome

export type GoogleDataManagerStatusStore = {
  claimNext: () => Promise<GoogleDataManagerStatusClaim | null>
  countOverdue: () => Promise<number>
  complete: (
    outcome: GoogleDataManagerStatusOutcome
  ) => Promise<void>
}
