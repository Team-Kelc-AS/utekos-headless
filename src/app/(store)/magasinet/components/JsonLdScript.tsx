// src/app/(store)/magasinet/_components/JsonLdScript.tsx

type JsonLdScriptProps = {
  data: unknown
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c')
      }}
    />
  )
}
