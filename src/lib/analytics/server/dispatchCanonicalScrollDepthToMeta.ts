import type { CanonicalScrollDepth } from '../scrollDepthEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalScrollDepthToMeta } from './mapCanonicalScrollDepthToMeta'

export const dispatchCanonicalScrollDepthToMeta =
  createCanonicalMetaDispatch<CanonicalScrollDepth, 'scroll_depth'>({
    eventName: 'scroll_depth',
    mapEvent: mapCanonicalScrollDepthToMeta
  })
