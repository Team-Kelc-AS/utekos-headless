import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from 'react-email'
import * as React from 'react'

export type AbandonedCheckoutRecoveryEmailProps = {
  step: 1 | 2 | 3
  offerType: 'generic' | 'staycomfy'
  recoveryUrl: string
  unsubscribeUrl: string
}

const copyByStep = {
  1: {
    subject: 'Glemte du noe i kassen?',
    preview: 'Varene dine venter fortsatt i kassen.',
    heading: 'Kassen din venter',
    body: 'Du kan fortsette akkurat der du slapp.'
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

export function getAbandonedCheckoutRecoverySubject(
  step: 1 | 2 | 3
): string {
  return copyByStep[step].subject
}

export function AbandonedCheckoutRecoveryEmail({
  step,
  offerType,
  recoveryUrl,
  unsubscribeUrl
}: AbandonedCheckoutRecoveryEmailProps): React.JSX.Element {
  const copy = copyByStep[step]

  return (
    <Html lang='nb' dir='ltr'>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>UTEKOS</Text>
          <Heading as='h1' style={heading}>
            {copy.heading}
          </Heading>
          <Text style={paragraph}>{copy.body}</Text>

          {offerType === 'staycomfy' && (
            <Section style={offer}>
              <Heading as='h2' style={offerHeading}>
                200 kr rabatt per Comfyrobe + gratis frakt
              </Heading>
              <Text style={offerText}>
                Bruk koden <strong>STAYCOMFY</strong> i kassen. Koden
                gjelder én gang per kunde og kan ikke kombineres med
                andre rabatter.
              </Text>
            </Section>
          )}

          <Button href={recoveryUrl} style={button}>
            Fortsett til kassen
          </Button>

          <Text style={finePrint}>
            Tilgjengelighet og endelig pris bekreftes i Shopify-kassen.
          </Text>
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

const main = {
  backgroundColor: '#f0eee9',
  color: '#001211',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  margin: 0,
  padding: '32px 12px'
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #c8d2cf',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px'
}

const brand = {
  color: '#001211',
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '0.14em',
  margin: '0 0 28px'
}

const heading = {
  color: '#001211',
  fontSize: '30px',
  lineHeight: '38px',
  margin: '0 0 16px'
}

const paragraph = {
  color: '#253532',
  fontSize: '17px',
  lineHeight: '28px',
  margin: '0 0 24px'
}

const offer = {
  backgroundColor: '#e5f34a',
  border: '2px solid #001211',
  borderRadius: '8px',
  margin: '0 0 28px',
  padding: '20px'
}

const offerHeading = {
  color: '#001211',
  fontSize: '20px',
  lineHeight: '28px',
  margin: '0 0 8px'
}

const offerText = {
  color: '#001211',
  fontSize: '15px',
  lineHeight: '24px',
  margin: 0
}

const button = {
  backgroundColor: '#001211',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'block',
  fontSize: '17px',
  fontWeight: '700',
  padding: '15px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none'
}

const finePrint = {
  color: '#4d5b58',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '18px 0 0'
}

const rule = { borderColor: '#c8d2cf', margin: '32px 0 20px' }
const footer = { ...finePrint, margin: 0 }
const link = { color: '#123f39', textDecoration: 'underline' }

export default AbandonedCheckoutRecoveryEmail
