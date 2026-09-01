import crypto from 'crypto'
import {
  appLogInputSchema,
  type AppLogInput
} from '@/lib/observability/logging/appLogContract'
import { parseAppLogEntryExtras } from '@/lib/observability/logging/appLogEntryExtrasSchema'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type {
  AppLogEntry,
  AppLogEntryExtras
} from 'types/observability/log/AppLogEntry'

export type LogToAppLogsInput = AppLogInput & AppLogEntryExtras

export async function logToAppLogs(
  input: LogToAppLogsInput
): Promise<AppLogEntry> {
  const { event, level, data, context, ...extrasInput } = input
  const parsedInput = appLogInputSchema.parse({
    event,
    level,
    data,
    context
  })
  const extras = parseAppLogEntryExtras(extrasInput)
  const timestamp = new Date().toISOString()
  const logId = crypto.randomUUID()

  const logEntry: AppLogEntry = {
    event: parsedInput.event,
    id: logId,
    timestamp,
    level: parsedInput.level,
    data: parsedInput.data,
    context: {
      ...parsedInput.context,
      runtime: getVercelRuntimeContext()
    },
    ...extras
  }

  const serialized = JSON.stringify(logEntry)

  if (parsedInput.level === 'ERROR') {
    console.error(serialized)
  } else if (parsedInput.level === 'WARN') {
    console.warn(serialized)
  } else {
    console.log(serialized)
  }

  return logEntry
}
