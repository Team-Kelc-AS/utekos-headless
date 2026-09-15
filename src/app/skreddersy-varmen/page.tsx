import { type LandingSearchParams } from './components/SkreddersyVarmenPageRuntime'
import { SkreddersyVarmenPageRuntime } from './components/SkreddersyVarmenPageRuntime'
import { skreddersyVarmenPageContent } from './data/skreddersyVarmenPageContent'

export { metadata } from './data/skreddersyVarmenPageContent'

export default function SkreddersyVarmenPage({
  searchParams
}: {
  searchParams: LandingSearchParams
}) {
  return (
    <SkreddersyVarmenPageRuntime
      content={skreddersyVarmenPageContent}
      searchParams={searchParams}
    />
  )
}
