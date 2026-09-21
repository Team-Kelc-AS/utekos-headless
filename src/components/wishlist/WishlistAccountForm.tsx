'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WishlistFacebookLogin } from './WishlistFacebookLogin'

export function WishlistAccountForm({
  returnTo
}: {
  returnTo: string
}) {
  const emailId = useId()
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)
  const authorizeHref = `/customer/account/authorize?${new URLSearchParams({ returnTo })}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const email = event.currentTarget.elements.namedItem(
      'email'
    ) as HTMLInputElement
    if (!email.validity.valid || pending) {
      event.preventDefault()
      if (!email.validity.valid) {
        setError(true)
        email.focus()
      }
      return
    }
    setError(false)
    setPending(true)
  }

  return (
    <div className='min-w-0 space-y-5'>
      <WishlistFacebookLogin returnTo={returnTo} />
      <div className='flex items-center gap-3 text-sm text-foreground/78'>
        <span className='h-px flex-1 bg-foreground/18' />
        <span>Eller fortsett med</span>
        <span className='h-px flex-1 bg-foreground/18' />
      </div>
      <form
        action='/customer/account/authorize'
        method='get'
        noValidate
        onSubmit={handleSubmit}
        className='space-y-4'
      >
        <input type='hidden' name='returnTo' value={returnTo} />
        <input type='hidden' name='mode' value={mode} />
        <div className='space-y-2'>
          <label
            htmlFor={emailId}
            className='font-sans text-sm font-medium'
          >
            E-postadresse
          </label>
          <Input
            id={emailId}
            name='email'
            type='email'
            autoComplete='email'
            inputMode='email'
            required
            aria-invalid={error}
            aria-describedby={`${emailId}-help${error ? ` ${emailId}-error` : ''}`}
            onChange={() => {
              if (error) setError(false)
            }}
            className='h-12 rounded-xl border-foreground/35 bg-jungle px-4 font-sans text-base text-foreground focus-visible:ring-primary'
          />
          <p
            id={`${emailId}-help`}
            className='text-sm leading-6 text-foreground/78'
          >
            Du får en kode på e-post i neste steg. Du trenger
            ikke passord.
          </p>
          {error ?
            <p
              id={`${emailId}-error`}
              role='alert'
              className='text-sm text-destructive'
            >
              Skriv inn en gyldig e-postadresse.
            </p>
          : null}
        </div>
        <Button
          type='submit'
          disabled={pending}
          aria-busy={pending}
          data-track={
            mode === 'create' ?
              'WishlistCreateAccountClick'
            : 'WishlistLoginClick'
          }
          className='hover:bg-primary-hover h-12 w-full rounded-xl bg-primary font-sans text-base font-semibold text-primary-foreground'
        >
          {pending ?
            'Åpner innlogging …'
          : mode === 'create' ?
            'Opprett konto'
          : 'Fortsett med e-post'}
        </Button>
      </form>
      <p className='text-sm text-foreground/78'>
        {mode === 'login' ?
          'Har du ikke konto? '
        : 'Har du allerede konto? '}
        <button
          type='button'
          disabled={pending}
          onClick={() =>
            setMode(mode === 'login' ? 'create' : 'login')
          }
          className='inline-flex min-h-11 cursor-pointer items-center rounded-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
        >
          {mode === 'login' ? 'Registrer deg' : 'Logg inn'}
        </button>
      </p>
      <div className='space-y-2 border-t border-foreground/18 pt-4'>
        <Button
          asChild
          variant='outline'
          className='h-12 w-full rounded-xl border-foreground/35 bg-transparent font-sans text-base text-foreground hover:bg-foreground/10'
        >
          <a href={authorizeHref}>Google</a>
        </Button>
        <p className='text-sm leading-6 text-foreground/78'>
          Velg Google på innloggingssiden hvis det er
          tilgjengelig for kontoen din.
        </p>
      </div>
    </div>
  )
}
