import * as React from 'react'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset
} from 'react-email'

import {
  NEWSLETTER_DISCOUNT_CODE,
  NEWSLETTER_DISCOUNT_PERCENT
} from '@/components/newsletter-modal/newsletterModalConfig'

interface WelcomeEmailProps {
  email?: string
}

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://utekos.no'
).replace(/\/$/, '')

const comfyrobeHref = `${siteUrl}/comfyrobe`

const unsubscribeHref =
  'mailto:kundeservice@utekos.no?subject=Avmelding%20fra%20nyhetsbrev'

export function WelcomeEmail({ email }: WelcomeEmailProps) {
  const previewText = `Her er din ${NEWSLETTER_DISCOUNT_PERCENT} % rabatt på Comfyrobe – bruk koden ${NEWSLETTER_DISCOUNT_CODE}.`

  return (
    <Html lang='nb'>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />

        <Preview>{previewText}</Preview>

        <Body className='m-0 bg-[#e7efee] px-3 py-8 font-sans text-[#173d3a]'>
          <Container className='mx-auto max-w-150 overflow-hidden rounded-[24px] bg-white'>
            <Section className='bg-[#00343e] px-9 py-10 text-center'>
              <Img
                src={`${siteUrl}/icon.png`}
                width='88'
                height='88'
                alt='Utekos'
                className='mx-auto mb-6.5 block'
              />

              <Text className='font-google-sans m-0 mb-3 text-[13px] leading-4.5 font-bold tracking-[1.5px] text-[#8dd8d0]'>
                HYGGELIG Å HA DEG MED
              </Text>

              <Heading
                as='h1'
                className='font-google-sans m-0 text-[38px] leading-10.5 font-bold tracking-[-1px] text-[#f0eee9]'
              >
                Velkommen inn i varmen
              </Heading>

              <Text className='mx-auto mt-4.5 mb-7 max-w-112.5 text-[17px] leading-6.75 text-[#f0eee9]'>
                Takk for at du meldte deg på nyhetsbrevet. Som
                lovet får du {NEWSLETTER_DISCOUNT_PERCENT} %
                rabatt på Comfyrobe.
              </Text>

              <Button
                href={comfyrobeHref}
                className='font-google-sans box-border block w-full rounded-[12px] bg-[#20c7b8] px-6 py-3.75 text-center text-[16px] leading-5.5 font-bold text-[#001f22] no-underline'
              >
                Se Comfyrobe
              </Button>
            </Section>

            <Img
              src={`${siteUrl}/email/welcome-hero.jpg`}
              width='600'
              height='315'
              alt='To venner som nyter en varm stund ute i Utekos'
              className='block h-auto w-full'
            />

            <Section className='bg-[#dff4f0] px-9 py-10 text-center'>
              <Text className='font-google-sans m-0 text-[12px] leading-4.5 font-bold tracking-[1.6px] text-[#007a74]'>
                DIN RABATT
              </Text>

              <Heading
                as='h2'
                className='font-google-sans m-0 mt-2 text-[30px] leading-9 font-bold tracking-[-0.5px] text-[#00343e]'
              >
                Spar {NEWSLETTER_DISCOUNT_PERCENT} % på Comfyrobe
              </Heading>

              <Text className='mx-auto mt-3 mb-0 max-w-110 text-[16px] leading-6.25 text-[#365c58]'>
                Skriv inn rabattkoden i handlekurven eller i
                kassen når du handler Comfyrobe.
              </Text>

              <Section className='mx-auto mt-6 mb-6 max-w-90 rounded-[14px] border border-solid border-[#007a74] bg-white px-5 py-4.5'>
                <Text className='font-google-sans m-0 text-[11px] leading-4 font-bold tracking-[1.4px] text-[#526b68]'>
                  RABATTKODE
                </Text>

                <Text className='font-google-sans m-0 mt-1.75 font-mono text-[28px] leading-8.5 font-bold tracking-[3px] text-[#00343e]'>
                  {NEWSLETTER_DISCOUNT_CODE}
                </Text>
              </Section>

              <Button
                href={comfyrobeHref}
                className='font-google-sans box-border block w-full rounded-[12px] bg-[#007a74] px-6 py-3.75 text-center text-[16px] leading-5.5 font-bold text-white no-underline'
              >
                Bruk rabatten på Comfyrobe
              </Button>

              <Text className='m-0 mt-3.5 text-[13px] leading-5.25 text-[#526b68]'>
                Rabattkoden må være aktiv i Shopify for å kunne
                brukes.
              </Text>
            </Section>

            <Section className='px-9 py-10'>
              <Heading
                as='h2'
                className='font-google-sans m-0 mb-2.5 text-[26px] leading-8 font-bold tracking-[-0.4px] text-[#00343e]'
              >
                Dette kan du glede deg til
              </Heading>

              <Text className='m-0 mb-7 text-[16px] leading-6.25 text-[#365c58]'>
                Vi sender bare innhold som gir deg noe nyttig,
                inspirerende eller relevant fra Utekos.
              </Text>

              <Row>
                <Column className='w-12 align-top'>
                  <Text className='font-google-sans m-0 text-[20px] leading-7 font-bold text-[#007a74]'>
                    01
                  </Text>
                </Column>

                <Column className='align-top'>
                  <Text className='font-google-sans m-0 text-[16px] leading-6 font-bold text-[#00343e]'>
                    Inspirasjon til flere stunder ute
                  </Text>

                  <Text className='m-0 mt-1 text-[15px] leading-5.75 text-[#365c58]'>
                    Ideer for terrasse, hytte, båtliv, bobil og
                    hverdager med frisk luft.
                  </Text>
                </Column>
              </Row>

              <Hr className='my-5.5 border-0 border-t border-solid border-[#d6e3e1]' />

              <Row>
                <Column className='w-12 align-top'>
                  <Text className='font-google-sans m-0 text-[20px] leading-7 font-bold text-[#007a74]'>
                    02
                  </Text>
                </Column>

                <Column className='align-top'>
                  <Text className='font-google-sans m-0 text-[16px] leading-6 font-bold text-[#00343e]'>
                    Nyheter og gode produktråd
                  </Text>

                  <Text className='m-0 mt-1 text-[15px] leading-5.75 text-[#365c58]'>
                    Enklere valg, bedre bruk og nytt fra
                    sortimentet.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className='bg-[#f0eee9] px-9 py-8'>
              <Heading
                as='h2'
                className='font-google-sans m-0 text-[22px] leading-7 font-bold text-[#00343e]'
              >
                Lurer du på noe?
              </Heading>

              <Text className='m-0 mt-2 text-[15px] leading-6 text-[#365c58]'>
                Vi hjelper deg gjerne. Svar på denne e-posten
                eller{' '}
                <Link
                  href={`${siteUrl}/kontaktskjema`}
                  className='font-google-sans font-bold text-[#005f5a] underline'
                >
                  kontakt kundeservice
                </Link>
                .
              </Text>
            </Section>

            <Section className='px-9 py-7 text-center'>
              <Text className='m-0 text-[12px] leading-4.75 text-[#526b68]'>
                Du mottar denne e-posten fordi du meldte deg på
                nyhetsbrevet vårt
                {email ? ` med ${email}` : ''}.
              </Text>

              <Text className='m-0 mt-2.5 text-[12px] leading-4.75'>
                <Link
                  href={`${siteUrl}/personvern`}
                  className='text-[#365c58] underline'
                >
                  Personvern
                </Link>

                <span className='text-[#8aa09d]'> · </span>

                <Link
                  href={unsubscribeHref}
                  className='text-[#365c58] underline'
                >
                  Meld meg av
                </Link>
              </Text>

              <Text className='m-0 mt-3.5 text-[11px] leading-4.5 text-[#6b817e]'>
                KELC AS · Lille Damsgårdsveien 25 · 5162 Laksevåg
                <br />© {new Date().getFullYear()} Utekos. Alle
                rettigheter forbeholdt.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  email: 'kunde@eksempel.no'
} satisfies WelcomeEmailProps

export default WelcomeEmail
