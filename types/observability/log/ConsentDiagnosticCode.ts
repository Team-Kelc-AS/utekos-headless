export const consentDiagnosticCodes = [
  'cmp_unavailable',
  'awaiting_decision',
  'dialog_visible',
  'decision_observed',
  'observation_sent',
  'observation_failed',
  'optional_context_failed',
  'consent_processing_failed',
  'collector_failed',
  'collector_sent'
] as const

export type ConsentDiagnosticCode =
  (typeof consentDiagnosticCodes)[number]
