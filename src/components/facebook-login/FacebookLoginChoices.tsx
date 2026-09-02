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
        className='relative h-[30px] w-full overflow-hidden rounded-[3px]'
      >
        {visualPreview ?
          <button
            type='button'
            disabled
            aria-describedby='facebook-login-development-preview'
            title='Visuell forhåndsvisning – Facebook-innlogging er ikke aktivert lokalt'
            className='relative flex h-[30px] w-full cursor-not-allowed items-center justify-center rounded-[3px] bg-[#1877F2] px-3 text-[13px] font-bold text-white'
          >
            <span
              aria-hidden='true'
              className='absolute left-3 text-[21px] leading-none font-black'
            >
              f
            </span>
            Fortsett med Facebook
          </button>
        : sdkReady ?
          <div
            className={`h-[30px] w-full overflow-hidden ${
              buttonRendered && !pending && !loginUnavailable ?
                'visible'
              : 'invisible'
            }`}
          >
            <div
              className='fb-login-button w-full'
              data-max-rows='1'
              data-width={buttonWidth}
              data-size='medium'
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
            className='absolute inset-0 flex h-[30px] w-full items-center justify-center rounded-[3px] bg-[#1877F2] text-[13px] font-bold text-white'
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
        className='h-[30px] w-full gap-3 rounded-[3px] border border-white/15 bg-jungle px-3 text-[13px] leading-none text-white hover:bg-jungle-tone hover:opacity-100'
      >
        <span
          aria-hidden='true'
          className='flex size-5 items-center justify-center rounded-full bg-primary'
        >
          <span className="size-3 bg-white [mask-image:url('/IconWhite.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" />
        </span>
        <span className='font-utekos-text-medium'>
          Fortsett til Utekos
        </span>
      </Button>
    </aside>
  )
}
