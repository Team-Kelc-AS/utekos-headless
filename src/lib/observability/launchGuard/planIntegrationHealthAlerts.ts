import type {
  IntegrationHealthIncident,
  IntegrationHealthRecovery
} from './postgresIntegrationHealthStore'

export type IntegrationHealthAlertInstruction = Readonly<{
  channels: readonly ('sentry' | 'codex' | 'twilio_sms')[]
  currentOpenedAt: string
  fingerprint: string
  incidentId: string
  integration: string
  kind: 'incident' | 'recovery'
  severity: 'critical' | 'high' | 'medium' | 'low'
  summaryCode: string
  surface: string
}>

const IMMEDIATE_CRITICAL_CODES = new Set([
  'provider_dead_letter_present',
  'provider_initial_pending_stuck',
  'ledger_missing_with_verified_route_traffic',
  'authentication_failure',
  'critical_dead_letter_present'
])

function criticalIncidentIsEligible(
  incident: IntegrationHealthIncident
) {
  return (
    IMMEDIATE_CRITICAL_CODES.has(incident.summaryCode) ||
    incident.recentFailureCount >= 2
  )
}

export function planIntegrationHealthAlerts(input: {
  incidents: readonly IntegrationHealthIncident[]
  recoveries: readonly IntegrationHealthRecovery[]
}) {
  const incidents: IntegrationHealthAlertInstruction[] = []

  for (const incident of input.incidents) {
    if (
      incident.severity === 'critical' &&
      !criticalIncidentIsEligible(incident)
    ) {
      continue
    }

    const channels =
      incident.severity === 'critical' ?
        (['sentry', 'codex', 'twilio_sms'] as const)
      : incident.severity === 'high' ?
        (['sentry', 'codex'] as const)
      : (['codex'] as const)

    incidents.push({
      channels,
      currentOpenedAt: incident.currentOpenedAt,
      fingerprint: incident.fingerprint,
      incidentId: incident.id,
      integration: incident.integration,
      kind: 'incident',
      severity: incident.severity,
      summaryCode: incident.summaryCode,
      surface: incident.surface
    })
  }

  const recoveries = input.recoveries.map(
    (recovery): IntegrationHealthAlertInstruction => ({
      channels: [
        ...(recovery.wasSentrySent ? (['sentry'] as const) : []),
        'codex',
        ...(recovery.wasTwilioSent ?
          (['twilio_sms'] as const)
        : [])
      ],
      currentOpenedAt: recovery.currentOpenedAt,
      fingerprint: recovery.fingerprint,
      incidentId: recovery.id,
      integration: recovery.integration,
      kind: 'recovery',
      severity: recovery.severity,
      summaryCode: 'integration_recovered',
      surface: recovery.surface
    })
  )

  return [...incidents, ...recoveries]
}
