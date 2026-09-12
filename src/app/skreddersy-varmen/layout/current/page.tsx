import { SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY } from '@/lib/experiments/skreddersyVarmenLayoutExperiment'
import { SkreddersyVarmenExperiment } from '../../components/SkreddersyVarmenExperiment'
import type { LandingSearchParams } from '../../components/SkreddersyVarmenPageRuntime'

export { metadata } from '../../data/skreddersyVarmenPageContent'

export default function SkreddersyVarmenCurrentPage({
  searchParams
}: {
  searchParams: LandingSearchParams
}) {
  return (
    <SkreddersyVarmenExperiment
      assignment={{
        key: SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
        variant: 'current'
      }}
      searchParams={searchParams}
    />
  )
}
