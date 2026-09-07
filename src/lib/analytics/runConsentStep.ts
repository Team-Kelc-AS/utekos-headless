import type { ConsentDiagnosticCode } from 'types/observability/log/ConsentDiagnosticCode'
import { reportConsentDiagnostic } from '@/lib/observability/client/reportConsentDiagnostic'

export function runConsentStep<T>(
  task: () => T,
  failureCode: ConsentDiagnosticCode = 'optional_context_failed'
): T | undefined {
  try {
    return task()
  } catch {
    reportConsentDiagnostic(failureCode)
    return undefined
  }
}
