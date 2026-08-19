import crypto from 'crypto'
import {
  appLogInputSchema,
  type AppLogInput
} from '@/lib/observability/logging/appLogContract'
import { parseAppLogEntryExtras } from '@/lib/observability/logging/appLogEntryExtrasSchema'
import { reportAppLogToSentry } from '@/lib/observability/logging/reportAppLogToSentry'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type {
  AppLogEntry,
  AppLogEntryExtras
} from 'types/observability/log/AppLogEntry'

export type LogToAppLogsInput = AppLogInput & AppLogEntryExtras

export type LogToAppLogsDependencies = {
  report: typeof reportAppLogToSentry
}

const defaultDependencies: LogToAppLogsDependencies = {
  report: reportAppLogToSentry
}

export async function logToAppLogs(
  input: LogToAppLogsInput,
  dependencies: LogToAppLogsDependencies = defaultDependencies
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

  if (
    parsedInput.level === 'WARN' ||
    parsedInput.level === 'ERROR'
  ) {
    try {
      await dependencies.report(logEntry)
    } catch {
      console.warn('App log report delivery failed')
    }
  }

  return logEntry
}
