import { useSyncExternalStore } from 'react'

type MediaQueryStore = {
  subscribe: (onStoreChange: () => void) => () => void
  getSnapshot: () => boolean
}

const mediaQueryStores = new Map<string, MediaQueryStore>()

function getServerSnapshot() {
  return false
}

function getMediaQueryStore(query: string): MediaQueryStore {
  const existingStore = mediaQueryStores.get(query)

  if (existingStore) {
    return existingStore
  }

  let mediaQueryList: MediaQueryList | undefined
  const getMediaQueryList = () => {
    mediaQueryList ??= window.matchMedia(query)
    return mediaQueryList
  }

  const store = {
    subscribe(onStoreChange: () => void) {
      const mediaQuery = getMediaQueryList()
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    getSnapshot() {
      return getMediaQueryList().matches
    }
  }

  mediaQueryStores.set(query, store)
  return store
}

export function useMediaQuery(query: string): boolean {
  const store = getMediaQueryStore(query)
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot
  )
}
