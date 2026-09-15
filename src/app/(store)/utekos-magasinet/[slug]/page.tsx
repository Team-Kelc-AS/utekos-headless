import type { MDXContent } from 'mdx/types'
import { notFound } from 'next/navigation'

const posts = {
  welcome: () => import('@/markdown/welcome.mdx')
} satisfies Record<string, () => Promise<{ default: MDXContent }>>

type PostSlug = keyof typeof posts

function getPostLoader(slug: string) {
  if (!Object.hasOwn(posts, slug)) {
    return null
  }

  return posts[slug as PostSlug]
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loadPost = getPostLoader(slug)

  if (!loadPost) {
    notFound()
  }

  const { default: Post } = await loadPost()

  return <Post />
}

export function generateStaticParams() {
  return Object.keys(posts).map(slug => ({ slug }))
}
