'use client'

import { Loader2 } from 'lucide-react'
import type { RefObject } from 'react'
import { KlarnaIdentityButton } from '@/components/klarna/components/KlarnaIdentityButton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/card'

const CARD_HORIZONTAL_INSET_PX = 34

export function FacebookLoginChoices({
  buttonWidth,
  buttonContainerRef,
  buttonRendered,
  loginUnavailable,
  onContinueWithoutFacebook,
  pending,
  sdkReady,
  visualPreview = false
}: {
  buttonWidth: number
  buttonContainerRef: RefObject<HTMLDivElement | null>
  buttonRendered: boolean
  loginUnavailable: boolean
  onContinueWithoutFacebook: () => void
  pending: boolean
  sdkReady: boolean
  visualPreview?: boolean
}) {
  const showFacebookStatus =
    !visualPreview &&
    (loginUnavailable || pending || !buttonRendered)

  return (
    <aside
      aria-label='Velg hvordan du vil fortsette'
      style={{ width: buttonWidth }}
      className='fixed inset-x-4 top-1/2 z-120 mx-auto w-full max-w-[calc(100vw-2rem)] -translate-y-1/2'
    >
      <Card className='gap-0 border border-[#010B0A]/10 bg-white py-4 text-[#010B0A] shadow-xl ring-0'>
        <CardContent className='flex flex-col gap-3 px-4'>
          <div
            ref={buttonContainerRef}
            aria-busy={showFacebookStatus}
            className='relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg'
          >
            {visualPreview ?
              <Button
                type='button'
                disabled
                aria-describedby='facebook-login-development-preview'
                title='Visuell forhåndsvisning – Facebook-innlogging er ikke aktivert lokalt'
                className='h-12 w-full rounded-lg bg-[#1877F2] px-3 font-sans text-base font-medium text-white disabled:opacity-100'
              >
                <span className='inline-flex items-center gap-2'>
                  {/* Serve Meta's original logo file without transformation. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src='/facebook-logo-secondary.png'
                    alt=''
                    aria-hidden='true'
                    width={24}
                    height={24}
                    className='size-6 shrink-0'
                  />
                  <span>Logg inn med Facebook</span>
                </span>
              </Button>
            : sdkReady ?
              <div
                className={`flex h-12 w-full items-center justify-center overflow-hidden ${
                  (
                    buttonRendered &&
                    !pending &&
                    !loginUnavailable
                  ) ?
                    'visible'
                  : 'invisible'
                }`}
              >
                <div
                  className='fb-login-button w-full'
                  data-max-rows='1'
                  data-width={
                    buttonWidth - CARD_HORIZONTAL_INSET_PX
                  }
                  data-size='large'
                  data-button-type='continue_with'
                  data-auto-logout-link='false'
                  data-use-continue-as='true'
                  data-scope='public_profile,email'
                  data-onlogin='utekosFacebookLoginOnLogin();'
                />
              </div>
            : null}

            {showFacebookStatus ?
              <div
                role='status'
                className='absolute inset-0 flex h-12 w-full items-center justify-center rounded-lg bg-[#1877F2] font-sans text-base leading-none font-medium text-white'
              >
                {loginUnavailable ?
                  'Facebook er ikke tilgjengelig'
                : <>
                    <Loader2
                      aria-hidden='true'
                      className='mr-2 size-4 animate-spin'
                    />
                    {pending ?
                      'Fullfører med Facebook'
                    : 'Laster Facebook'}
                  </>
                }
              </div>
            : null}
          </div>

          {visualPreview ?
            <span
              id='facebook-login-development-preview'
              className='sr-only'
            >
              Bare visuell forhåndsvisning i lokal utvikling
            </span>
          : null}

          <div
            className={
              visualPreview ? 'pointer-events-none' : undefined
            }
            inert={visualPreview}
            aria-hidden={visualPreview}
          >
            <KlarnaIdentityButton
              width='100%'
              onSignIn={onContinueWithoutFacebook}
            />
          </div>
        </CardContent>

        <CardFooter className='justify-center px-4 pt-2'>
          <Button
            type='button'
            variant='link'
            disabled={visualPreview}
            onClick={onContinueWithoutFacebook}
            className='min-h-11 text-[#010B0A] underline-offset-4 hover:underline'
          >
            Fortsett uten innlogging
          </Button>
        </CardFooter>
      </Card>
    </aside>
  )
}
