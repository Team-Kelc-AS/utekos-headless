import { Suspense } from 'react'
import { frontmatter } from './skreddersyVarmenContent.mdx'
import { SkreddersyVarmenExperiment } from './components/SkreddersyVarmenExperiment'
import {
  SkreddersyVarmenPageRuntime,
  type LandingSearchParams
} from './components/SkreddersyVarmenPageRuntime'
import {
  buildSkreddersyVarmenMetadata,
  parseSkreddersyVarmenPageContent
} from './data/skreddersyVarmenPageModel'

const content = parseSkreddersyVarmenPageContent(frontmatter)

export const metadata = buildSkreddersyVarmenMetadata(
  content.seo
)

export default function SkreddersyVarmenPage({
  searchParams
}: {
  searchParams: LandingSearchParams
}) {
  const staticPage = (
    <SkreddersyVarmenPageRuntime
      content={content}
      searchParams={searchParams}
    />
  )

  return (
    <Suspense fallback={staticPage}>
      <SkreddersyVarmenExperiment
        content={content}
        searchParams={searchParams}
      />
    </Suspense>
  )
}
