import {
  createBrowserEventRouteHandler,
  type BrowserEventRouteHandlerDependencies
} from './createBrowserEventRouteHandler'

export type CanonicalAddToCartRouteDependencies =
  BrowserEventRouteHandlerDependencies

export const handleCanonicalAddToCartRoute =
  createBrowserEventRouteHandler()
