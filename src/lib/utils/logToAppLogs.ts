import crypto from 'crypto'
import {
  appLogInputSchema,
  type AppLogInput
} from '@/lib/observability/logging/appLogContract'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { AppLogEntry } from 'types/observability/log/AppLogEntry'

export async function logToAppLogs(
  input: AppLogInput
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
  } else {
    console.log(JSON.stringify(logEntry))
  }

  return logEntry
}
