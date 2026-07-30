// Path: src/components/header/HeaderSearch/searchIndexQueryOption.ts

'use client'
import { queryOptions } from '@tanstack/react-query'
import type { SearchGroup } from '@types'

export const searchIndexQueryOptions = queryOptions({
  queryKey: ['search-index'],
  queryFn: async (): Promise<SearchGroup[]> => {
    const response = await fetch('/api/search-index')
    if (!response.ok) {
      throw new Error(
        `Nettverksrespons var ikke ok: ${response.status}`
      )
    }
    const data = await response.json()
    return data.groups as SearchGroup[]
  },
  staleTime: 1000 * 60 * 5
})
