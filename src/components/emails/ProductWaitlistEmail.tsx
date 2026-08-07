import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text
} from 'react-email'
import * as React from 'react'

import type { ProductWaitlistData } from '@/db/zod/schemas/ProductWaitlistSchema'

const siteBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://utekos.no'

export type ProductWaitlistEmailProps = ProductWaitlistData & {
  productLabel: string
}

export function ProductWaitlistEmail({
  name,
  email,
  phone,
  marketing,
  productLabel
}: ProductWaitlistEmailProps): React.JSX.Element {
  const previewText = `Ny ventelistepåmelding for ${productLabel}`

  return (
    <Html lang='nb'>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <article style={header}>
            <Img
              src={`${siteBaseUrl}/icon.png`}
              width='48'
              height='48'
              alt='Utekos Logo'
              style={logoImg}
            />
          </article>

          <article style={content}>
            <Heading as='h1' style={title}>
              Ny ventelistepåmelding
            </Heading>
            <Text style={paragraph}>
              En kunde har meldt seg på ventelisten for {productLabel}.
            </Text>
          </article>

          <article style={detailsSection}>
            <Heading as='h2' style={subTitle}>
              Kundedetaljer
            </Heading>
            <Text style={detailText}>
              <strong>Produkt:</strong> {productLabel}
            </Text>
            <Text style={detailText}>
              <strong>Navn:</strong> {name}
            </Text>
            <Text style={detailText}>
              <strong>Telefon:</strong> {phone}
            </Text>
            <Text style={detailText}>
              <strong>E-post:</strong>{' '}
              <Link href={`mailto:${email}`} style={link}>
                {email}
              </Link>
            </Text>
            <Text style={detailText}>
              <strong>Markedsføringssamtykke:</strong>{' '}
              {marketing ? 'Ja' : 'Nei'}
            </Text>
          </article>

          <article style={noticeSection}>
            <Text style={noticeText}>
              {marketing ?
                'Kunden har godtatt kontakt om denne produktventelisten og samtykket til nyheter og tilbud på e-post.'
              : 'Kunden har godtatt kontakt om denne produktventelisten. Dette er ikke et generelt markedsføringssamtykke.'}
            </Text>
          </article>

          <Hr style={hr} />

          <article style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Utekos. Alle rettigheter
              forbeholdt.
            </Text>
          </article>
        </Container>
      </Body>
    </Html>
  )
}

ProductWaitlistEmail.PreviewProps = {
  name: 'Ola Nordmann',
  email: 'ola@example.com',
  phone: '+47 400 00 000',
  productHandle: 'utekos-dun',
  privacy: true,
  marketing: false,
  productLabel: 'Utekos Dun'
} satisfies ProductWaitlistEmailProps

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  border: '1px solid #e6ebf1',
  borderRadius: '8px'
}

const header = {
  padding: '20px 40px',
  borderBottom: '1px solid #e6ebf1',
  textAlign: 'center' as const
}

const logoImg = { margin: '0 auto', display: 'block' as const }
const content = { padding: '30px 40px' }

const title = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 15px'
}

const paragraph = {
  color: '#555555',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0'
}

const detailsSection = { padding: '0 40px' }

const subTitle = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '20px 0 10px'
}

const detailText = {
  color: '#555555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '4px 0'
}

const noticeSection = {
  backgroundColor: '#f6f9fc',
  margin: '20px 40px',
  padding: '20px',
  borderRadius: '6px',
  border: '1px solid #e6ebf1'
}

const noticeText = {
  ...paragraph,
  margin: '0'
}

const link = { color: '#2a4234', textDecoration: 'underline' }

const hr = { borderColor: '#e6ebf1', margin: '40px 0' }

const footer = { padding: '0 40px' }

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '16px'
}
