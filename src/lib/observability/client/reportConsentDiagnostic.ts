import type { ConsentDiagnosticCode } from 'types/observability/log/ConsentDiagnosticCode'
import { sendClientLog } from './sendClientLog'
import { sanitizeOperationalPathname } from '../logging/sanitizeOperationalPathname'

const reportedCodes = new Set<ConsentDiagnosticCode>()

export function reportConsentDiagnostic(
  code: ConsentDiagnosticCode
): void {
  if (typeof window === 'undefined' || reportedCodes.has(code))
    return
  reportedCodes.add(code)
  if (process.env.NODE_ENV !== 'production') return

  try {
    void sendClientLog(
      {
        event: 'consent_diagnostic',
        level: 'info',
        data: { code },
        context: {
          pathname: sanitizeOperationalPathname(
            window.location.pathname
          )
        }
      },
      {
        fetch,
        sendBeacon: navigator.sendBeacon?.bind(navigator)
      }
    ).catch(() => undefined)
  } catch {
    // Diagnostics must never interrupt consent or storefront execution.
  }
}
