import {
  createBrowserEventRouteHandler,
  type BrowserEventRouteHandlerDependencies
} from './createBrowserEventRouteHandler'

export type CanonicalPageViewRouteDependencies =
  BrowserEventRouteHandlerDependencies

export const handleCanonicalPageViewRoute =
  createBrowserEventRouteHandler()
