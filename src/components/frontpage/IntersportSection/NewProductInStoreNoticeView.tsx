import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { cn } from '@/lib/utils/className'
import IntersportLogo from '@public/logo/Intersport_logo.svg'
import type { Route } from 'next'
import { H2 } from '@/components/typography/TypographyH2'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

interface NewProductInStoreNoticeViewProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  logoBoxRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  mapsUrl: string
}

export function NewProductInStoreNoticeView({
  containerRef,
  logoBoxRef,
  contentRef,
  mapsUrl
}: NewProductInStoreNoticeViewProps) {
  return (
    <PageSection as='article' background='muted'>
      <div
        ref={containerRef}
        className={cn(
          'relative isolate mx-auto overflow-hidden rounded-3xl border border-border bg-background p-6 px-4 text-card-foreground shadow-2xl sm:p-10 md:max-w-6xl md:px-8 lg:px-12'
        )}
      >
        <div
          className='pointer-events-none absolute top-0 left-1/2 -z-20 h-125 w-125 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[100px]'
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklch, var(--card-foreground) 24%, transparent) 0%, transparent 70%)'
          }}
        />

        <div className='flex flex-col items-center gap-8 text-center'>
          <div className='relative flex h-32 w-full items-center justify-center overflow-visible'>
            <div className='absolute top-1/2 left-1/2 z-0 flex h-1 w-1 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-visible'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={`smoke-${i}`}
                  className={`smoke-particle absolute h-20 w-20 rounded-full blur-xl ${
                    i % 2 === 0 ? 'bg-night/80' : 'bg-night'
                  }`}
                  style={{ left: i * 5, top: i * 2 }}
                />
              ))}

              {[...Array(8)].map((_, i) => (
                <div
                  key={`spark-${i}`}
                  className={`spark-particle absolute h-1 w-1 rounded-full blur-[1px] ${
                    i % 2 === 0 ?
                      'bg-yellow-500'
                    : 'bg-yellow-600'
                  }`}
                  style={{ left: i * 2, top: i * 2 }}
                />
              ))}
            </div>

            <div
              ref={logoBoxRef}
              className='relative z-10 flex h-16 items-center justify-center rounded-2xl border-2 border-white/90 bg-white px-8 shadow-[0_0_30px_rgba(255,255,255,0.2)] will-change-transform'
            >
              <Image
                src={IntersportLogo}
                alt='Intersport logo'
                width={1024}
                height={112}
                className='h-auto w-full max-w-30'
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            </div>
          </div>

          <div
            ref={contentRef}
            className='flex w-full min-w-0 flex-col gap-6 px-2 sm:px-8 md:px-12'
          >
            <H2
              ID='intersport-laksevag-heading'
              className='font-google-sans pb-0 text-left text-3xl leading-tight font-bold tracking-normal text-foreground md:text-4xl lg:text-5xl'
            >
              Sjekk ut Utekos på Intersport Laksevåg!
            </H2>

            <P className='-mt-2 w-full max-w-4xl text-left text-xl leading-snug tracking-normal text-foreground sm:text-2xl'>
              Se, prøve og kjenne på{' '}
              <InlineText
                as='strong'
                className='font-utekos-text-medium text-foreground'
              >
                Utekos TechDown™
              </InlineText>{' '}
              hos våre gode venner på Intersport Laksevåg. Ta
              turen innom for å bli en av de første som får
              oppleve den neste generasjonen av Utekos!
            </P>

            <Button
              asChild
              variant='alternate'
              size='lg'
              className='group mt-4 h-12 w-fit max-w-sm min-w-0 rounded-3xl px-8 py-6 text-center text-base leading-tight whitespace-normal sm:w-auto sm:px-12 sm:text-lg sm:whitespace-nowrap'
            >
              <Link
                href={mapsUrl as Route}
                target='_blank'
                className='flex items-center gap-2 font-utekos-text'
              >
                <InlineText>Vis vei til butikken</InlineText>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PageSection>
  )
}
