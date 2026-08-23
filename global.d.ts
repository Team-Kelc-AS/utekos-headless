import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import type { KlarnaPlacementAttributes } from '@/components/klarna/types'

declare module '*.css' {}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.graphql' {}

declare module '*.gql' {}

declare module '*.gqlnb' {}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'klarna-placement': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & KlarnaPlacementAttributes,
        HTMLElement
      >
    }
  }
}
