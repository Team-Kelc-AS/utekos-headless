import type {} from '../_shared/runtime.d.ts'
import { readDrainRuntimeConfig } from './config.ts'
import { createObservationWriter } from './database.ts'
import { createVercelLogDrainHandler } from './handler.ts'

const config = readDrainRuntimeConfig(Deno.env)
const insertObservations = createObservationWriter(
  config.databaseUrl
)

Deno.serve(
  createVercelLogDrainHandler({ config, insertObservations })
)
