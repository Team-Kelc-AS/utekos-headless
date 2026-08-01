import crypto from 'crypto'
import {
  appLogInputSchema,
  type AppLogInput
} from '@/lib/observability/logging/appLogContract'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import { reportAppLogToSentry } from '@/lib/observability/logging/reportAppLogToSentry'
import type { AppLogEntry } from 'types/observability/log/AppLogEntry'

export type LogToAppLogsDependencies = {
  report: typeof reportAppLogToSentry
}

const defaultDependencies: LogToAppLogsDependencies = {
  report: reportAppLogToSentry
}

export async function logToAppLogs(
  input: AppLogInput,
  dependencies: LogToAppLogsDependencies = defaultDependencies
): Promise<AppLogEntry> {
  const parsedInput = appLogInputSchema.parse(input)
  const timestamp = new Date().toISOString()
  const logId = crypto.randomUUID()

  const logEntry = {
    event: parsedInput.event,
    id: logId,
    timestamp,
    level: parsedInput.level,
    data: parsedInput.data,
    context: {
      ...parsedInput.context,
      runtime: getVercelRuntimeContext()
    }
  }

  if (parsedInput.level === 'ERROR') {
    console.error(JSON.stringify(logEntry))
  } else if (parsedInput.level === 'WARN') {
    console.warn(JSON.stringify(logEntry))
  } else {
    console.log(JSON.stringify(logEntry))
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
