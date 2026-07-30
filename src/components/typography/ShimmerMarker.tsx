import {
  Marker,
  MarkerContent,
  MarkerIcon
} from '@/components/ui/marker'
import { Spinner } from '@/components/ui/spinner'
import type { TextShimmerProps } from '@/components/ai-elements/Shimmer'


export function ShimmerMarker({ children }: TextShimmerProps) {
const Text = children.toString()


  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">{Text}</MarkerContent>
        </Marker>
      <Marker variant="separator" role="status">
        <MarkerContent className="shimmer">{Text}</MarkerContent>
      </Marker>
    </div>
  )
}
