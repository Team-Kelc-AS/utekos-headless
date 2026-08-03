import 'server-only'

import postgres from 'postgres'
import { resolvePostgresConnectionUrl } from './resolvePostgresConnectionUrl'

let postgresClient: ReturnType<typeof postgres> | null | undefined

function getPostgresUrl(): string | undefined {
  return resolvePostgresConnectionUrl(process.env)
}

export function getPostgresClient(): ReturnType<typeof postgres> | null {
  if (postgresClient !== undefined) {
    return postgresClient
  }

  const connectionUrl = getPostgresUrl()

  if (!connectionUrl) {
    postgresClient = null
    return postgresClient
  }

  postgresClient = postgres(connectionUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    connection: {
      application_name: 'utekos-app'
    }
  })

  return postgresClient
}
