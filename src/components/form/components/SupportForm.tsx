'use client'

import { SupportPageButton } from '@/app/kontaktskjema/components/SupportPageButton'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { countries } from '@/constants/countries'
import { ClientContactFormSchema } from '@/db/zod/schemas/ClientContactFormSchema'
import {
  submitContactForm,
  type ContactFormState
} from '@/lib/actions/submitContactForm'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from '@/db/zod/zodClient'

type ContactFormData = z.infer<typeof ClientContactFormSchema>

const initialState: ContactFormState = { message: '' }
const contactFieldClassName =
  'h-12 rounded-lg border-foreground dark:border-dark-foreground bg-jungle font-utekos-text text-foreground/70 tracking-normal placeholder:text-muted-foreground dark:placeholder:text-dark-muted-foreground focus-visible:border-primary dark:focus-visible:border-dark-primary focus-visible:ring-primary/35 dark:focus-visible:ring-dark-primary/35'

export function SupportForm({
  idPrefix = 'contact'
}: {
  idPrefix?: string
}) {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  )

  const form = useForm<ContactFormData>({
    resolver: zodResolver(ClientContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      orderNumber: '',
      message: '',
      privacy: false
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    criteriaMode: 'all'
  })
  const lastStateRef = useRef<ContactFormState | null>(null)

  useEffect(() => {
    // Ikke gjør noe hvis tilstanden er den samme som den vi nettopp behandlet
    if (state === lastStateRef.current || !state.message) {
      return
    }

    if (state.errors) {
      toast.error('Validering feilet', {
        description: 'Vennligst sjekk feltene med feilmeldinger.'
      })
      Object.entries(state.errors).forEach(([key, value]) => {
        if (value && value.length > 0) {
          form.setError(key as keyof ContactFormData, {
            type: 'server',
            message: value[0] ?? 'Det oppstod en ukjent feil.'
          })
        }
      })
    } else {
      toast.success(state.message)
      form.reset()
    }

    lastStateRef.current = state
  }, [state, form])

  const messageMin = 10

  return (
    <Form {...form}>
      <form
        id={`${idPrefix}-form`}
        action={formAction}
        className='space-y-6'
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='leading-text-paragraph font-utekos-text font-medium tracking-normal text-foreground'>
                E-post
              </FormLabel>
              <FormControl>
                <Input
                  id='_r_u_-form-item'
                  placeholder='din@epost.no'
                  autoComplete='email'
                  {...field}
                  className={contactFieldClassName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='leading-text-paragraph font-utekos-text font-medium tracking-normal text-foreground'>
                  Fullt navn
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Ditt navn'
                    autoComplete='name'
                    {...field}
                    className={contactFieldClassName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='leading-text-paragraph font-utekos-text font-medium tracking-normal text-foreground'>
                  Telefon (valgfritt)
                </FormLabel>
                <FormControl>
                  <Input
                    type='tel'
                    placeholder='+47 123 45 678'
                    autoComplete='tel'
                    {...field}
                    className={contactFieldClassName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name='country'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='leading-text-paragraph font-utekos-text font-medium tracking-normal text-foreground'>
                Land
              </FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <div>
                    <input
                      type='hidden'
                      name={field.name}
                      value={field.value ?? ''}
                    />
                    <SelectTrigger className='dark:border-dark-foreground dark:focus-visible:border-dark-primary dark:focus-visible:ring-dark-primary/35 dark:data-placeholder:text-dark-muted-foreground dark:[&_svg:not([class*=text-])]:text-dark-card-foreground h-12 w-full rounded-lg border-foreground bg-jungle tracking-normal text-foreground/70 focus-visible:border-primary focus-visible:ring-primary/35 data-placeholder:text-muted-foreground [&_svg:not([class*=text-])]:text-card-foreground'>
                      <SelectValue
                        placeholder='Velg ditt land'
                        className='bg-jungle text-foreground/70'
                      />
                    </SelectTrigger>
                  </div>
                </FormControl>
                <SelectContent className='dark:border-dark-foreground border-foreground bg-card text-card-foreground'>
                  {countries.map(country => (
                    <SelectItem
                      key={country.value}
                      value={country.value}
                      className='dark:focus:bg-dark-secondary dark:focus:text-dark-secondary-foreground tracking-normal focus:bg-secondary focus:text-secondary-foreground'
                    >
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='orderNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='leading-text-paragraph font-utekos-text font-medium tracking-normal text-foreground'>
                Ordrenummer (valgfritt)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='F.eks. #12345'
                  {...field}
                  className={contactFieldClassName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='message'
          render={({ field, fieldState }) => {
            const messageChars = field.value.length
            const showMessageMinimumError =
              Boolean(fieldState.error) &&
              messageChars < messageMin

            return (
              <FormItem>
                <FormLabel className='leading-text-paragraph font-utekos-text font-medium tracking-normal text-foreground'>
                  Hvordan kan vi hjelpe?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Skriv meldingen din her...'
                    {...field}
                    onChange={event => {
                      field.onChange(event)
                      if (
                        event.target.value.length >= messageMin
                      ) {
                        form.clearErrors('message')
                      }
                    }}
                    className='dark:border-dark-foreground dark:placeholder:text-dark-muted-foreground dark:focus-visible:border-dark-primary dark:focus-visible:ring-dark-primary/35 min-h-40 rounded-lg border-foreground bg-jungle font-utekos-text tracking-normal text-foreground/70 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/35'
                  />
                </FormControl>
                <div className='leading-text-paragraph mt-1 flex items-center justify-between text-xs tracking-normal text-foreground'>
                  <span
                    className={
                      showMessageMinimumError ?
                        'dark:text-dark-destructive text-destructive'
                      : undefined
                    }
                  >
                    {showMessageMinimumError ?
                      `Må være minst ${messageMin} tegn.`
                    : messageChars >= messageMin ?
                      'Ser bra ut'
                    : 'Skriv minst 10 tegn'
                    }
                  </span>
                  <span>
                    {messageChars}/{messageMin} tegn
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <FormField
          control={form.control}
          name='privacy'
          render={({ field }) => (
            <FormItem className='dark:border-dark-foreground relative flex flex-row items-center justify-between rounded-lg border border-foreground bg-jungle p-4 text-card-foreground'>
              <div className='flex-1 space-y-0.5 pr-4'>
                <FormLabel className='leading-text-paragraph font-utekos-text-medium text-base tracking-normal text-foreground'>
                  Personvern
                </FormLabel>
                <FormDescription className='leading-text-paragraph font-utekos-text tracking-normal text-card-foreground'>
                  Jeg bekrefter at jeg har lest{' '}
                  <Link
                    href='/personvern'
                    className='dark:hover:text-dark-primary text-card-foreground underline underline-offset-4 hover:text-primary'
                  >
                    personvernerklæringen
                  </Link>
                  , som forklarer hvordan opplysningene behandles
                  for å besvare henvendelsen.
                </FormDescription>
              </div>
              <FormControl>
                <div>
                  <input
                    type='hidden'
                    name={field.name}
                    value={field.value ? 'on' : ''}
                  />
                  <Switch
                    id={`${idPrefix}-consent`}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className='dark:border-dark-foreground dark:data-[state=checked]:bg-dark-primary dark:data-[state=unchecked]:bg-dark-card dark:focus-visible:ring-dark-primary/35 border border-foreground focus-visible:ring-primary/35 data-[state=checked]:bg-primary data-[state=unchecked]:bg-card'
                  />
                </div>
              </FormControl>
              <FormMessage className='absolute -bottom-5 left-0' />
            </FormItem>
          )}
        />
        <SupportPageButton
          type='submit'
          isBusy={isPending}
          disabled={isPending}
        >
          {isPending ? 'Sender…' : 'Snakk med Utekos'}
        </SupportPageButton>
      </form>
    </Form>
  )
}
