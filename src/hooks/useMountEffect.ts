import type { EffectCallback } from 'react'
import { useEffect } from 'react'

/**
 * UseEffect that only run on the initial mount
 */
export default function useMountEffect(
  callback: EffectCallback
) {
  useEffect((...args) => {
    return callback(...args)
    // Mount-only by design; callback identity must not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hook
  }, [])
}
