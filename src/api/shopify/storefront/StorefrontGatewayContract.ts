import type { ExtractVariables, ShopifyOperation } from '@types'
import type { GraphQLErrorResponse } from 'types/graphql.types'

export type StorefrontBuyerContext = Readonly<{
  buyerIp: string | null
}>

export type StorefrontFailureImpact = 'required' | 'optional'

export type StorefrontGatewayResult<TData> =
  | { success: true; body: TData }
  | { success: false; error: GraphQLErrorResponse }

type StorefrontRequestInput<
  T extends ShopifyOperation<unknown, object>
> = {
  query: string
  failureImpact?: StorefrontFailureImpact
  signal?: AbortSignal
  timeoutMs?: number
  variables?: ExtractVariables<T>
}

export type StorefrontCatalogQueryInput<
  T extends ShopifyOperation<unknown, object>
> = StorefrontRequestInput<T> & {
  cache?: RequestCache
}

export type StorefrontBuyerQueryInput<
  T extends ShopifyOperation<unknown, object>
> = StorefrontRequestInput<T> & {
  context: StorefrontBuyerContext
}

export type StorefrontMutationInput<
  T extends ShopifyOperation<unknown, object>
> = StorefrontRequestInput<T> & {
  context: StorefrontBuyerContext
}

export interface StorefrontGateway {
  catalogQuery<T extends ShopifyOperation<unknown, object>>(
    input: StorefrontCatalogQueryInput<T>
  ): Promise<StorefrontGatewayResult<T['data']>>

  buyerQuery<T extends ShopifyOperation<unknown, object>>(
    input: StorefrontBuyerQueryInput<T>
  ): Promise<StorefrontGatewayResult<T['data']>>

  mutation<T extends ShopifyOperation<unknown, object>>(
    input: StorefrontMutationInput<T>
  ): Promise<StorefrontGatewayResult<T['data']>>
}
