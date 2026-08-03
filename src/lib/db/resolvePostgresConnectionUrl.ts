type PostgresConnectionEnvironment = Readonly<
  Record<string, string | undefined>
>

export function resolvePostgresConnectionUrl(
  environment: PostgresConnectionEnvironment
) {
  return (
    environment.SUPABASE_VERCEL_POSTGRES_URL
    || environment.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING
    || environment.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING_MAYBE
  )
}
