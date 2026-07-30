import {
  environmentManager,
  type QueryClient
} from '@tanstack/react-query'
import { makeQueryClient } from './makeQueryClient'

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
