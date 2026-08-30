import { Suspense } from 'react'
import { frontmatter } from './skreddersyVarmenContent.mdx'
import { type LandingSearchParams } from './components/SkreddersyVarmenPageRuntime'
import { SkreddersyVarmenExperiment } from './components/SkreddersyVarmenExperiment'
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
  return (
    <Suspense
      fallback={
        <div
          aria-busy='true'
          className='min-h-screen w-full bg-background'
        >
          <span className='sr-only'>Laster siden</span>
        </div>
      }
    >
      <SkreddersyVarmenExperiment
        content={content}
        searchParams={searchParams}
      />
    </Suspense>
  )
}
