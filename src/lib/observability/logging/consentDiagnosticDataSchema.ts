import * as z from '@/lib/validation/zodMini'
import { consentDiagnosticCodes } from 'types/observability/log/ConsentDiagnosticCode'

export const consentDiagnosticDataSchema = z.strictObject({
  code: z.enum(consentDiagnosticCodes)
})
