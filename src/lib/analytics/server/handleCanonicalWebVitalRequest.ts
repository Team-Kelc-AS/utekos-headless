import { acceptCanonicalWebVital } from './acceptCanonicalWebVital'
import { createBrowserEventRequestHandler } from './createBrowserEventRequestHandler'

export const handleCanonicalWebVitalRequest =
  createBrowserEventRequestHandler(acceptCanonicalWebVital, {
    eventName: 'web_vital'
  })
