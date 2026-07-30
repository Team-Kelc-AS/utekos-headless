import { useMediaQuery } from '@/hooks/useMediaQuery'

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY)
}
