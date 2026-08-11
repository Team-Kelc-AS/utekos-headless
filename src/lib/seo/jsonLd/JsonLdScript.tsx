import { serializeJsonLd } from './serializeJsonLd'

export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data)
      }}
    />
  )
}
