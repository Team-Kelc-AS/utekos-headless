import { z } from 'zod'

export const DunWaitlistPageSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Skriv inn en gyldig e-postadresse.')
    .max(254, 'E-postadressen er for lang.'),
  phone: z
    .string()
    .trim()
    .min(5, 'Skriv inn et gyldig mobilnummer.')
    .max(30, 'Mobilnummeret kan ikke være lengre enn 30 tegn.')
    .regex(
      /^[+\d][\d\s().-]+$/,
      'Skriv inn et gyldig mobilnummer.'
    ),
  website: z.string().max(200).optional()
})

export type DunWaitlistPageData = z.infer<
  typeof DunWaitlistPageSchema
>
