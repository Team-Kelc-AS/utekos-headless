import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from 'react-email'
import * as React from 'react'

export type AbandonedCheckoutRecoveryEmailProps = {
  step: 1 | 2 | 3
  offerType: 'generic' | 'staycomfy'
  productImage?: {
    url: string
    alt: string
  } | null
  recoveryUrl: string
  unsubscribeUrl: string
}

const copyByStep = {
  1: {
    subject: 'Glemte du noe i kassen?',
    preview: 'Varene dine venter fortsatt i kassen.',
    heading: 'Kassen din venter',
    body: 'Vi har passet godt på handlekurven din. Du kan fortsette akkurat der du slapp.'
  },
  2: {
    subject: 'Handlekurven din venter fortsatt',
    preview: 'Fortsett fra den lagrede kassen din.',
    heading: 'Vil du fortsette?',
    body: 'Varene fra den lagrede kassen din er fortsatt tilgjengelige så langt lageret rekker.'
  },
  3: {
    subject: 'Siste påminnelse om handlekurven din',
    preview: 'Dette er den siste påminnelsen fra oss.',
    heading: 'En siste påminnelse',
    body: 'Dette er den siste e-posten vi sender om denne kassen.'
  }
} as const

const fallbackImages = {
  generic: {
    url: 'https://utekos.no/og-image-utekos-produkter.jpg',
    alt: 'Utvalgte produkter fra Utekos'
  },
  staycomfy: {
    url: 'https://utekos.no/og-image-comfyrobe.jpg',
    alt: 'Comfyrobe fra Utekos'
  }
} as const

export function getAbandonedCheckoutRecoverySubject(
  step: 1 | 2 | 3
): string {
  return copyByStep[step].subject
}

export function AbandonedCheckoutRecoveryEmail({
  step,
  offerType,
  productImage,
  recoveryUrl,
  unsubscribeUrl
}: AbandonedCheckoutRecoveryEmailProps): React.JSX.Element {
  const copy = copyByStep[step]
  const image = productImage ?? fallbackImages[offerType]

  return (
    <Html lang='nb' dir='ltr'>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Utekos</Text>
          <Text style={eyebrow}>Handlekurv</Text>

          <Section style={contentCard}>
            <Img
              src={image.url}
              alt={image.alt}
              width='536'
              style={productImageStyle}
            />

            <Section style={content}>
              <Heading as='h1' style={heading}>
                {copy.heading}
              </Heading>
              <Text style={paragraph}>{copy.body}</Text>

              {offerType === 'staycomfy' && (
                <Section style={offer}>
                  <Heading as='h2' style={offerHeading}>
                    200 kr per Comfyrobe + gratis frakt
                  </Heading>
                  <Text style={offerText}>
                    Bruk rabattkoden i kassen:
                  </Text>
                  <Text style={discountCode}>STAYCOMFY</Text>
                  <Text style={offerFinePrint}>
                    Én bruk per kunde. Kan ikke kombineres med andre
                    rabatter.
                  </Text>
                </Section>
              )}

              <Button href={recoveryUrl} style={button}>
                Til kassen
              </Button>

              <Text style={finePrint}>
                Tilgjengelighet og endelig pris bekreftes i
                Shopify-kassen.
                {offerType === 'staycomfy' &&
                  ' Gratis frakt legges automatisk til når STAYCOMFY gjelder.'}
              </Text>
            </Section>
          </Section>

          <Hr style={rule} />
          <Text style={footer}>
            Ønsker du ikke flere slike e-poster?{' '}
            <Link href={unsubscribeUrl} style={link}>
              Meld deg av
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const fontFamily =
  '"Google Sans Flex","Google Sans",Arial,Helvetica,sans-serif'

const main = {
  backgroundColor: '#001a18',
  color: '#f0eee9',
  fontFamily,
  margin: 0,
  padding: '32px 12px'
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  padding: '28px 20px 32px'
}

const brand = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '48px',
  fontStyle: 'italic',
  fontWeight: '800',
  letterSpacing: '-0.04em',
  lineHeight: '52px',
  margin: '0 0 8px'
}

const eyebrow = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '22px',
  fontWeight: '600',
  lineHeight: '30px',
  margin: '0 0 28px'
}

const contentCard = {
  backgroundColor: '#012622',
  borderRadius: '24px',
  overflow: 'hidden' as const
}

const productImageStyle = {
  backgroundColor: '#001a18',
  border: 0,
  display: 'block',
  height: 'auto',
  maxWidth: '100%',
  width: '100%'
}

const content = {
  padding: '32px 32px 36px'
}

const heading = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '32px',
  fontWeight: '800',
  letterSpacing: '-0.02em',
  lineHeight: '38px',
  margin: '0 0 14px'
}

const paragraph = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '17px',
  fontWeight: '400',
  lineHeight: '27px',
  margin: '0 0 26px'
}

const offer = {
  backgroundColor: '#001a18',
  borderRadius: '16px',
  margin: '0 0 28px',
  padding: '22px'
}

const offerHeading = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '21px',
  fontWeight: '800',
  lineHeight: '28px',
  margin: '0 0 12px'
}

const offerText = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '15px',
  fontWeight: '400',
  lineHeight: '23px',
  margin: '0 0 10px'
}

const discountCode = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '22px',
  fontWeight: '800',
  letterSpacing: '0.08em',
  lineHeight: '28px',
  margin: '0 0 10px'
}

const offerFinePrint = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '13px',
  fontWeight: '400',
  lineHeight: '20px',
  margin: 0
}

const button = {
  backgroundColor: '#bb4d0f',
  borderRadius: '14px',
  color: '#f0eee9',
  display: 'block',
  fontFamily,
  fontSize: '20px',
  fontWeight: '800',
  lineHeight: '24px',
  padding: '17px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none'
}

const finePrint = {
  color: '#f0eee9',
  fontFamily,
  fontSize: '13px',
  fontWeight: '400',
  lineHeight: '20px',
  margin: '18px 0 0'
}

const rule = {
  borderColor: '#31514c',
  margin: '30px 0 20px'
}

const footer = { ...finePrint, margin: 0 }
const link = {
  color: '#f0eee9',
  fontWeight: '600',
  textDecoration: 'underline'
}

export default AbandonedCheckoutRecoveryEmail
