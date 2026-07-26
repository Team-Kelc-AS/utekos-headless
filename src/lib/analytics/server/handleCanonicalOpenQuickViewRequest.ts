import { acceptCanonicalOpenQuickView } from './acceptCanonicalOpenQuickView'
import { createBrowserEventRequestHandler } from './createBrowserEventRequestHandler'

export const handleCanonicalOpenQuickViewRequest =
  createBrowserEventRequestHandler(
    acceptCanonicalOpenQuickView,
    { eventName: 'open_quick_view' }
  )
