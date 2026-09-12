import { Suspense } from 'react'
import { frontmatter } from './skreddersyVarmenContent.mdx'
import { SkreddersyVarmenExperiment } from './components/SkreddersyVarmenExperiment'
import { SkreddersyVarmenPageRuntime } from './components/SkreddersyVarmenPageRuntime'
import {
  buildSkreddersyVarmenMetadata,
  parseSkreddersyVarmenPageContent
} from './data/skreddersyVarmenPageModel'

const content = parseSkreddersyVarmenPageContent(frontmatter)

export const metadata = buildSkreddersyVarmenMetadata(
  content.seo
)

export default function SkreddersyVarmenPage() {
  return (
    <>
      <SkreddersyVarmenPageRuntime content={content} />
      <Suspense fallback={null}>
        <SkreddersyVarmenExperiment />
      </Suspense>
    </>
  )
}
