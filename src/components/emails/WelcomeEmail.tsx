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

        <Body className='m-0 bg-[#001211] px-3 py-8 font-sans text-foreground'>
          <Container className='mx-auto max-w-150 overflow-hidden rounded-[24px] bg-[#001A18]'>
            <Section className='bg-background px-9 py-10 text-center'>
              <Img
                src={`${siteUrl}/icon.png`}
                width='120'
                height='120'
                alt='Utekos logo'
                className='mx-auto mb-6.5 block'
              />

              <Heading
                as='h1'
                className='font-google-sans m-0 text-[38px] leading-10.5 font-extrabold tracking-[-1px] text-[#f0eee9]'
              >
                Velkommen til varmen
              </Heading>

              <Text className='mx-auto mt-4.5 mb-0 max-w-112.5 text-[17px] leading-6.75 text-[#f0eee9]'>
                Takk for at du meldte deg på nyhetsbrevet. Som
                lovet får du {NEWSLETTER_DISCOUNT_PERCENT} %
                rabatt på allerede nedsatte Comfyrobe™.
              </Text>
            </Section>

            <Img
              src={`${siteUrl}/WelcomeMailComfy.jpg`}
              width='600'
              height='315'
              alt='To venner som nyter en varm stund ute i Utekos'
              className='block h-auto w-full'
            />

            <Section className='bg-[#001A18] px-9 pb-10 pt-4 text-center'>

              <Heading
                as='h2'
                className='font-utekos-text mb-5 text-[18px] leading-9 tracking-normal text-[#f0eee9]'
              >
                Bruk rabattkoden i feltet under ved utsjekk i kassen
              </Heading>
              
              <Section className='mx-auto mb-6 max-w-90 rounded-[14px] border border-[#001A18] bg-[#001211] px-5 py-4.5'>

                <Text className='font-utekos-text-medium my-2 text-[28px] leading-8.5 font-bold tracking-[3px] text-[#f0eee9]'>
                  {NEWSLETTER_DISCOUNT_CODE}
                </Text>
                
              </Section>

              <Button
                href={comfyrobeHref}
                className='font-utekos-text-medium font-bold box-border block w-full mt-8! rounded-[12px] bg-[#bb4d0f]  px-2 p-4 text-center text-[16px] leading-5.5 text-[#f0eee9] no-underline'
              >
                Bruk rabattkoden
              </Button>

            </Section>

            <Section className='px-9 py-10'>
              <Heading
                as='h2'
                className='font-utekos-text-medium m-0 mb-2.5 text-[26px] leading-8 font-bold tracking-[-0.4px] text-[#f0eee9]'
              >
                Dette kan du glede deg til
              </Heading>

              <Text className='m-0 mb-7 text-[16px] leading-6.25 text-[#f0eee9]'>
                Vi sender bare innhold som gir deg noe nyttig,
                inspirerende eller relevant fra Utekos.
              </Text>

              <Row>
                <Column className='w-12 align-top'>
                  <Text className='font-utekos-text-medium m-0 text-[20px] leading-7 font-bold text-[#f0eee9]'>
                    01
                  </Text>
                </Column>

                <Column className='align-top'>
                  <Text className='font-utekos-text-medium m-0 text-[16px] leading-6 font-bold text-[#f0eee9]'>
                    Inspirasjon til flere stunder ute
                  </Text>

                  <Text className='m-0 mt-1 text-[15px] leading-5.75 text-[#f0eee9]'>
                    Ideer for terrasse, hytte, båtliv, bobil og
                    hverdager med frisk luft.
                  </Text>
                </Column>
              </Row>

              <Hr className='my-5.5 border-0 border-t border-solid border-[#d6e3e1]' />

              <Row>
                <Column className='w-12 align-top'>
                  <Text className='font-utekos-text-medium m-0 text-[20px] leading-7 font-bold text-[#f0eee9]'>
                    02
                  </Text>
                </Column>

                <Column className='align-top'>
                  <Text className='font-utekos-text-medium m-0 text-[16px] leading-6 font-bold text-[#f0eee9]'>
                    Nyheter og gode produktråd
                  </Text>

                  <Text className='m-0 mt-1 text-[15px] leading-5.75 text-[#f0eee9]'>
                    Enklere valg, bedre bruk og nytt fra
                    sortimentet.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className='bg-[#012622] px-9 py-8'>
              <Heading
                as='h2'
                className='font-utekos-text-medium m-0 text-[22px] leading-7 font-bold text-[#f0eee9]'
              >
                Lurer du på noe?
              </Heading>

              <Text className='m-0 mt-2 text-[15px] leading-6 text-[#f0eee9]'>
                Vi hjelper deg gjerne. Svar på denne e-posten
                eller{' '}
                <Link
                  href={`${siteUrl}/kontaktskjema`}
                  className='font-utekos-text-medium font-bold text-[#f0eee9] underline'
                >
                  kontakt kundeservice
                </Link>
                .
              </Text>
            </Section>

            <Section className='px-9 py-7 text-center'>
              <Text className='m-0 text-[12px] leading-4.75 text-[#f0eee9]'>
                Du mottar denne e-posten fordi du meldte deg på
                nyhetsbrevet vårt
                {email ? ` med ${email}` : ''}.
              </Text>

              <Text className='m-0 mt-2.5 text-[12px] leading-4.75'>
                <Link
                  href={`${siteUrl}/personvern`}
                  className='text-[#f0eee9] underline'
                >
                  Personvern
                </Link>

                <span className='text-#f0eee9]'> · </span>

                <Link
                  href={unsubscribeHref}
                  className='text-[#f0eee9] underline'
                >
                  Meld meg av
                </Link>
              </Text>

              <Text className='m-0 mt-3.5 text-[11px] leading-4.5 text-[#f0eee9]'>
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
