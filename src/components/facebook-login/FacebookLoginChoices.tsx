'use client'

import { Loader2 } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'

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
      className='fixed inset-x-4 top-1/2 z-120 mx-auto flex max-w-[calc(100vw-2rem)] -translate-y-1/2 flex-col gap-3'
    >
      <div
        ref={buttonContainerRef}
        aria-busy={showFacebookStatus}
        className='relative h-10 w-full overflow-hidden rounded-sm'
      >
        {visualPreview ?
          <button
            type='button'
            disabled
            aria-describedby='facebook-login-development-preview'
            title='Visuell forhåndsvisning – Facebook-innlogging er ikke aktivert lokalt'
            className='flex h-10 w-full cursor-not-allowed items-center justify-center rounded-sm bg-[#1877F2] px-4 font-sans text-base font-bold text-white'
          >
            <span className='inline-flex items-center gap-3'>
              <svg
                aria-hidden='true'
                viewBox='0 0 24 24'
                className='size-6 shrink-0'
                focusable='false'
              >
                <circle cx='12' cy='12' r='12' fill='white' />
                <path
                  fill='#1877F2'
                  d='M13.6 22.9v-9.8h3.3l.5-3.8h-3.8V6.9c0-1.1.3-1.8 1.9-1.8h2V1.7c-.3 0-1.5-.1-2.9-.1-2.9 0-4.9 1.8-4.9 5v2.8H6.4v3.8h3.3v9.8c.7.2 1.3.2 2 .2.6 0 1.3-.1 1.9-.3Z'
                />
              </svg>
              <span>Fortsett med Facebook</span>
            </span>
          </button>
        : sdkReady ?
          <div
            className={`h-10 w-full overflow-hidden ${
              buttonRendered && !pending && !loginUnavailable ?
                'visible'
              : 'invisible'
            }`}
          >
            <div
              className='fb-login-button w-full'
              data-max-rows='1'
              data-width={buttonWidth}
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
            className='absolute inset-0 flex h-10 w-full items-center justify-center rounded-sm bg-[#1877F2] font-sans text-base font-bold text-white'
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

      <Button
        type='button'
        variant='utekos'
        onClick={onContinueWithoutFacebook}
        aria-label='Fortsett til Utekos uten Facebook-innlogging'
        className='h-10 w-full gap-3 rounded-sm border border-white/15 bg-jungle px-4 font-sans text-base leading-none text-white hover:bg-jungle-tone hover:opacity-100'
      >
        <span
          aria-hidden='true'
          className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary'
        >
          <span className="size-3.5 bg-white [mask-image:url('/IconWhite.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" />
        </span>
        <span className='font-utekos-text-medium'>
          Fortsett til Utekos
        </span>
      </Button>
    </aside>
  )
}
