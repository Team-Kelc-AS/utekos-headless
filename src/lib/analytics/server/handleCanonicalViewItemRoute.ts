import {
  createBrowserEventRouteHandler,
  type BrowserEventRouteHandlerDependencies
} from './createBrowserEventRouteHandler'

export type CanonicalViewItemRouteDependencies =
  BrowserEventRouteHandlerDependencies

export const handleCanonicalViewItemRoute =
  createBrowserEventRouteHandler()
