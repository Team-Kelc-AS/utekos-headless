import postgres from 'postgres'
import { resolvePostgresConnectionUrl } from '../../db/resolvePostgresConnectionUrl'

type QueryRow = Record<string, unknown>

export type AssistantFeedbackRating = 'helpful' | 'not_helpful'

export type AssistantFeedbackStore = Readonly<{
  save(input: {
    rating: AssistantFeedbackRating
    responseFingerprint: string
  }): Promise<void>
}>

export type AssistantFeedbackQueryExecutor = (
  query: string,
  parameters: readonly unknown[]
) => Promise<QueryRow[]>

let feedbackSql: ReturnType<typeof postgres> | undefined

function getFeedbackSql() {
  const connectionString = resolvePostgresConnectionUrl(process.env)
  if (!connectionString) {
    throw new Error('assistant_feedback_database_not_configured')
  }

  feedbackSql ??= postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    max_lifetime: 60 * 30,
    prepare: false,
    connection: {
      application_name: 'utekos-customer-assistant-feedback'
    }
  })

  return feedbackSql
}

const executePostgresQuery: AssistantFeedbackQueryExecutor = async (
  query,
  parameters
) => {
  const sql = getFeedbackSql()
  const postgresParameters = parameters as Parameters<
    typeof sql.unsafe
  >[1]
  return sql.unsafe<QueryRow[]>(query, postgresParameters)
}

const INSERT_FEEDBACK_QUERY = `
  insert into ops.customer_assistant_feedback (
    response_fingerprint,
    rating
  ) values ($1, $2)
  on conflict (response_fingerprint) do nothing
`

export function createAssistantFeedbackStore(
  execute: AssistantFeedbackQueryExecutor = executePostgresQuery
): AssistantFeedbackStore {
  return {
    async save(input) {
      await execute(INSERT_FEEDBACK_QUERY, [
        input.responseFingerprint,
        input.rating
      ])
    }
  }
}

export const assistantFeedbackStore =
  createAssistantFeedbackStore()
