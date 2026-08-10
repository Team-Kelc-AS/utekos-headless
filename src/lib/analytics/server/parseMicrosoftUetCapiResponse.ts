import { z } from 'zod'

const microsoftUetValidationDetailSchema = z
  .object({
    errorCode: z.string().min(1).optional(),
    errorMessage: z.string().min(1).optional(),
    index: z.number().int().nonnegative().optional(),
    isWarning: z.boolean().optional(),
    propertyName: z.string().min(1).optional()
  })
  .passthrough()

const microsoftUetResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1).optional(),
        details: z.array(microsoftUetValidationDetailSchema).optional(),
        message: z.string().min(1).optional()
      })
      .passthrough()
      .optional(),
    eventsReceived: z.number().int().nonnegative().optional()
  })
  .passthrough()

export type MicrosoftUetCapiValidationDetail = {
  errorCode: string | null
  errorMessage: string | null
  index: number | null
  propertyName: string | null
}

export type MicrosoftUetCapiResponseSummary = {
  eventsReceived: number | null
  responseCode: string | null
  responseMessage: string | null
  validationErrors: MicrosoftUetCapiValidationDetail[]
  validationWarnings: MicrosoftUetCapiValidationDetail[]
}

function emptySummary(): MicrosoftUetCapiResponseSummary {
  return {
    eventsReceived: null,
    responseCode: null,
    responseMessage: null,
    validationErrors: [],
    validationWarnings: []
  }
}

function projectValidationDetail(
  detail: z.infer<typeof microsoftUetValidationDetailSchema>
): MicrosoftUetCapiValidationDetail {
  return {
    errorCode: detail.errorCode ?? null,
    errorMessage: detail.errorMessage ?? null,
    index: detail.index ?? null,
    propertyName: detail.propertyName ?? null
  }
}

export function parseMicrosoftUetCapiResponse(
  responseText: string
): MicrosoftUetCapiResponseSummary {
  if (!responseText.trim()) return emptySummary()

  let responseBody: unknown

  try {
    responseBody = JSON.parse(responseText)
  } catch {
    return emptySummary()
  }

  const parsed = microsoftUetResponseSchema.safeParse(responseBody)
  if (!parsed.success) return emptySummary()

  const details = parsed.data.error?.details ?? []

  return {
    eventsReceived: parsed.data.eventsReceived ?? null,
    responseCode: parsed.data.error?.code ?? null,
    responseMessage: parsed.data.error?.message ?? null,
    validationErrors: details
      .filter(detail => detail.isWarning !== true)
      .map(projectValidationDetail),
    validationWarnings: details
      .filter(detail => detail.isWarning === true)
      .map(projectValidationDetail)
  }
}

export function formatMicrosoftUetCapiHttpErrorMessage(
  status: number,
  summary: MicrosoftUetCapiResponseSummary
) {
  const providerMessage = [
    summary.responseCode,
    summary.responseMessage
  ]
    .filter((value): value is string => Boolean(value))
    .join(': ')

  return providerMessage ?
      `Microsoft UET CAPI HTTP ${status}: ${providerMessage}`
    : `Microsoft UET CAPI HTTP ${status}`
}
