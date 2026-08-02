import type {} from '../_shared/runtime.d.ts'
import { readTraceDrainRuntimeConfig } from './config.ts'
import { createTraceObservationWriter } from './database.ts'
import { createVercelTraceDrainHandler } from './handler.ts'

const config = readTraceDrainRuntimeConfig(Deno.env)
const upsertObservations = createTraceObservationWriter(
  config.databaseUrl
)

Deno.serve(
  createVercelTraceDrainHandler({ config, upsertObservations })
)
