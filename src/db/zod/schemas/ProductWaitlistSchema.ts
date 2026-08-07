import { z } from 'zod'

export const productWaitlistEntryPointSchema = z.enum([
  'product_page',
  'product_card'
])

export type ProductWaitlistEntryPoint = z.infer<
  typeof productWaitlistEntryPointSchema
>

export const ProductWaitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Skriv inn navnet ditt.')
    .max(100, 'Navnet kan ikke være lengre enn 100 tegn.'),
  phone: z
    .string()
    .trim()
    .min(5, 'Skriv inn et gyldig telefonnummer.')
    .max(30, 'Telefonnummeret kan ikke være lengre enn 30 tegn.')
    .regex(
      /^[+\d][\d\s().-]+$/,
      'Skriv inn et gyldig telefonnummer.'
    ),
  email: z
    .string()
    .trim()
    .email('Skriv inn en gyldig e-postadresse.')
    .max(254, 'E-postadressen er for lang.'),
  productHandle: z.literal('utekos-dun'),
  entryPoint: productWaitlistEntryPointSchema.default(
    'product_page'
  ),
  privacy: z.boolean().refine(value => value, {
    message:
      'Du må bekrefte at du har lest hvordan vi behandler ventelisteopplysningene.'
  }),
  marketing: z.boolean().default(false),
  website: z.string().max(200).optional()
})

export type ProductWaitlistData = z.infer<
  typeof ProductWaitlistSchema
>
