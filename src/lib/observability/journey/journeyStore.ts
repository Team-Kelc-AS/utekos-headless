import type { JourneyEvent } from './contract'

export type JourneyTraffic =
  | 'human_or_unknown'
  | 'synthetic'
  | 'verified_bot'
  | 'automated_bot'
export type JourneyAcceptance =
  | 'persisted'
  | 'duplicate'
  | 'conflict'
export type JourneyRow = {
  event: JourneyEvent
  received_at: string
  traffic_classification: JourneyTraffic
  runtime: {
    environment: string
    deploymentId: string | null
    commitSha: string | null
  }
}
export type JourneyStore = {
  accept: (row: JourneyRow) => Promise<JourneyAcceptance>
}
