const EMAIL = 'kundeservice@kelc.no'
const PHONE = '+47 402 16 343'
const PHONE_HREF = 'tel:+4740216343'
const CONTACT_SPLIT = /(kundeservice@kelc\.no|\+47 402 16 343)/

export function SizeGuideFaqAnswer({ answer }: { answer: string }) {
  if (!answer.includes(EMAIL)) {
    return <p>{answer}</p>
  }

  return (
    <p>
      {answer.split(CONTACT_SPLIT).map((part, index) => {
        if (part === EMAIL) {
          return (
            <a key={`${part}-${index}`} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          )
        }

        if (part === PHONE) {
          return (
            <a key={`${part}-${index}`} href={PHONE_HREF}>
              {PHONE}
            </a>
          )
        }

        return part
      })}
    </p>
  )
}
