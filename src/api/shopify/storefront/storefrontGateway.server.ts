import 'server-only'

import { createStorefrontGatewayFromEnvironment } from './createStorefrontGatewayFromEnvironment'
import type { StorefrontGateway } from './StorefrontGatewayContract'

let resolvedGateway: StorefrontGateway | undefined

function getGateway(): StorefrontGateway {
  resolvedGateway ??=
    createStorefrontGatewayFromEnvironment(process.env)

  return resolvedGateway
}

export const storefrontGateway: StorefrontGateway = {
  catalogQuery: async input => getGateway().catalogQuery(input),
  buyerQuery: async input => getGateway().buyerQuery(input),
  mutation: async input => getGateway().mutation(input)
}
