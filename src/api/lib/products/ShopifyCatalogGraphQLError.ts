export class ShopifyCatalogGraphQLError extends Error {
  readonly graphqlErrorCode: string | null

  constructor(message: string, graphqlErrorCode: string | null = null) {
    super(message)
    this.name = 'ShopifyCatalogGraphQLError'
    this.graphqlErrorCode = graphqlErrorCode
  }
}
