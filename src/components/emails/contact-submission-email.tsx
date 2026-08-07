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
import type { ServerContactFormData } from '@/db/zod/schemas/ServerContactFormSchema'

const siteBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://utekos.no'

export function ContactSubmissionEmail(
  props: ServerContactFormData
): React.JSX.Element {
  const { name, email, phone, country, orderNumber, message } =
    props
  const previewText = `Ny henvendelse fra ${name} via kontaktskjemaet`

  return (
    <Html lang='nb'>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <article style={header}>
            <Img
              src={`${siteBaseUrl}/icon.png`}
              width='48' // Juster bredde etter behov
              height='48' // Juster høyde etter behov
              alt='Utekos Logo'
              style={logoImg}
            />
          </article>

          <article style={content}>
            <Heading as='h1' style={title}>
              Ny henvendelse fra kontaktskjema
            </Heading>
            <Text style={paragraph}>
              En ny henvendelse har blitt sendt inn via
              kontaktskjemaet på utekos.no.
            </Text>
          </article>

          <article style={detailsSection}>
            <Heading as='h2' style={subTitle}>
              Innsenders detaljer
            </Heading>
            <Text style={detailText}>
              <strong>Navn:</strong> {name}
            </Text>
            <Text style={detailText}>
              <strong>E-post:</strong>{' '}
              <Link href={`mailto:${email}`} style={link}>
                {email}
              </Link>
            </Text>
            {phone && (
              <Text style={detailText}>
                <strong>Telefon:</strong> {phone}
              </Text>
            )}
            <Text style={detailText}>
              <strong>Land:</strong> {country}
            </Text>
            {orderNumber && (
              <Text style={detailText}>
                <strong>Ordrenummer:</strong> {orderNumber}
              </Text>
            )}
          </article>

          <article style={messageSection}>
            <Heading as='h2' style={subTitle}>
              Melding
            </Heading>
            <Text style={messageText}>{message}</Text>
          </article>

          <Hr style={hr} />

          <article style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Utekos. Alle
              rettigheter forbeholdt.
            </Text>
          </article>
        </Container>
      </Body>
    </Html>
  )
}

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
  color: '#555',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0'
}

const detailsSection = { padding: '0 40px' }

const subTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '20px 0 10px'
}

const detailText = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '4px 0'
}

const messageSection = {
  backgroundColor: '#f6f9fc',
  margin: '20px 40px',
  padding: '20px',
  borderRadius: '6px',
  border: '1px solid #e6ebf1'
}

const messageText = {
  ...paragraph,
  whiteSpace: 'pre-wrap' as const
}

const link = { color: '#2a4234', textDecoration: 'underline' }

const hr = { borderColor: '#e6ebf1', margin: '40px 0' }

const footer = { padding: '0 40px' }

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '16px'
}
