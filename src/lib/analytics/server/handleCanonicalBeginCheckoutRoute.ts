import {
  createBrowserEventRouteHandler,
  type BrowserEventRouteHandlerDependencies
} from './createBrowserEventRouteHandler'

export type CanonicalBeginCheckoutRouteDependencies =
  BrowserEventRouteHandlerDependencies

export const handleCanonicalBeginCheckoutRoute =
  createBrowserEventRouteHandler()
