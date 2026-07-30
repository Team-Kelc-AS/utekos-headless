import {
  QueryClient,
  defaultShouldDehydrateQuery
} from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
      dehydrate: {
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
        // Next.js needs its framework errors intact to detect dynamic routes.
        // The App Router redacts server errors before exposing a digest to clients.
        shouldRedactErrors: () => false
      }
    }
  })
}
