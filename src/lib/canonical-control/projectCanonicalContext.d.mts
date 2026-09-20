import type { ControlManifest } from './controlManifest'
import type { ControlResult } from './controlResult'

export function projectCanonicalContext(
  args: {
    name?: string | undefined
    query?: string | undefined
    limit: number
  },
  manifest: ControlManifest,
  manifestSha: string,
  deploymentSha: string | null
): ControlResult
