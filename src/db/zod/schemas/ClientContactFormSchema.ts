// Path: src/db/zod/schemas/ContactFormSchema.client.ts
'use client'

import { z } from '@/db/zod/zodClient'

export const ClientContactFormSchema = z.object({
  name: z
    .string()
    .check(z.minLength(2, { error: 'Navn må være minst 2 tegn.' })),
  email: z.email({ error: 'E-post er ikke gyldig.' }),
  phone: z.optional(z.string()),
  country: z.string().check(z.minLength(1, { error: 'Land er påkrevd.' })),
  orderNumber: z.optional(z.string()),
  message: z
    .string()
    .check(z.minLength(10, { error: 'Melding må være minst 10 tegn.' })),
  privacy: z
    .boolean()
    .check(
      z.refine(v => v === true, {
        error: 'Du må bekrefte at du har lest personvernerklæringen.'
      })
    )
})

export type ClientContactFormData = z.infer<typeof ClientContactFormSchema>
