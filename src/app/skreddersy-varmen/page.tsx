import { type LandingSearchParams } from './components/SkreddersyVarmenPageRuntime'
import { SkreddersyVarmenExperiment } from './components/SkreddersyVarmenExperiment'

export { metadata } from './data/skreddersyVarmenPageContent'

export default function SkreddersyVarmenPage({
  searchParams
}: {
  searchParams: LandingSearchParams
}) {
  return (
    <SkreddersyVarmenExperiment searchParams={searchParams} />
  )
}
