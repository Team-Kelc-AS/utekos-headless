import 'server-only'

export function GoogleTagManagerNoScript({
  enabled
}: {
  enabled: boolean
}) {
  if (!enabled) {
    return null
  }

  return (
    <noscript>
      <iframe
        src='https://edge.utekos.no/ns.html?id=GTM-5TWMJQFP'
        height='0'
        width='0'
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
