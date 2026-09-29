'use client'

import { Loader2 } from 'lucide-react'
import type { RefObject } from 'react'
import { KlarnaIdentityButton } from '@/components/klarna/components/KlarnaIdentityButton'

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
      className='fixed inset-x-4 top-[calc(100dvh*5/6)] z-120 mx-auto flex max-w-[calc(100vw-2rem)] -translate-y-1/2 flex-col gap-3 md:top-1/2'
    >
      <div
        ref={buttonContainerRef}
        aria-busy={showFacebookStatus}
        className='relative h-10 w-full overflow-hidden rounded-[4px]'
      >
        {visualPreview ?
          <button
            type='button'
            disabled
            aria-describedby='facebook-login-development-preview'
            title='Visuell forhåndsvisning – Facebook-innlogging er ikke aktivert lokalt'
            className='flex h-10 w-full cursor-not-allowed items-center justify-center rounded-[4px] bg-[#1877F2] px-3 font-sans text-base font-bold leading-none text-white'
          >
            <span className='inline-flex items-center gap-2'>
              <svg
                aria-hidden='true'
                viewBox='0 0 24 24'
                className='size-6 shrink-0 fill-white'
                focusable='false'
              >
                <path d='M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.791 8.791 0 0 0-.653-.036c-1.018 0-1.525.535-1.525 1.64v2.331h3.32l-.532 3.667h-2.788v7.98H9.101z' />
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
            className='absolute inset-0 flex h-10 w-full items-center justify-center rounded-[4px] bg-[#1877F2] font-sans text-base font-bold leading-none text-white'
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

      <KlarnaIdentityButton
        width={buttonWidth}
        onSignIn={onContinueWithoutFacebook}
      />

      <button
        type='button'
        onClick={onContinueWithoutFacebook}
        className='mx-auto min-h-11 px-4 font-sans font-medium text-sm text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
      >
        Fortsett uten innlogging
      </button>
    </aside>
  )
}
