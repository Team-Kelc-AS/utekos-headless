import type { SearchParamsRecord } from '../types'

export function toURLSearchParams(searchParams: SearchParamsRecord) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) params.append(key, item)
      }
      continue
    }

    if (value) {
      params.set(key, value)
    }
  }

  return params
}
